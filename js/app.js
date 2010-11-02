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
Namespace(pkg + 'sakuraDrops');
Namespace.use(pkg + '*', function () {
var app = sakuraDrops;
// ----------------------------------------
// APP GLOBALS
// ----------------------------------------
var canvas, context,
    $stopper, $exporter, $toolbar;
/**
 * jQuery object resulting from the toolbar plugin. Has buttons including:
 *      #stop-animation and #export-canvas. Own id is #the-canvas-toolbar.
 * @requires jQuery.fn.toolbar
 * @type {jQuery}
 */
app.$toolbar = $toolbar;
// ----------------------------------------
// APP PROCEDURES
// ----------------------------------------
/**
 * App procedure #1
 * @requires NamespaceJS. {@link Namespace}
 * @requires UnderscoreJS. {@link _}
 * @requires BackboneJS. {@link Backbone}
 * @requires Utility library. {@link hlf.util }
 * @requires Module library. {@link hlf.module }
 * @requires jQuery library. {@link hlf.jquery }
 */
app.sketch1 = function () {
    var m = this.m = app.DropManager.create({
        num: 10,
        unitTest: false
    });
    $toolbar.hideButton($stopper);
    m.update();
};
/** 
 * On load callback for the page.
 */
jQuery(document).ready(function ($) {
    // set globals
    canvas = app.canvas = module.Canvas.create('the-canvas');
    context = app.context = canvas.context;
    $stopper = $('#stop-animation').click(function (evt) {
        canvas.togglePauseAndPlay();
        $stopper.text(($stopper.text === 'stop') ? 'play' : 'stop');
        evt.preventDefault();
    });
    $exporter = $('#export-canvas').click(function (evt) {
        canvas.exportAsImage();
    });
    $toolbar = $('#the-canvas-toolbar').toolbar();
    // run
    app.sketch1();
}); // ready
}); // namespace