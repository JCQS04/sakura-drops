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
// ----------------------------------------
// INTRO
// ----------------------------------------
_.namespace(hlfPkg + '.sakuraDrops');
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
    this.m = new App.DropManager(this.opt);
    this.$toolbar.hideButton(this.$stopper);
  },
  start: function(){
    this._super();
    this.m.update();
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
  sketchOne.setup();
  sketchOne.start();
  $(document).bind({
    'on.sequential-pulse': function(){
      console.log('on');
    },
    'off.sequential-pulse': function(){
      console.log('off');
    },
    'on.sequential-spin': function(){
    },
    'off.sequential-spin': function(){
    },
    'on.sequential-scale': function(){
    },
    'off.sequential-scale': function(){
    },
  });
}); // ready
// ----------------------------------------
// OUTRO
// ----------------------------------------
})(_.namespace(hlfPkg));