/**
 * @fileoverview Drop nodes manager class for Sakura Drops app.
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
  requireCanvasGlobals = function () {
    if (!canvas) {
      canvas = app.canvas;
      context = canvas.context;
    }  
  };
// ----------------------------------------
// CLASS
// ----------------------------------------
/**
 * @class Manager for DropNodes. Responsible for setup and interaction
 *      specific to node instances.
 * @augments hlf.sakuraDrops.BaseManager
 * @property {hlf.module.CirclePacker} cp
 */
app.DropManager = app.BaseManager.extend({
  /** @lends app.DropManager# */
  /** @type {module.CirclePacker} */
  cp: undefined,
  // ----------------------------------------
  // ACCESSORS
  // ----------------------------------------
  /**
   * Accessor for center of circle packer. Current center of canvas.
   * @return {Object number}
   */
  getAttractorPos: function () {
    return {
      x: canvas.getWidth() / 2,
      y: canvas.getHeight() / 2
    };
  },    
  // ----------------------------------------
  // SETUP
  // ----------------------------------------
  /**
   * Sets up node at a random position with pseudo-random size that affects
   *      line width, and pseudorandom length. Note luck is not customized.
   * @param {!int} i Index for node.
   * @see hlf.util.simpleRandom
   * @see hlf.util.bufferedRandom
   * @see hlf.util.curvingBufferedRandom
   */
  onPopulate: function (i) {
    requireCanvasGlobals();
    var x = util.simpleRandom(canvas.getWidth()),
      y = util.simpleRandom(canvas.getHeight()),
      rad = util.curvingBufferedRandom(C.DROP_NODE.rad, .5, 2),
      lineWidth = C.DROP_NODE.lineWidth * rad / C.DROP_NODE.rad,
      angStart = util.simpleRandom(M.TWO_PI) + M.TWO_PI,
      angEnd = angStart + util.bufferedRandom(M.TWO_PI, 2) * 
        canvas.getAngDir(),
      params = { 'pos': {'x': x, 'y': y}, 'rad': rad, 'lineWidth': lineWidth,
        'angStart': angStart, 'angEnd': angEnd };
    if (this.unitTest) {
      params.luck = 0; // activate all side cases
    }
    return app.DropNode.create(params);
  },
  /**
   * Sets up the circle packer and binds its drawing socket to the drawing API.
   * @see hlf.module.CirclePacker#drawingSocket
   * @see #draw
   */
  didCreate: function () {
    var _this = this;
    this.cp = module.CirclePacker.create(this.nodes, 
      this.getAttractorPos(), C.CIRCLE_PACKER.passes);
    this.cp.bind('drawingSocket', function () {
      canvas.background('rgb(0,0,0)');
      _this.draw();
    });
    this.cp.bind('didSettle', function () {
      _this.ready.mouseMove = true;
    });
  },
  /** Runs / refreshes the circle packer. */
  onUpdate: function () {
    this.cp.run();
  },
  /** @ignore */
  toString: function () {
    return pkg + 'sakuraDrops.DropManager';
  }
});
}); // namespace