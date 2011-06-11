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
 * @param {!Object} params Parameters as key-value pairs:
 *      <br/>pos Defaults to current canvas pen position.
 *      <br/>ang Defaults to 0.
 *      <br/>luck Defaults to random.
 *      <br/>rad Defaults to {@link .BASE_RAD}.
 *      <br/>lineWidth Defaults to {@link .BASE_LINEWIDTH}.
 */
App.BaseNode = Ut.Circle.extend(Ut.extend({
  /** @lends App.BaseNode# */
  ang: undefined,
  luck: undefined,
  lineWidth: undefined,
  glowDist: undefined,
  angStart: undefined,
  angEnd: undefined,
  inBounds: undefined,
  isAwake: undefined,
  spinAnimation: undefined,
  unitTest: undefined,
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
   * Sets up node and does some initial actions. Supports delegation.
   * @see #update
   * @see #didCreate
   */
  _init: function(params){
    this.pos = {};
    this.pos.x = Ut.toInt(params.pos.x || App.canvas.getCenter().x);
    this.pos.y = Ut.toInt(params.pos.y || App.canvas.getCenter().y);
    this.ang = 0;
    this.rad = params.rad || Co.BASE_NODE.rad;
    this.luck = Ut.isNumber(params.luck) ? params.luck : Ma.random();
    this.lineWidth = params.lineWidth || Co.BASE_NODE.lineWidth;
    this.glowDist = Ma.pow(this.lineWidth, 4) + Co.BASE_NODE.glowDistance;
    this.angStart = params.angStart || 0;
    this.angEnd = params.angEnd || PI * 2;
    this.inBounds = params.inBounds || false;
    this.isAwake = false;
    this.unitTest = params.unitTest || false;
  },
  // ----------------------------------------
  // DELEGATES
  // ----------------------------------------
  /**#@+
     Delegate method container; extend and fill as needed.
  */
  onSpin: function(){},
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
   * Drawing API. Moves the pen first. Supports delegation. 
   */
  draw: function(){
    App.canvas.movePlotter(this.pos.x, this.pos.y);
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
  wake: function(){
    if (this.isAwake) {
      // return;
    }
    this.isAwake = true;
    this.startSpin();
    this.trigger('didWake');
    // console.logAtPos('woke', this); 
  },
  /**
   * Naturally deactivate other behaviors and node.
   */
  sleep: function(){
    if (!this.isAwake) {
      // return;
    }
    this.isAwake = false;
    this.stopSpin();
    this.trigger('didSleep');
    // console.logAtPos('slept', this); 
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
            this.sleep();
          } else {
            this.ang = Ut.easeInOutCubic(elapsed, beginning, change, duration);
            this.onSpin();
            this.trigger('didAnimationStep');
            // console.log('animationStep');
          }
        }, this);
    if (!this.spinAnimation) {
      this.spinAnimation = App.canvas.animate(null, callback, duration);
    } else {
      App.canvas.animate(null, callback, duration, this.spinAnimation);
    }
  },
  /**
   * Stops spinning animation.
   */
  stopSpin: function(){
    App.canvas.pauseAnimation(this.spinAnimation);
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
      this.nodes[i].bind_('didAnimationStep', function(){
        this.draw();
      }, this);
    }        
  },
  /**
   * Updating API. 
   */
  update: function(){},
  // ----------------------------------------
  // DRAW NODES
  // ----------------------------------------
  /**
   * Sets the canvas context to use the default theme, which is 
   *      translucent white fill and stroke with round caps.
   */ 
  theme: function(){
    App.context.lineCap = 'round';
    App.context.fillStyle = 'rgba(255,255,255, .2)';
    App.context.strokeStyle = 'rgba(255,255,255, .2)';            
  },
  /**
   * Drawing API. Runs a loop to use each node's drawing API.
   * @see #didDraw
   * @see #theme
   */
  draw: function(){
    this.theme();
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
      if (this._contains(this.nodes[i], {x: evt.offsetX, y: evt.offsetY})) {
        // moved from blank space
        this.nodes[i].wake();
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
  _contains: function(node, pos) {
    var dx = node.pos.x - pos.x,
        dy = node.pos.y - pos.y;
    return Ut.dist(dx, dy) <= node.rad;
  },
  /**
   * Utility function to check if nodes overlap.
   * @param {!hlf.sakuraDrops.BaseNode} node1 
   * @param {!hlf.sakuraDrops.BaseNode} node2 
   * @return {boolean}
   */
  _intersects: function(node1, node2) {
    var dx = node2.pos.x - node1.pos.x,
        dy = node2.pos.y - node1.pos.y,
        d = Ut.dist(dx, dy);
    return d < node1.rad || d < node2.rad;
  },
  /** @ignore */
  toString: function(){
    return hlfPkg + '.sakuraDrops.BaseManager';
  }
}, Mod.EventMixin));
// ----------------------------------------
// OUTRO
// ----------------------------------------
})(_.namespace(hlfPkg));