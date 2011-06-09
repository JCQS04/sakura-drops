/**
 * @fileoverview Inspired by the effects in Sakura Drops.
 * @author peng@pengxwang.com (Peng Wang)
 */
// TODO - require js sometimes doesn't work
// if (window.require && 
//     !window.jQuery || 
//     !window.Namespace || 
//     !window.hlf.util || 
//     !window.hlf.module
//     ) {
//     window.location.reload();
// }
/**
 * @name hlf.sakuraDrops
 * @namespace Application namespace.
 */
/** @exports app as hlf.sakuraDrops */
_.namespace(pkg + 'sakuraDrops');
_.using(pkg + '*', function () {
var app = sakuraDrops;
/**
 * App procedure #1
 * @requires NamespaceJS. {@link Namespace}
 * @requires UnderscoreJS. {@link _}
 * @requires BackboneJS. {@link Backbone}
 * @requires Utility library. {@link hlf.util }
 * @requires Module library. {@link hlf.module }
 * @requires jQuery library. {@link hlf.jquery }
 * @property {hlf.sakuraDrops.dropManager} m
 */
app.DropSketch = module.CanvasApplication.extend({
  setup: function(){
    this._super();
    this.m = new app.DropManager(this.opt);
    this.$toolbar.hideButton(this.$stopper);
  },
  start: function(){
    this._super();
    this.m.update();
  }
});
var sketchOne = new app.DropSketch({
    num: 10,
    unitTest: false
  });
/** 
 * On load callback for the page.
 */
$(function(){
  _.using(pkg + '*', function () {
    app.canvas = sketchOne.canvas = new module.Canvas('the-canvas');
    app.context = app.canvas.context;
    sketchOne.setup();
    sketchOne.start();
  });
}); // ready
}); // namespace