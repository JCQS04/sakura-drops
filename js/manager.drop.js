/**
 * @fileoverview Drop nodes manager class for Sakura Drops app.
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
/**
 * @class Manager for DropNodes. Responsible for setup and interaction
 *      specific to node instances.
 * @augments hlf.sakuraDrops.BaseManager
 * @property {hlf.hlfModule.CirclePacker} cp
 */
App.DropManager = App.BaseManager.extend({
  /** @lends App.DropManager# */
  /** @type {hlfModule.CirclePacker} */
  cp: undefined,
  // ----------------------------------------
  // ACCESSORS
  // ----------------------------------------
  /**
   * Accessor for center of circle packer. Current center of canvas.
   * @return {Object number}
   */
  getAttractorPos: function(){
    return {
      x: App.canvas.getWidth() / 2,
      y: App.canvas.getHeight() / 2
    };
  },    
  // ----------------------------------------
  // SETUP
  // ----------------------------------------
  /**
   * Sets up the circle packer and binds its drawing socket to the drawing API.
   * @see hlf.hlfModule.CirclePacker#drawingSocket
   * @see #draw
   */
  _init: function(params){
    this._super(params);
    this.cp = new Mod.CirclePacker(this.nodes, 
      this.getAttractorPos(), Co.CIRCLE_PACKER.passes);
    this.cp.bind_('drawingSocket', function(){
      App.canvas.background('rgb(0,0,0)');
      this.draw();
    }, this);
    this.cp.bind_('didSettle', function(){
      this.ready.mouseMove = true;
    }, this);
  },
  /**
   * Sets up node at a random position with pseudo-random size that affects
   *      line width, and pseudorandom length. Note luck is not customized.
   * @param {!int} i Index for node.
   * @see hlf.hlfUtil.simpleRandom
   * @see hlf.hlfUtil.bufferedRandom
   * @see hlf.hlfUtil.curvingBufferedRandom
   */
  onPopulate: function(i){
    var x = Ut.simpleRandom(App.canvas.getWidth()),
      y = Ut.simpleRandom(App.canvas.getHeight()),
      rad = Ut.curvingBufferedRandom(Co.DROP_NODE.rad, .5, 2),
      lineWidth = Co.DROP_NODE.lineWidth * rad / Co.DROP_NODE.rad,
      angStart = Ut.simpleRandom(Ma.TWO_PI) + Ma.TWO_PI,
      angEnd = angStart + Ut.bufferedRandom(Ma.TWO_PI, 2) * 
        App.canvas.getAngDir(),
      params = { 'pos': {'x': x, 'y': y}, 'rad': rad, 'lineWidth': lineWidth,
        'angStart': angStart, 'angEnd': angEnd };
    if (this.unitTest) {
      params.luck = 0; // activate all side cases
    }
    return new App.DropNode(params);
  },
  /** Runs / refreshes the circle packer. */
  update: function(){
    this._super();
    this.cp.run();
  },
  /** @ignore */
  toString: function(){
    return hlfPkg + '.sakuraDrops.DropManager';
  }
});
// ----------------------------------------
// OUTRO
// ----------------------------------------
})(_.namespace(hlfPkg));