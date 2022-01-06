/*
 *
 *
 *      A circular pie chart that can be used as a clock (countdown or regular) or
 *      as a visual incrementor, like, how many problems the student has finished
 *
 *
 *
 */


define(
        [
            "jquery",
            "Konva"
        ],
    function($, Konva) {


        return function(inputs) {


            // checking inputs
            if (!inputs || typeof inputs !== "object" || !inputs.container || (inputs.stepManually && isNaN(inputs.stepManually))) {
                console.log("The countdownClock got some bad parameters!");
                return;
            }


            // defaults
            const settings = $.extend({
                container: "", // straight html id attribute - not jquery!
                radius: 20,
                duration: 5000, // miliseconds, default
                maxValue: 0.999, // means full circle - just shy of 1, for graphics reasons
                autoStart: 0,
                easing: null, // e.g. string 'StrongEaseIn0ut', just the last part of 'Konva.Easings.StrongEaseInOut'
                foregroundColor: "skyblue",
                dotColor: "white",
                backgroundColor: "blue",
                colorOnComplete: "",
                stroke: "white",
                strokeWidth: 1,
                repeat: false,
                onFinish: null, // holds a function to call when finished
                dotMode: false,
                //
                //
                // USE THESE to make an incremental "stepper" instead of a clock
                //
                stepManually: false, // set to NUMBER to divide the circle into, say, ten pieces
                stepSpeed: 1000, // miliseconds - converted to seconds below
                //
                //
                // USE THESE to format the label, if any
                //
                labelText: "",
                labelFill: null, // default to foregroundColor
                fontSize: 14,
                labelSuffix: "",
                //
                //
                // NEW TEST adding a background circle
                //
                useInnerCircle: true,
                innerCircleBuffer: 0.9
            }, inputs);


            if (isNaN(settings.autoStart) || settings.autoStart === false) {
                settings.autoStart = false;
            } else {
                settings.pauseBeforeStart = settings.autoStart;
            }


            let increments = 0,
                stepTween,
                isRunning = false,
                destinationAngle = 359.99 * settings.maxValue; // ** not 360, which would close the circle and cause a flicker


            const stage = new Konva.Stage({ //settings.stage ||
                container: settings.container,
                width: settings.outerRadius ? settings.outerRadius * 2 : settings.radius * 2,
                height: settings.outerRadius ? settings.outerRadius * 2 : settings.radius * 2
            });
            const layer = settings.layer || new Konva.Layer();
            stage.add(layer);


            const backCircle = new Konva.Ring({
                x: settings.outerRadius ? settings.outerRadius : settings.radius,
                y: settings.outerRadius ? settings.outerRadius : settings.radius,
                outerRadius: settings.outerRadius || settings.radius,
                innerRadius: settings.innerRadius ? settings.innerRadius : 0,
                fill: settings.backgroundColor,
                stroke: settings.stroke,
                strokeWidth: settings.strokeWidth,
                rotation: 270 // otherwise, default would be the 3:00 position
            });
            layer.add(backCircle);


            let movingPiece;
            if (settings.dotMode) {
                movingPiece = new Konva.Circle({
                    x: settings.outerRadius ? settings.outerRadius : settings.radius,
                    y: settings.outerRadius ? settings.outerRadius : settings.radius,
                    radius: (settings.outerRadius - settings.innerRadius) / 2 - 1,
                    fill: settings.dotColor,
                    offsetY: (settings.outerRadius ? settings.outerRadius : settings.radius) - 4,
                    lineCaps: "round"
                });
                movingPiece.cache();
            } else {
                movingPiece = new Konva.Arc({
                    x: settings.outerRadius ? settings.outerRadius : settings.radius,
                    y: settings.outerRadius ? settings.outerRadius : settings.radius,
                    outerRadius: settings.outerRadius || settings.radius,
                    innerRadius: settings.innerRadius ? settings.innerRadius : 0,
                    fill: settings.foregroundColor,
                    clockwise: true,
                    rotation: 270, // makes the clock point straight up (otherwise, default would be the 3:00 position)
                    angle: 0.01, // almost, but not quite, 0
                    stroke: settings.stroke, // default white
                    strokeWidth: 1
                });
            }
            layer.add(movingPiece);


            if (settings.useInnerCircle) {
                let innerCircle = new Konva.Circle({
                    x: stage.width() / 2,
                    y: stage.height() / 2,
                    fill: settings.labelFill || settings.fill,
                    radius: settings.innerRadius * settings.innerCircleBuffer
                });
                layer.add(innerCircle);
                innerCircle.cache();
            }


            const label = new Konva.Text({
                text: settings.labelText + settings.labelSuffix,
                fontSize: settings.fontSize,
                fill: settings.useInnerCircle ? "white" : (settings.labelFill || settings.backgroundColor),
                align: "center"
            });
            label.width() && label.cache(); // caching *IF* it has a width - otherwise ERROR!
            layer.add(label).draw();


            centerOnLayer(label);


            // ensuring that destinationAngle is never quite 0, 'cause that screws stuff up
            destinationAngle = Math.max(destinationAngle, 0.001);


            const tween = new Konva.Tween({
                node: movingPiece,
                duration: settings.duration / 1000, // miliseconds to seconds
                angle: settings.dotMode ? null : destinationAngle,
                rotation: settings.dotMode ? 359.99 : movingPiece.rotation(),
                easing: Konva.Easings[settings.easing],
                onFinish: function() {

                    isRunning = false;

                    // repeating the clock, if specified
                    if (settings.repeat) {

                        isRunning = true;

                        // swapping background and foreground colors
                        if (!settings.dotMode) {
                            if (movingPiece.fill() === settings.foregroundColor) {
                                movingPiece.fill(settings.backgroundColor);
                                backCircle.fill(settings.foregroundColor);
                            } else {
                                movingPiece.fill(settings.foregroundColor);
                                backCircle.fill(settings.backgroundColor);
                            }
                        }

                        // resetting and replaying the tween
                        tween.reset().play();
                    } else {
                        if (settings.colorOnComplete && destinationAngle > 359) {
                            backCircle.fill(settings.colorOnComplete);
                            layer.draw();
                        }
                    }

                    // calling the input 'onFinish' function (none by default)
                    settings.onFinish && settings.onFinish();

                }
            });


            // starting the clock automatically, if settings.autoStart is set
            settings.autoStart && setTimeout(function() {
                tween.play();
                isRunning = true;
            }, settings.pauseBeforeStart); // pause set to 0 by default



            function start() {
                !isRunning && tween.play();
                return this;
            }


            function stop() {
                isRunning = false;
                tween.pause();
                return this;
            }


            function finish() {
                isRunning = false;
                tween.finish();
                layer.draw();
                tween.pause();
                return this;
            }


            function reset() {
                isRunning = false;
                increments = 0;
                stepTween && stepTween.destroy();
                frontCircle.angle(0.01);
                layer.draw();
            }


            function setNumberSteps(number) {
                if (!number || isNaN(number)) {
                    console.log("setNumberSteps takes one parameter, a number!");
                    return false;
                }
                settings.stepManually = number;
                return this;
            }


            function step() {
                increments += 1;
                const amountToIncrease = (359.99 / settings.stepManually) * increments;
                stepTween = new Konva.Tween({
                    node: frontCircle,
                    duration: settings.stepSpeed / 1000,
                    easing: Konva.Easings.StrongEaseOut,
                    angle: amountToIncrease
                }).play();
            }


            function setLabel(text) {
                label.text(text + settings.labelSuffix);
                centerOnLayer(label);
            }


            function centerOnLayer(element) {
                if (element.width() > 0) {
                    element.clearCache();
                    element.x(layer.width() / 2).y(layer.height() / 2).offsetX(element.width() / 2).offsetY(element.height() / 2);
                    layer.draw();
                    element.cache();
                    return this;
                }
            }


            // countdownClock public methods
            return {
                start: start,
                stop: stop,
                finish: finish,
                reset: reset,
                setNumberSteps: setNumberSteps,
                step: step,
                label: setLabel
            };
        };
    }
);