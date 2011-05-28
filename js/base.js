/**
 * @fileoverview Base classes for Sakura Drops app.
 * @author peng@pengxwang.com (Peng Wang)
 */

// ----------------------------------------
// OVERHEAD
// ----------------------------------------
_.namespace(pkg + 'sakuraDrops');
_.using(pkg + '*', function () {
var app = sakuraDrops, 
  C = app.constants,
  M = app.Math, 
  canvas, context,
  /** 
   * A hack to update the scope globals for canvas when canvas is ready. 
   *      This needs to be called in the constructor of every class and 
   *      included in files needing the app's scope globals.
   */
  requireCanvasGlobals = function () {
    if (!canvas) {
      canvas = app.canvas;
      context = canvas.context;
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
 * @param {!Object} params Parameters as key-value pairs:
 *      <br/>pos Defaults to current canvas pen position.
 *      <br/>ang Defaults to 0.
 *      <br/>luck Defaults to random.
 *      <br/>rad Defaults to {@link .BASE_RAD}.
 *      <br/>lineWidth Defaults to {@link .BASE_LINEWIDTH}.
 */
app.BaseNode = util.Circle.extend(util.extend({
  /** @lends app.BaseNode# */
  ang: undefined,
  luck: undefined,
  lineWidth: undefined,
  glowDist: undefined,
  angStart: undefined,
  angEnd: undefined,
  inBounds: undefined,
  isAwake: undefined,
  spinAnimation: undefined,
  // ----------------------------------------
  // ACCESSORS
  // ----------------------------------------
  /**
   * Accessor.
   * @return {number}
   */
  getArcLen: function () {
    return M.abs(this.angEnd - this.angStart);
  },
  // ----------------------------------------
  // METHODS
  // ----------------------------------------
  /**
   * Sets up node and does some initial actions. Supports delegation.
   * @see #update
   * @see #didCreate
   */
  _construct: function (params) {
    requireCanvasGlobals();
    this.pos = {};
    this.pos.x = util.toInt(params.pos.x) || canvas.getX();
    this.pos.y = util.toInt(params.pos.y) || canvas.getY();
    this.ang = 0;
    this.rad = params.rad || C.BASE_NODE.rad;
    this.luck = util.isNumber(params.luck) ? params.luck : M.random();
    this.lineWidth = params.lineWidth || C.BASE_NODE.lineWidth;
    this.glowDist = M.pow(this.lineWidth, 4) + C.BASE_NODE.glowDistance;
    this.angStart = params.angStart || 0;
    this.angEnd = params.angEnd || PI * 2;
    this.inBounds = params.inBounds || false;
    this.isAwake = false;
    this.didCreate();
  },
  // ----------------------------------------
  // DELEGATES
  // ----------------------------------------
  /**#@+
     Delegate method container; extend and fill as needed.
  */
  didCreate: function () {},
  didWake: function () {},
  didSleep: function () {},
  onDraw: function () {},
  onDrawRing: function () {},
  onSpin: function () {},
  /**#@-*/
  // ----------------------------------------
  // HELPERS
  // ----------------------------------------
  /** Stay within the canvas, adjusted for radius and stroke. */
  stayInBounds: function () {
    var d = this.rad + this.lineWidth * 3;
    this.pos.x = util.toInt(util.constrain(this.pos.x, d, canvas.getWidth() - d));
    this.pos.y = util.toInt(util.constrain(this.pos.y, d, canvas.getHeight() - d));
  },
  // ----------------------------------------
  // DRAW BASE NODE
  // ----------------------------------------
  /**
   * Drawing API. Moves the pen first. Supports delegation. 
   * @see #onDraw
   */
  draw: function () {
    canvas.movePlotter(this.pos.x, this.pos.y);
    this.onDraw();
  },
  /**
   * Root ring drawing function. Sets the stroke and adds glow in own context.
   * @see #_addGlow
   */
  _drawRing: function () {
    context.save();
    context.lineWidth = this.lineWidth;
    this._addGlow('onDrawRing');
    context.restore();
  },
  /**
   * Adds glow to any path, which gets drawn multiple times in own context. 
   * @param {!function(array)} drawLayerCallback Required drawing socket.
   * @param {?number=} glowDist Optional custom distance.
   * @param {?Array=} callbackArgs Parameters for the socket as needed.
   */
  _addGlow: function (drawLayerSocket, glowDist, callbackArgs) {
    context.save();
    glowDist = glowDist || this.glowDist;
    var d = 0;
    for (var i = 0; i < glowDist; i += 1) {
      d = 1 + M.pow(i/glowDist, 2);
      context.lineWidth += d;
      this[drawLayerSocket].apply(this, callbackArgs || []);
    }
    context.restore();
  },
  // ----------------------------------------
  // BEHAVIORS
  // ----------------------------------------
  /**
   * Naturally activate other behaviors and node.
   */
  wake: function () {
    if (this.isAwake) {
      // return;
    }
    this.isAwake = true;
    this.startSpin();
    this.didWake();
    // console.logAtPos('woke', this); 
  },
  /**
   * Naturally deactivate other behaviors and node.
   */
  sleep: function () {
    if (!this.isAwake) {
      // return;
    }
    this.isAwake = false;
    this.stopSpin();
    this.didSleep();
    // console.logAtPos('slept', this); 
  },
  /**
   * @name app.BaseNode#didAnimationStep
   * @event
   * @param {Event} e
   */
  /**
   * Starts spin animation and set binding as needed. Currently spins
   *      for a pseudorandom distance with easing.
   * @see #getSpinStep
   */
  startSpin: function () {
    var _this = this,
      beginning = this.ang,
      change = M.PI * util.simpleRandom(C.BASE_NODE.spinMin, C.BASE_NODE.spinMax),
      duration = C.BASE_NODE.spinSpeed,
      callback = function (elapsed, complete) {
        if (complete) {
          _this.sleep();
        } else {
          _this.ang = util.easeInOutCubic(elapsed, beginning, change, duration);
          _this.onSpin();
          _this.trigger('didAnimationStep');
          // console.log('animationStep');
        }
      };
    if (!this.spinAnimation) {
      this.spinAnimation = canvas.animate(null, callback, duration);
    } else {
      canvas.animate(null, callback, duration, this.spinAnimation);
    }
  },
  /**
   * Stops spinning animation.
   */
  stopSpin: function () {
    canvas.pauseAnimation(this.spinAnimation);
  },
  /** @ignore */
  toString: function () {
    return pkg + 'sakuraDrops.BaseNode';
  }
}, module.EventMixin));
// ----------------------------------------
// CLASS
// ----------------------------------------
/**
 * @class Base functionality shared by all node managers in this app.
 * @augments hlf.util.BaseClass
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
app.BaseManager = util.BaseClass(util.extend(util.CanvasEventMixin, {
  /** @lends app.BaseManager# */
  $canvas: undefined,
  nodes: undefined,
  params: undefined,
  unitTest: undefined,
  ready: undefined,
  /**
   * @see #didCreate
   * @see #_populate
   */
  _construct: function (params) {
    requireCanvasGlobals();
    this.params = params;
    this.$canvas = $(canvas.canvas);
    this.unitTest = params.unitTest || false;
    this._populate();
    this.bindMouse();
    this.ready = {};
    this.didCreate();
  },
  // ----------------------------------------
  // DELEGATES
  // ----------------------------------------
  /**#@+
     Delegate method container; extend and fill as needed. 
     Return true for will and did delegates to break from the procedure.
  */
  onPopulate: function () {},
  onUpdate: function () {},
  didCreate: function () {},
  didDraw: function () {},
  didLoad: function () {},
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
  _populate: function () {
    var _this = this;
    if (this.unitTest) {
      this.params.num = 1;
    }
    this.nodes = [];
    for (var i = 0; i < this.params.num; i += 1) {
      this.nodes[i] = this.onPopulate(i);
      this.nodes[i].bind('didAnimationStep', function () {
        _this.draw();
      });
    }        
  },
  /**
   * Updating API. 
   * @see #onUpdate
   */
  update: function () {
    this.onUpdate();
  },
  // ----------------------------------------
  // DRAW NODES
  // ----------------------------------------
  /**
   * Sets the canvas context to use the default theme, which is 
   *      translucent white fill and stroke with round caps.
   */ 
  theme: function () {
    context.lineCap = 'round';
    context.fillStyle = 'rgba(255,255,255, .2)';
    context.strokeStyle = 'rgba(255,255,255, .2)';            
  },
  /**
   * Drawing API. Runs a loop to use each node's drawing API.
   * @see #didDraw
   * @see #theme
   */
  draw: function () {
    this.theme();
    for (var i = 0, l = this.nodes.length; i < l; i += 1) {
      this.nodes[i].draw();
    }
    this.didDraw();
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
  onMouseMove: function (evt) {
    if (!this.ready.mouseMove) {
      return;
    }
    // console.log('onMouseMove');
    var _this = this;
    for (var i = 0, l = this.nodes.length; i < l; i += 1) {
      if (this._contains(this.nodes[i], {x: evt.offsetX, y: evt.offsetY})) {
        // moved from blank space
        this.nodes[i].wake();
        this.ready.mouseMove = false;
        setTimeout(function () {
          _this.ready.mouseMove = true;
        }, C.MOUSEMOVE_TIMEOUT);
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
    return util.dist(dx, dy) <= node.rad;
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
      d = util.dist(dx, dy);
    return d < node1.rad || d < node2.rad;
  },
  /** @ignore */
  toString: function () {
    return pkg + 'sakuraDrops.BaseManager';
  }
}, module.EventMixin));
}); // namespace