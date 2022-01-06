/* jshint expr: true */


(function() {
    "use strict";
}());


define(
    [
        "jquery",
        "konva/circleCounter",
        "konva/countdownClock",
        "tools",
    ],
    function(
        $,
        circleCounter,
        countdownClock,
        tools
    ) {


        return function(params) {


            const settings = $.extend(true, { // true == deep copy
                width: tools.isMobile() ? 80 : 100,
                height: tools.isMobile() ? 80 : 100,
                strokeWidth: 1,
                stroke: "white",
                fontSize: 14,
                inactiveFill: "#ccc",
                correctCounter: {
                    doUse: true,
                    container: "scorebox-num-right",
                    fill: "limegreen",
                    numberSegments: 0,
                    recycle: true,
                    strokeWidth: 1,
                    segmentFadeIn: 1000,
                    labelText: "問題"
                },
                wrongCounter: {
                    doUse: true,
                    container: "scorebox-num-wrong",
                    fill: "deeppink",
                    numberSegments: 0,
                    recycle: true,
                    strokeWidth: 0,
                    segmentFadeIn: 0,
                    labelText: "間違い"
                },
                clock: {
                    doUse: true,
                    container: "scorebox-clock",
                    shape: "Arc",
                    innerRadius: tools.isMobile() ? 24 : 32,
                    outerRadius: tools.isMobile() ? 30 : 40,
                    backgroundColor: "skyblue",
                    foregroundColor: "#ccc",
                    labelFill: "skyblue",
                    labelSuffix: "",
                    labelText: "",
                    duration: 30 * 1000,
                    repeat: true,
                    dotMode: false,
                    easing: null
                }
            }, params || {});


            const scoreCircleFactory = circleCounter({
                width: settings.width,
                height: settings.height,
                strokeWidth: settings.strokeWidth,
                stroke: settings.stroke,
                fontSize: settings.fontSize,
                inactiveFill: settings.inactiveFill
            });


            const correctCounter = settings.correctCounter.doUse ? scoreCircleFactory({
                container: settings.correctCounter.container,
                fill: settings.correctCounter.fill,
                numberSegments: settings.correctCounter.numberSegments,
                recycle: settings.correctCounter.recycle,
                strokeWidth: settings.correctCounter.strokeWidth
            }) : null;


            const wrongCounter = settings.wrongCounter.doUse ? scoreCircleFactory({
                container: settings.wrongCounter.container,
                fill: settings.wrongCounter.fill,
                numberSegments: settings.wrongCounter.numberSegments,
                recycle: settings.wrongCounter.recycle,
                strokeWidth: settings.wrongCounter.strokeWidth
            }) : null;


            const clock = settings.clock.doUse ? countdownClock({
                container: settings.clock.container,
                shape: settings.clock.shape,
                innerRadius: settings.clock.innerRadius,
                outerRadius: settings.clock.outerRadius,
                fontSize: settings.clock.fontSize,
                backgroundColor: settings.clock.backgroundColor,
                foregroundColor: settings.clock.foregroundColor,
                labelFill: settings.clock.labelFill,
                duration: settings.clock.duration,
                labelText: settings.clock.labelText,
                repeat: true,
                dotMode: settings.clock.dotMode,
                easing: settings.clock.easing,
                labelSuffix: settings.clock.labelSuffix
            }) : null;


            return {
                correctCounter,
                wrongCounter,
                clock,
            };
        };
    }
);