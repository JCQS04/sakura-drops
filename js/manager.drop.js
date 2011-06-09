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
  M = app.Math;
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
      x: app.canvas.getWidth() / 2,
      y: app.canvas.getHeight() / 2
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
    var x = util.simpleRandom(app.canvas.getWidth()),
      y = util.simpleRandom(app.canvas.getHeight()),
      rad = util.curvingBufferedRandom(C.DROP_NODE.rad, .5, 2),
      lineWidth = C.DROP_NODE.lineWidth * rad / C.DROP_NODE.rad,
      angStart = util.simpleRandom(M.TWO_PI) + M.TWO_PI,
      angEnd = angStart + util.bufferedRandom(M.TWO_PI, 2) * 
        app.canvas.getAngDir(),
      params = { 'pos': {'x': x, 'y': y}, 'rad': rad, 'lineWidth': lineWidth,
        'angStart': angStart, 'angEnd': angEnd };
    if (this.unitTest) {
      params.luck = 0; // activate all side cases
    }
    return new app.DropNode(params);
  },
  /**
   * Sets up the circle packer and binds its drawing socket to the drawing API.
   * @see hlf.module.CirclePacker#drawingSocket
   * @see #draw
   */
  didCreate: function () {
    var _this = this;
    this.cp = new module.CirclePacker(this.nodes, 
      this.getAttractorPos(), C.CIRCLE_PACKER.passes);
    this.cp.bind('drawingSocket', function () {
      app.canvas.background('rgb(0,0,0)');
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