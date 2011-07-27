/**
 * @fileoverview Inspired by the effects in Sakura Drops.
 * @author peng@pengxwang.com (Peng Wang)
 */
/**
 * @name hlf.sakuraDrops
 * @namespace Application namespace.
 */
/** @exports app as hlf.sakuraDrops */
// ----------------------------------------
// INTRO
// ----------------------------------------
(function(){

// TODO refine
require({
  paths: {
    'underscore': '../../bin/underscore/underscore',
    '_namespace': '../../js/underscore.namespace',
    'backbone': '../../bin/backbone/backbone',
    'jquery': '../../bin/jquery',
    'header': '../../js/header',
    'core': '../../js/hlf.util/core',
    'math': '../../js/hlf.util/math',
    'geometry': '../../js/hlf.util/geometry',
    'console': '../../js/hlf.util/console',
    'aliases': '../../js/hlf.module/third-party-aliases',
    'circle-packer': '../../js/hlf.module/circle-packer',
    'canvas': '../../js/hlf.module/canvas',
    'canvas-ui': '../../js/hlf.jquery/ui.canvas-app'
  }
}, ['order!underscore', 'order!_namespace', 'order!backbone',
'order!jquery', 'order!header', 'order!core', 'order!math', 'order!geometry',
'order!console', 'order!aliases', 'order!circle-packer','order!canvas','order!canvas-ui',
'order!globals', 'order!base', 'order!node.drop', 'order!manager.drop'], function(){

(function(hlf){

var App = hlf.sakuraDrops, Ut = hlf.util, Mod = hlf.module, 
    Co = App.constants, Ma = App.Math;
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
App.DropSketch = Mod.CanvasApplication.extend({
  setup: function(){
    this._super();
    this.m1 = new App.DropManager(this.opt);
    this.$toolbar.hideButton(this.$stopper);
  },
  start: function(){
    this._super();
    this.m1.update();
  },
  manager: function(){
    return this.m1;
  },
  constants: function(){
    return Co;
  }
});
var sketchOne = new App.DropSketch({
    num: 10,
    unitTest: false
  });
/** 
 * On load callback for the page.
 */
$(function(){
  App.canvas = sketchOne.canvas = new Mod.Canvas('the-canvas');
  App.context = App.canvas.context;
  App.palette = App.canvas.palette;
  sketchOne.setup();
  sketchOne.start();
}); // ready
// ----------------------------------------
// OUTRO
// ----------------------------------------
})(_.namespace(hlfPkg));
});
})();