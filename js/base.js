/**
 * @fileoverview Base classes for Sakura Drops app.
 * @author peng@pengxwang.com (Peng Wang)
 */
// ----------------------------------------
// INTRO
// ----------------------------------------
_.namespace(hlfPkg + '.sakuraDrops');
(function(hlf){
var App = hlf.sakuraDrops, Ut = hlf.util, Mod = hlf.module, 
    Co = App.constants, Ma = App.Math;
/**
 * TODO doc
 */
App.RipplingMixin = {
  canRipple: true,
  currentRipple: undefined,
  /**
   * TODO doc
   */
  startRipple: function(type){
    var node = this._randomNode();
    this.currentRipple = {
      affectedNodes: []
    };
    console.log(node, 'startRipple');
    this.affectNode(node, type);
  },
  /**
   * TODO doc
   */
  stopRipple: function(){
    for (var i = 0; i < this.nodes.length; i += 1) {
      if (this.nodes[i].isAwake) {
        this.nodes[i].stopRippleEffect();
      }
    }
  },
  /**
   * TODO doc
   */
  affectNode: function(node, type){
    node.bind_('rippleDidAffect', this.afterAffectNode, this);
    node.startRippleEffect(type);
  },
  /**
   * TODO doc
   */
  afterAffectNode: function(node, type){
    this.currentRipple.affectedNodes.push(node.uid);
    this.affectNodeNeighbors(node, type);
    node.unbind('rippleDidAffect');
  },
  /**
   * TODO doc
   */
  affectNodeNeighbors: function(node, type){
    var testNode = Ut.extend({}, node);
    testNode.rad += 5;
    console.log(testNode, 'affectNodeNeighbors');
    for (var i = 0; i < this.nodes.length; i += 1) {
      if (this._nodesIntersect(this.nodes[i], testNode)
          && this.currentRipple.affectedNodes.indexOf(this.nodes[i].uid) === -1
          && this.nodes[i].uid !== testNode.uid) {
        console.log(this.nodes[i], 'affectNode');
        this.affectNode(this.nodes[i], type);
      }
    }
  }
};

/**
 * @class Base functionality shared by all nodes in this app.
 * @augments hlf.util.Circle
 * @augments hlf.module.EventMixin
 * @property {number} ang Rotation offset.
 * @property {number} luck Chance of certain traits.
 * @property {number} lineWidth Base stroke size, if applicable.
 * @property {number} glowDist Size of glowing stroke, related to base stroke.
 * @property {number} angStart Where arc starts, in radians.
 * @property {number} angEnd Where arc ends, in radians.
 * @property {boolean} inBounds Requirement to be entirely visible on canvas.
 * @property {boolean} isAwake Waking behavior, generally waking on user
 *      interaction and returning to sleep after a period of inactivity.
 * @property {number} spinAnimation Animation id in the canvas' index.
 * TODO doc
 * @param {!Object} params Parameters as key-value pairs:
 *      <br/>pos Defaults to current canvas pen position.
 *      <br/>ang Defaults to 0.
 *      <br/>luck Defaults to random.
 *      <br/>rad Defaults to {@link .BASE_RAD}.
 *      <br/>lineWidth Defaults to {@link .BASE_LINEWIDTH}.
 */
App.BaseNode = Ut.Circle.extend(Ut.extend({
  /** @lends App.BaseNode# */
  uid: undefined,
  ang: undefined,
  luck: undefined,
  lineWidth: undefined,
  glowDist: undefined,
  glowVal: undefined,
  angStart: undefined,
  angEnd: undefined,
  inBounds: undefined,
  isAwake: undefined,
  spinAnimation: undefined,
  pulseAnimation: undefined,
  unitTest: undefined,
  _runningAnimations: undefined,
  // ----------------------------------------
  // ACCESSORS
  // ----------------------------------------
  /**
   * Accessor.
   * @return {number}
   */
  getArcLen: function(){
    return Ma.abs(this.angEnd - this.angStart);
  },
  // ----------------------------------------
  // METHODS
  // ----------------------------------------
  /**
   * Sets up node and does some initial actions. 
   * @see #update
   * @see #didCreate
   */
  _init: function(params){
    this.uid = params.uid;
    this.pos = params.pos || App.canvas.getCenter();
    this.ang = 0;
    this.rad = params.rad || Co.BASE_NODE.rad;
    this.luck = Ut.isNumber(params.luck) ? params.luck : Ma.random();
    this.lineWidth = params.lineWidth || Co.BASE_NODE.lineWidth;
    this.glowDist = Ma.pow(this.lineWidth, 4) + Co.BASE_NODE.glowDistance;
    this.glowVal = params.glowVal || Co.BASE_NODE.glowValue;
    this.angStart = params.angStart || 0;
    this.angEnd = params.angEnd || PI * 2;
    this.inBounds = params.inBounds || false;
    this.isAwake = false;
    this.unitTest = params.unitTest || false;
    this._runningAnimations = [];
  },
  // ----------------------------------------
  // DELEGATES
  // ----------------------------------------
  /**#@+
     Delegate method container; extend and fill as needed.
  */
  onDrawRing: function(){},
  /**#@-*/
  // ----------------------------------------
  // HELPERS
  // ----------------------------------------
  /** Stay within the canvas, adjusted for radius and stroke. */
  stayInBounds: function(){
    var d = this.rad + this.lineWidth * 3;
    this.pos.x = Ut.toInt(Ut.constrain(this.pos.x, d, App.canvas.getWidth() - d));
    this.pos.y = Ut.toInt(Ut.constrain(this.pos.y, d, App.canvas.getHeight() - d));
  },
  // ----------------------------------------
  // DRAW BASE NODE
  // ----------------------------------------
  /**
   * Drawing API. Moves the pen first. 
   */
  draw: function(){
    App.canvas.movePlotter(this.pos.x, this.pos.y);
    // handle it in subclass  
  },
  /**
   * Root ring drawing function. Sets the stroke and adds glow in own context.
   * @see #_addGlow
   */
  _drawRing: function(){
    App.context.save();
    App.context.lineWidth = this.lineWidth;
    this._addGlow('onDrawRing');
    App.context.restore();
  },
  /**
   * Adds glow to any path, which gets drawn multiple times in own context. 
   * @param {!function(array)} drawLayerCallback Required drawing socket.
   * @param {?number=} glowDist Optional custom distance.
   * @param {?Array=} callbackArgs Parameters for the socket as needed.
   */
  _addGlow: function(drawLayerSocket, glowDist, callbackArgs){
    App.context.save();
    glowDist = glowDist || this.glowDist;
    var d = 0;
    for (var i = 0; i < glowDist; i += 1) {
      d = 1 + Ma.pow(i/glowDist, 2);
      App.context.lineWidth += d;
      this[drawLayerSocket].apply(this, callbackArgs || []);
    }
    App.context.restore();
  },
  // ----------------------------------------
  // BEHAVIORS
  // ----------------------------------------
  /**
   * Naturally activate other behaviors and node.
   */
  _tryToWake: function(){
    // console.log('try to wake');
    if (this.isAwake || !this._runningAnimations.length) {
      return;
    }
    this.isAwake = true;
    this.trigger('didWake');
    // console.logAtPos('woke', this); 
  },
  /**
   * Naturally deactivate other behaviors and node.
   */
  _tryToSleep: function(){
    // console.log('try to sleep');
    if (!this.isAwake || this._runningAnimations.length) {
      return;
    }
    this.isAwake = false;
    this.trigger('didSleep');
    // console.logAtPos('slept', this); 
  },
  /**
   * TODO doc
   */
  _startAnimation: function(name, callback, duration, options){
    name = name+'Animation';
    if (!name in this || this._runningAnimations.indexOf(name) !== -1) {
      return;
      // throw {
      //   message: 'Animation cannot run'
      // };
    }
    this[name] = App.canvas.animate(options, callback, duration, this[name]);
    // console.log(this[name], 'Animation started');
    this._runningAnimations.push(name);
    this._tryToWake();
  },
  /**
   * TODO doc
   */
  _stopAnimation: function(name){
    name = name+'Animation';
    if (!name in this || this._runningAnimations.indexOf(name) === -1) {
      return;
    }
    App.canvas.pauseAnimation(this[name]);
    // console.log(this[name], 'Animation stopped');
    this._runningAnimations.splice(this._runningAnimations.indexOf(name), 1);
    this._tryToSleep();
  },
  /**
   * @name App.BaseNode#didAnimationStep
   * @event
   * @param {Event} e
   */
  /**
   * Starts spin animation and set binding as needed. Currently spins
   *      for a pseudorandom distance with easing.
   * @see #getSpinStep
   */
  startSpin: function(){
    var beginning = this.ang,
        change = Ma.PI * Ut.simpleRandom(Co.BASE_NODE.spinMin, Co.BASE_NODE.spinMax),
        duration = Co.BASE_NODE.spinSpeed,
        callback = _.bind(function(elapsed, complete){
          if (complete) {
            this.stopSpin();
            return;
          } 
          this.ang = Ut.easeInOutCubic(elapsed, beginning, change, duration);
          this.trigger('didAnimationStep');
        }, this);
    this._startAnimation('spin', callback, duration);
  },
  /**
   * Stops spinning animation.
   */
  stopSpin: function(){
    this._stopAnimation('spin');
  },
  /**
   * TODO doc
   * TODO refine oscillation
   */
  startPulse: function(type, options, cb){
    options = Ut.extend(Co.PULSE.defaultOptions, options);
    var _origin = beginning = this.glowVal,
        change = this.glowVal/2 * options.dir,
        duration = Co.BASE_NODE.glowSpeed,
        callback = _.bind(function(elapsed, complete){
          if (complete) {
            beginning = this.glowVal;
            change *= -1;
            if (Ma.abs(beginning - _origin) < 0.01) {
              this.trigger('didPulsePeriod');
              if (typeof cb !== 'undefined') {
                cb();
              }
              if (options.repeat === 1) {
                this.stopPulse(type, true);
                return;
              }
              if (options.repeat && options.repeat < Infinity) {
                options.repeat -= 1;
              }
            }
          } 
          this.trigger('willDoAnimationStep', type);
          this.glowVal = Ut.easeInOutCubic(elapsed, beginning, change, duration);
          // console.log(this.glowVal, this.uid, 'frame');
          App.context.strokeStyle = App.canvas.foregroundColor
            .stringWithAlpha(this.glowVal);
          this.trigger('didAnimationStep', type);
        }, this);
    this._startAnimation('pulse', callback, duration, options);
  },
  /**
   * TODO doc
   * Eased interruption
   */
  stopPulse: function(type, force){
    if (force) {
      this._stopAnimation('pulse');
    } else {
      var cb = _.bind(function(){
            this._stopAnimation('pulse');
            this.unbind('didPulsePeriod', cb);
            this.trigger('didAnimationStep', type); // ?
          }, this);
      this.bind('didPulsePeriod', cb);
    }
  },
  /**
   * TODO doc
   */
  startRippleEffect: function(type){
    if (type === Co.PULSE.SEQUENTIAL) {
      this.startPulse(type, { repeat:1 }, _.bind(function(){
        this.trigger('rippleDidAffect', this, type);
      }, this));
      console.log(this.uid, 'startRippleEffect');
    }
  },
  /**
   * TODO doc
   */
  stopRippleEffect: function(type){
    if (type === Co.PULSE.SEQUENTIAL) {
      this.stopPulse();
    }
  },
  /** @ignore */
  toString: function(){
    return hlfPkg + '.sakuraDrops.BaseNode';
  }
}, Mod.EventMixin));
// ----------------------------------------
// CLASS
// ----------------------------------------
/**
 * @class Base functionality shared by all node managers in this app.
 * @augments hlf.util.Class
 * @augments hlf.module.EventMixin
 * @augments hlf.util.CanvasEventMixin
 * @property {jQuery} $canvas Canvas jQuery element, required for event delegation.
 * @property {Array hlf.sakuraDrops.BaseNode} nodes Index of all nodes.
 * @property {Object} params Bin for storing all the manager settings.
 * @property {boolean} unitTest For testing, only run one node.
 * @property {Object boolean} ready State flags useful for event handlers.
 * @param {!Object} params Settings as key-value pairs:
 *      <br/>num Required.
 *      <br/>unitTest Defaults to false.
 */
App.BaseManager = Ut.Class.extend(Ut.extend(Ut.CanvasEventMixin, {
  /** @lends App.BaseManager# */
  $canvas: undefined,
  nodes: undefined,
  params: undefined,
  unitTest: undefined,
  ready: undefined,
  /**
   * @see #populate
   */
  _init: function(params){
    this.params = params;
    this.$canvas = $(App.canvas.canvas);
    this.unitTest = params.unitTest || false;
    this.setTheme();
    this.populate();
    this.bindMouse();
    this.ready = {};
  },
  // ----------------------------------------
  // DELEGATES
  // ----------------------------------------
  /**#@+
     Delegate method container; extend and fill as needed.
     Return true for will and did delegates to break from the procedure.
  */
  /**
   * @return {hlf.sakuraDrops.BaseNode node}
   */
  onPopulate: function(){},
  /**#@-*/
  // ----------------------------------------
  // SETUP NODES
  // ----------------------------------------
  /**
   * Runs a loop to instantiate the nodes, including binding to
   *      node events.
   * @see hlf.sakuraDrops.BaseNode#didAnimationStep
   * @see #onPopulate
   */ 
  populate: function(){
    if (this.unitTest) {
      this.params.num = 1;
    }
    this.nodes = [];
    for (var i = 0; i < this.params.num; i += 1) {
      this.nodes[i] = this.onPopulate(i);
      this.nodes[i].bind_('willDoAnimationStep', function(type){
        if (type === Co.PULSE.SEQUENTIAL) {
          // console.log('saving');
          App.context.save();
        } 
      }, this);
      this.nodes[i].bind_('didAnimationStep', function(type){
        this.draw();
        if (type === Co.PULSE.SEQUENTIAL) {
          // console.log('restoring');
          App.context.restore();
        } 
      }, this);
    }        
  },
  /**
   * Updating API. 
   */
  update: function(){
      this.setTheme();
  },
  // ----------------------------------------
  // DRAW NODES
  // ----------------------------------------
  /**
   * Sets the canvas context to use the default theme, which is 
   *      translucent white fill and stroke with round caps.
   */ 
  setTheme: function(){
    App.canvas.backgroundColor = App.palette.black;
    App.canvas.foregroundColor = App.palette.white;
    App.context.lineCap = 'round';
    App.context.fillStyle = App.canvas.foregroundColor
      .stringWithAlpha(Co.BASE_NODE.glowValue);
    App.context.strokeStyle = App.canvas.foregroundColor
      .stringWithAlpha(Co.BASE_NODE.glowValue);
  },
  /**
   * Drawing API. Runs a loop to use each node's drawing API.
   * @see #didDraw
   * @see #theme
   */
  draw: function(){
    for (var i = 0, l = this.nodes.length; i < l; i += 1) {
      this.nodes[i].draw();
    }
  },
  // ----------------------------------------
  // INPUT
  // ----------------------------------------
  /**
   * Wakes the node if needed when mouse moves inside the canvas. The 
   *      index position of the focused node is updated. The previous node
   *      is put to sleep, if needed. Runs a loop and exits upon finding 
   *      active node.
   * @param {!Event} evt jQuery mousemove event.
   * @todo Disabled sleep on focus out until slowSpin exists.
   */
  onMouseMove: function(evt){
    if (!this.ready.mouseMove) {
      return;
    }
    // console.log('onMouseMove');
    for (var i = 0, l = this.nodes.length; i < l; i += 1) {
      if (this._nodeContainsPoint(this.nodes[i], {x: evt.offsetX, y: evt.offsetY})) {
        // moved from blank space
        this.nodes[i].startSpin();
        this.ready.mouseMove = false;
        setTimeout(_.bind(function(){
          this.ready.mouseMove = true;
        }, this), Co.MOUSEMOVE_TIMEOUT);
        break;
      }
    }
  },    
  // ----------------------------------------
  // UTILITY
  // ----------------------------------------
  /**
   * Utility function to check if a node is on a position.
   * @param {!hlf.sakuraDrops.BaseNode} node 
   * @param {!Object number} pos 
   * @return {boolean}
   */
  _nodeContainsPoint: function(node, pos) {
    var dx = node.pos.x - pos.x,
        dy = node.pos.y - pos.y;
    return Ut.dist(dx, dy) <= node.rad;
  },
  /**
   * Utility function to check if nodes intersect.
   * @param {!hlf.sakuraDrops.BaseNode} node1 
   * @param {!hlf.sakuraDrops.BaseNode} node2 
   * @return {boolean}
   */
  _nodesIntersect: function(node1, node2) {
    var dx = node2.pos.x - node1.pos.x,
        dy = node2.pos.y - node1.pos.y,
        d = Ut.dist(dx, dy);
    return d < node1.rad + node2.rad;
  },
  /**
   * TODO doc
   */
  _randomNode: function(){
    return this.nodes[Ut.toInt(Ut.simpleRandom(this.nodes.length-1))];
  },
  /**
   * TODO doc
   */
  startPulse: function(type){
    switch (type) {
      case Co.PULSE.SEQUENTIAL:
        if (this.canRipple) {
          this.startRipple(type);
        }
        break;
      case Co.PULSE.UNIFORM:
        break;
    }
  },
  /**
   * TODO doc
   */
  stopPulse: function(type){
    switch (type) {
      case Co.PULSE.SEQUENTIAL:
        if (this.canRipple) {
          this.stopRipple(type);
        }
        break;
      case Co.PULSE.UNIFORM:
        break;
    }
  },
  /** @ignore */
  toString: function(){
    return hlfPkg + '.sakuraDrops.BaseManager';
  }
}, Mod.EventMixin, App.RipplingMixin));
// ----------------------------------------
// OUTRO
// ----------------------------------------
})(_.namespace(hlfPkg));