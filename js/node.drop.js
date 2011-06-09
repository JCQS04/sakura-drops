/**
 * @fileoverview Drop node class for Sakura Drops app.
 * @author peng@pengxwang.com (Peng Wang)
 */
// ----------------------------------------
// INTRO
// ----------------------------------------
_.namespace(hlfPkg + '.sakuraDrops');
(function(hlf) {
var App = hlf.sakuraDrops, Ut = hlf.util, Mod = hlf.module, 
    Co = App.constants, Ma = App.Math;
// ----------------------------------------
// CLASS
// ----------------------------------------
var Co_ = App.constants.DROP_NODE;
/**
 * @class The most common type of nodes. Each node can have segmented inner and 
 *      outer arcs, though the visual results vary based on chance and parameterization. 
 *      Having an shorter and smaller arcs generally don't have inner rings. 
 *      Outer segmentation is generally due to luck, which also affects size. 
 *      Segments are separated by short, uniform breaks.
 * @augments hlf.sakuraDrops.BaseNode
 * @property {Object} innerRing Collection of inner ring properties. Inner ring
 *      has shorter radius, thinner stroke, bigger gaps, and links to outer ring 
 *      at the ends. A base radius requirement is needed to have an inner ring. 
 *      Inner rings also have a rotation offset from the outer ring. The end 
 *      structure of the inner ring also decides how it bridges with the outer ring.
 *      Properties:
 *      <br/>rad Based on innerRad constant.
 *      <br/>lineWidth Based on innerLineWidth constant.
 *      <br/>angStart Based on Math.QTR_PI.
 *      <br/>andEnd Based on Math.QTR_PI.
 *      <br/>bridgeBend Based on innerBendMin and innerBendMax constants.
 *      <br/>hasStartBridge Always true, for now.
 *      <br/>hasEndBridge True only if segments run the full ring length.
 * @property {Array Object} outerSegments Segment data for outer ring. Properties:
 *      <br/>angStart
 *      <br/>angEnd
 * @property {Array Object} innerSegments Segment data for inner ring. Properties:
 *      <br/>angStart
 *      <br/>angEnd
 */
App.DropNode = App.BaseNode.extend({
  /** @lends App.DropNode# */
  innerRing: undefined,
  outerSegments: undefined,
  innerSegments: undefined,
  radFinal: undefined,
  introAnimation: undefined,
  // ----------------------------------------
  // ACCESSORS
  // ----------------------------------------
  /**#@+
     Accessor.
     @return {boolean}
     @see radWithInnerRing, outerSegmentsChance, innerSegmentsChance constants.
   */
  hasInnerRing: function(){
    return this.innerRing || (this.getArcLen() > Ma.PI && 
      this.radFinal > Co_.radWithInnerRing);
  },
  hasOuterSegments: function(){
    return this.outerSegments || this.luck <= Co_.outerSegmentsChance;
  },
  hasInnerSegments: function(){
    return this.innerRing && (this.innerSegments || 
      this.luck <= Co_.innerSegmentsChance);
  },
  /**#@-*/
  // ----------------------------------------
  // SETUP
  // ----------------------------------------
  // TODO
  /**
   * Setup for the custom node traits. Parameters are built through chance and 
   *      parameterization. 
   * @see #_generateSegments
   * @see radWithInnerRing, innerBuffer, innerRad, innerBendMin, innerBendMax 
   *      constants
   * @see hlf.util.simpleRandom
   */
  _init: function(params){
    this._super(params);
    // deviation from base rad
    var d = Ma.sqrt(Co_.radWithInnerRing / this.rad),
        r = Ut.simpleRandom(-1, 1) * Co_.innerBuffer,
        dir = App.canvas.getAngDir();
    this.radFinal = this.rad;
    this.rad = 0;
    if (this.hasInnerRing()) {
      var ring = {};
      ring.rad = undefined;
      ring.radRatio = Co_.innerRad * d;
      ring.lineWidth = Ma.sqrt(this.lineWidth) * Co_.innerLineWidth * d;
      ring.angStart = this.angStart - d + r * Ma.QTR_PI * dir;
      ring.angEnd = this.angEnd + d + r * Ma.QTR_PI * dir;
      ring.bridgeBend = d * Ut.simpleRandom(Co_.innerBendMin, Co_.innerBendMax);
      ring.hasStartBridge = true;
      ring.hasEndBridge = true;
      this.innerRing = ring; 
    }
    this._generateSegments();
    this._introAnimation();
  },
  /**
   * Super method for generating arc segment data for both outer and inner
   *      rings. Uses inner functions as sub procedures to abstract
   *      common tasks for producing both types of segments. 
   * @see innerSegmentsMax, outerSegmentsMax, innerSegmentBreak, outerSegmentBreak 
   *      segmentFluxMin, segmentFluxMax constants
   * @see hlf.module.Canvas#getAngDir
   */
  _generateSegments: function(){
    var i, l, // counters
        start, // start of ring
        t, // start of current segment
        dist, d, // total ring length and current length
        seg, s, // base segment length and current length
        ds, // segment flux modifier
        br, // segment break length
        dir = App.canvas.getAngDir(); // direction
    /** @inner */
    var setupBasePrc = _.bind(function(type){
      // console.logArc(type == 'outer' ? this : this.innerRing);
      // console.logArc(dist, 'distance for ' + type);
      this[type+'Segments'] = []; i = 0; d = 0; 
      l = Ma.ceil(Ut.simpleRandom(2, Co_[type+'SegmentsMax']));
      start = (type == 'outer') ? this.angStart : this.innerRing.angStart;
      seg = dist / l;
      br = Ma.sqrt(segmentFlux(type)) * Co_[type+'SegmentBreak'] * 
        Ma.max(Ma.pow(this.lineWidth, 2), 1);
    }, this);
    /** @inner */
    var addSegmentPrc = _.bind(function(type){ 
      t = start + d * dir; 
      d += s + br;
      this[type+'Segments'][i] = {
        'angStart': t, 
        'angEnd': t + s * dir
      };
      i += 1;
    }, this);
    /** @inner */
    var segmentFlux = function(type){
      return Ut.simpleRandom(Co_.segmentFluxMin, 
        Co_.segmentFluxMax);
    };
    /** @inner */
    var updateSegment = function(type){
      ds = segmentFlux(type);
      s = ds * seg - br;
      if (type == 'outer') {
        s = Ma.max(s, Ma.H_PI);
      }
    };
    /** @inner */
    var canDrawSegment = function(type){
      updateSegment(type);
      return dist > d + s + br;
    };
    if (this.hasOuterSegments()) {
      dist = Ma.abs(this.angEnd - this.angStart);
      setupBasePrc('outer');
      while (i < l && canDrawSegment('outer')) {
        addSegmentPrc('outer');
      }
      // console.logAtPos('outerSegments', this); 
    }
    if (this.hasInnerSegments()) {
      dist = Ma.abs(this.innerRing.angEnd - this.innerRing.angStart);
      setupBasePrc('inner');
      while (i < l && canDrawSegment('inner')) {
        addSegmentPrc('inner');
      }
      if (Ma.abs(dist - d) > Ma.PI / 8) {
        this.innerRing.hasEndBridge = false;
      }
      // console.logAtPos('innerSegments', this); 
    }
  },
  /**
   * TODO
   */
  _introAnimation: function(){
    var beginning = this.rad,
        change = this.radFinal - this.rad,
        duration = Co_.introSpeed,
        callback = _.bind(function(elapsed, complete){
          if (!complete) {
            this.rad = Ut.easeInOutCubic(elapsed, beginning, change, duration);
            if (this.hasInnerRing()) {
              this.innerRing.rad = this.rad * this.innerRing.radRatio;
            }
            this.trigger('didAnimationStep');
          }
        }, this);
    this.introAnimation = App.canvas.animate(null, callback, duration);
  },
  // ----------------------------------------
  // DRAW
  // ----------------------------------------
  /**
   * Drawing controller for custom node. Because the paths drawn are
   *      organized in a complex way, they must be drawn in a certain order,
   *      almost like drawing with pen in hand.
   * @see #_drawRing
   * @see #_drawInnerRing
   */
  onDraw: function(){
    this._drawRing();
    if (this.hasInnerRing()) {
      this._drawInnerRing();
    }
  },
  // ----------------------------------------
  // OUTER RING
  // ----------------------------------------
  /**
   * Overrides the default implementation to allow segments. If ring has 
   *      no segments, an alternative implementation is drawn.
   * @see #_drawOuterRingSegment
   * @see #_drawOuterRingBody
   */
  _drawRing: function(){
    if (this.hasOuterSegments()) {
      for (var i = 0, l = this.outerSegments.length;
        i < l; i += 1) {
        this._addGlow('_drawOuterRingSegment', null, 
          [this.outerSegments[i]]);
      }
    } else {
      this._addGlow('_drawOuterRingBody');
    }
  },
  /**
   * Draws an arc as a new path and sets the stroke.
   * @param {!Object number} segment
   */
  _drawOuterRingSegment: function(segment){
    App.context.beginPath();
    App.canvas.arc(
      this.pos.x, this.pos.y, this.rad,
      segment.angStart, segment.angEnd, this.ang
    );
    App.context.stroke();        
  },
  /** Draws an arc as a new path and sets the stroke. */
  _drawOuterRingBody: function(){
    App.context.beginPath();
    App.canvas.arc(
      this.pos.x, this.pos.y, this.rad,
      this.angStart, this.angEnd, this.ang
    );
    App.context.stroke();
  },
  // ----------------------------------------
  // INNER RING
  // ----------------------------------------
  /**
   * Main inner ring drawing procedure. If ring has no segments, 
   *      an alternative implementation is drawn.
   * @see #_drawInnerRingStart
   * @see #_drawInnerRingSegment
   * @see #_drawInnerRingBody
   * @see #_drawInnerRingEnd
   * @see innerGlow constant
   */
  _drawInnerRing: function(){
    App.context.save();
    App.context.lineWidth = this.innerRing.lineWidth;
    if (this.innerRing.hasStartBridge) {
      this._addGlow('_drawInnerRingStart', this.glowDist * Co_.innerGlow);
    }
    if (this.hasInnerSegments()) {
      for (var i = 0, l = this.innerSegments.length;
        i < l; i += 1) {
        this._addGlow('_drawInnerRingSegment', this.glowDist * Co_.innerGlow, 
          [this.innerSegments[i]]);
      }
    } else {
      this._addGlow('_drawInnerRingBody', this.glowDist * Co_.innerGlow);
    }
    if (this.innerRing.hasEndBridge) {
      this._addGlow('_drawInnerRingEnd', this.glowDist * Co_.innerGlow);
    }
    App.context.restore();
  },
  /** Draws start bridge as a new path and sets the stroke. */
  _drawInnerRingStart: function(){
    var r = this.innerRing;
    App.context.beginPath();
    App.context.lineTo(
      // outer ring start point
      this.pos.x + this.rad * Ma.cos(r.angStart + this.ang + r.bridgeBend), 
      this.pos.y + this.rad * Ma.sin(r.angStart + this.ang + r.bridgeBend) 
    );
    App.context.quadraticCurveTo(
      // inner ring start point
      this.pos.x + r.rad * Ma.cos(r.angStart + this.ang + r.bridgeBend),
      this.pos.y + r.rad * Ma.sin(r.angStart + this.ang + r.bridgeBend),
      this.pos.x + r.rad * Ma.cos(r.angStart + this.ang),
      this.pos.y + r.rad * Ma.sin(r.angStart + this.ang)
    );
    App.context.stroke();
  },
  /** Draws an arc as a new path and sets the stroke. */
  _drawInnerRingBody: function(){
    App.context.beginPath();
    App.canvas.arc(
      this.pos.x, this.pos.y, this.innerRing.rad,
      this.innerRing.angStart, this.innerRing.angEnd, this.ang
    );
    App.context.stroke();
  },
  /**
   * Draws an arc as a new path and sets the stroke.
   * @param {!Object number} segment
   */
  _drawInnerRingSegment: function(segment){
    App.context.beginPath();
    App.canvas.arc(
      this.pos.x, this.pos.y, this.innerRing.rad,
      segment.angStart, segment.angEnd, this.ang
    );
    App.context.stroke();
  },
  /** Draws end bridge as a new path and sets the stroke. */
  _drawInnerRingEnd: function(){
    var r = this.innerRing;
    App.context.beginPath();
    App.context.lineTo(
      this.pos.x + r.rad * Ma.cos(r.angEnd + this.ang),
      this.pos.y + r.rad * Ma.sin(r.angEnd + this.ang)
    );
    App.context.quadraticCurveTo(
      // outer ring end point
      this.pos.x + r.rad * Ma.cos(r.angEnd + this.ang - r.bridgeBend),
      this.pos.y + r.rad * Ma.sin(r.angEnd + this.ang - r.bridgeBend),
      this.pos.x + this.rad * Ma.cos(r.angEnd + this.ang - r.bridgeBend),
      this.pos.y + this.rad * Ma.sin(r.angEnd + this.ang - r.bridgeBend)
    );
    App.context.stroke();
  },
  // ----------------------------------------
  // ANIMATE
  // ----------------------------------------
  /** @ignore */
  toString: function(){
    return hlfPkg + 'sakuraDrops.DropNode';
  }
});
// ----------------------------------------
// OUTRO
// ----------------------------------------
})(_.namespace(hlfPkg));