/**
 * @fileoverview Static globals and constants for Sakura Drops app.
 * @author peng@pengxwang.com (Peng Wang)
 */
/** @exports app as hlf.sakuraDrops */
_.namespace(pkg + 'sakuraDrops');
_.using(pkg + '*', function () {
var app = sakuraDrops;
/** @namespace Group of all app constants. Each property is a set of class constants. */
app.constants = {
    /** 
     * Constants: rad, lineWidth, glowDistance, spinSpeed, spinMin, spinMax
     * @static 
     */
    BASE_NODE: {
        rad: 20,
        lineWidth: 2,
        glowDistance: 2,
        spinSpeed: 500,
        spinMin: 1 / 2,
        spinMax: 2
    },
    /** 
     * Constants: rad, lineWidth, radWithInnerRing, innerRad, innerLineWidth, 
     *      innerBuffer, innerGlow, innerBendMin, innerBendMax, outerSegmentsMax,
     *      innerSegmentsMax, outerSegmentsChance, innerSegmentsChance, outerSegmentBreak,
     *      innerSegmentBreak, segmentFluxMin, segmentFluxMax.
     * @static 
     */
    DROP_NODE: {
        rad: 100,
        lineWidth: 2,
        radWithInnerRing: 50,
        innerRad: 2 / 3,
        innerLineWidth: 1 / 3,
        innerBuffer: 1 / 8,
        innerGlow: 2 / 3,
        innerBendMin: 1 / 3,
        innerBendMax: 1 / 2,
        outerSegmentsMax: 4,
        innerSegmentsMax: 3,
        outerSegmentsChance: 1 / 3,
        innerSegmentsChance: 1 / 2,
        outerSegmentBreak: 1 / 8,
        innerSegmentBreak: 1 / 6,
        segmentFluxMin: 1 / 2,
        segmentFluxMax: 3 / 2,
    },
    /** 
     * Constants: passes.
     * @static 
     */
    CIRCLE_PACKER: {
        passes: 35
    },
    MOUSEMOVE_TIMEOUT: 200,
    /** @ignore */
    toString: function () {
        return pkg + 'sakuraDrops.constants';
    }
};
var M = Math;
/**
 * @name Math
 * @namespace Extended math global.
 */
app.Math = util.extend(true, M, {
    /**#@+ 
       @static 
       @fieldOf Math 
     */
    H_PI: Math.PI / 2,
    TWO_PI: Math.PI * 2,
    QTR_PI: QTR_PI = Math.PI / 4,
    /**#@- */ 
    /** @ignore */
    toString: function () {
        return pkg + 'sakuraDrops.Math';
    }    
});
}); // namespace