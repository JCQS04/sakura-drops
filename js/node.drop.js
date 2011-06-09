/**
 * @fileoverview Drop node class for Sakura Drops app.
 * @author peng@pengxwang.com (Peng Wang)
 */
// ----------------------------------------
// OVERHEAD
// ----------------------------------------
_.namespace(pkg + 'sakuraDrops');
_.using(pkg + '*', function () {
var app = sakuraDrops, 
  C = app.constants.DROP_NODE, // custom
  M = app.Math;
// ----------------------------------------
// CLASS
// ----------------------------------------
// TODO
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
app.DropNode = app.BaseNode.extend({
  /** @lends app.DropNode# */
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
  hasInnerRing: function () {
    return this.innerRing || (this.getArcLen() > M.PI && 
      this.radFinal > C.radWithInnerRing);
  },
  hasOuterSegments: function () {
    return this.outerSegments || this.luck <= C.outerSegmentsChance;
  },
  hasInnerSegments: function () {
    return this.innerRing && (this.innerSegments || 
      this.luck <= C.innerSegmentsChance);
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
  _init: function (params) {
    this._super(params);
    // deviation from base rad
    var d = M.sqrt(C.radWithInnerRing / this.rad),
      r = util.simpleRandom(-1, 1) * C.innerBuffer,
      dir = app.canvas.getAngDir();
    this.radFinal = this.rad;
    this.rad = 0;
    if (this.hasInnerRing()) {
      var ring = {};
      ring.rad = undefined;
      ring.radRatio = C.innerRad * d;
      ring.lineWidth = M.sqrt(this.lineWidth) * C.innerLineWidth * d;
      ring.angStart = this.angStart - d + r * M.QTR_PI * dir;
      ring.angEnd = this.angEnd + d + r * M.QTR_PI * dir;
      ring.bridgeBend = d * util.simpleRandom(C.innerBendMin, C.innerBendMax);
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
  _generateSegments: function () {
    var i, l, // counters
      start, // start of ring
      t, // start of current segment
      dist, d, // total ring length and current length
      seg, s, // base segment length and current length
      ds, // segment flux modifier
      br, // segment break length
      dir = app.canvas.getAngDir(), // direction
      _this = this;
    /** @inner */
    var setupBasePrc = function (type) {
      // console.logArc(type == 'outer' ? _this : _this.innerRing);
      // console.logArc(dist, 'distance for ' + type);
      _this[type+'Segments'] = []; i = 0; d = 0; 
      l = M.ceil(util.simpleRandom(2, C[type+'SegmentsMax']));
      start = (type == 'outer') ? _this.angStart : _this.innerRing.angStart;
      seg = dist / l;
      br = M.sqrt(segmentFlux(type)) * C[type+'SegmentBreak'] * 
        M.max(M.pow(_this.lineWidth, 2), 1);
    };
    /** @inner */
    var addSegmentPrc = function (type) { 
      t = start + d * dir; 
      d += s + br;
      _this[type+'Segments'][i] = {
        'angStart': t, 
        'angEnd': t + s * dir
      };
      i += 1;
    };
    /** @inner */
    var segmentFlux = function (type) {
      return util.simpleRandom(C.segmentFluxMin, 
        C.segmentFluxMax);
    };
    /** @inner */
    var updateSegment = function (type) {
      ds = segmentFlux(type);
      s = ds * seg - br;
      if (type == 'outer') {
        s = M.max(s, M.H_PI);
      }
    };
    /** @inner */
    var canDrawSegment = function (type) {
      updateSegment(type);
      return dist > d + s + br;
    };
    if (this.hasOuterSegments()) {
      dist = M.abs(this.angEnd - this.angStart);
      setupBasePrc('outer');
      while (i < l && canDrawSegment('outer')) {
        addSegmentPrc('outer');
      }
      // console.logAtPos('outerSegments', this); 
    }
    if (this.hasInnerSegments()) {
      dist = M.abs(this.innerRing.angEnd - this.innerRing.angStart);
      setupBasePrc('inner');
      while (i < l && canDrawSegment('inner')) {
        addSegmentPrc('inner');
      }
      if (M.abs(dist - d) > M.PI / 8) {
        this.innerRing.hasEndBridge = false;
      }
      // console.logAtPos('innerSegments', this); 
    }
  },
  /**
   * TODO
   */
  _introAnimation: function () {
    var _this = this,
      beginning = this.rad,
      change = this.radFinal - this.rad,
      duration = C.introSpeed,
      callback = function (elapsed, complete) {
        if (!complete) {
          _this.rad = util.easeInOutCubic(elapsed, beginning, change, duration);
          if (_this.hasInnerRing()) {
            _this.innerRing.rad = _this.rad * _this.innerRing.radRatio;
          }
          _this.trigger('didAnimationStep');
        }
      };
    this.introAnimation = app.canvas.animate(null, callback, duration);
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
  onDraw: function () {
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
  _drawRing: function () {
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
  _drawOuterRingSegment: function (segment) {
    app.context.beginPath();
    app.canvas.arc(
      this.pos.x, this.pos.y, this.rad,
      segment.angStart, segment.angEnd, this.ang
    );
    app.context.stroke();        
  },
  /** Draws an arc as a new path and sets the stroke. */
  _drawOuterRingBody: function () {
    app.context.beginPath();
    app.canvas.arc(
      this.pos.x, this.pos.y, this.rad,
      this.angStart, this.angEnd, this.ang
    );
    app.context.stroke();
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
  _drawInnerRing: function () {
    app.context.save();
    app.context.lineWidth = this.innerRing.lineWidth;
    if (this.innerRing.hasStartBridge) {
      this._addGlow('_drawInnerRingStart', this.glowDist * C.innerGlow);
    }
    if (this.hasInnerSegments()) {
      for (var i = 0, l = this.innerSegments.length;
        i < l; i += 1) {
        this._addGlow('_drawInnerRingSegment', this.glowDist * C.innerGlow, 
          [this.innerSegments[i]]);
      }
    } else {
      this._addGlow('_drawInnerRingBody', this.glowDist * C.innerGlow);
    }
    if (this.innerRing.hasEndBridge) {
      this._addGlow('_drawInnerRingEnd', this.glowDist * C.innerGlow);
    }
    app.context.restore();
  },
  /** Draws start bridge as a new path and sets the stroke. */
  _drawInnerRingStart: function () {
    var r = this.innerRing;
    app.context.beginPath();
    app.context.lineTo(
      // outer ring start point
      this.pos.x + this.rad * M.cos(r.angStart + this.ang + r.bridgeBend), 
      this.pos.y + this.rad * M.sin(r.angStart + this.ang + r.bridgeBend) 
    );
    app.context.quadraticCurveTo(
      // inner ring start point
      this.pos.x + r.rad * M.cos(r.angStart + this.ang + r.bridgeBend),
      this.pos.y + r.rad * M.sin(r.angStart + this.ang + r.bridgeBend),
      this.pos.x + r.rad * M.cos(r.angStart + this.ang),
      this.pos.y + r.rad * M.sin(r.angStart + this.ang)
    );
    app.context.stroke();
  },
  /** Draws an arc as a new path and sets the stroke. */
  _drawInnerRingBody: function () {
    app.context.beginPath();
    app.canvas.arc(
      this.pos.x, this.pos.y, this.innerRing.rad,
      this.innerRing.angStart, this.innerRing.angEnd, this.ang
    );
    app.context.stroke();
  },
  /**
   * Draws an arc as a new path and sets the stroke.
   * @param {!Object number} segment
   */
  _drawInnerRingSegment: function (segment) {
    app.context.beginPath();
    app.canvas.arc(
      this.pos.x, this.pos.y, this.innerRing.rad,
      segment.angStart, segment.angEnd, this.ang
    );
    app.context.stroke();
  },
  /** Draws end bridge as a new path and sets the stroke. */
  _drawInnerRingEnd: function () {
    var r = this.innerRing;
    app.context.beginPath();
    app.context.lineTo(
      this.pos.x + r.rad * M.cos(r.angEnd + this.ang),
      this.pos.y + r.rad * M.sin(r.angEnd + this.ang)
    );
    app.context.quadraticCurveTo(
      // outer ring end point
      this.pos.x + r.rad * M.cos(r.angEnd + this.ang - r.bridgeBend),
      this.pos.y + r.rad * M.sin(r.angEnd + this.ang - r.bridgeBend),
      this.pos.x + this.rad * M.cos(r.angEnd + this.ang - r.bridgeBend),
      this.pos.y + this.rad * M.sin(r.angEnd + this.ang - r.bridgeBend)
    );
    app.context.stroke();
  },
  // ----------------------------------------
  // ANIMATE
  // ----------------------------------------
  /** @ignore */
  toString: function () {
    return pkg + 'sakuraDrops.DropNode';
  }    
});
}); // namespace