



define(
        [
            "jquery",
            "Konva",
            "tools"
        ],
        function ($, Konva, tools) {


            return function (params) {


                // *OPTIONALLY* setting the defaults on instantiation
                var baseDefaults = $.extend({
                    container: "", // REQUIRED, string id of the container (not jQuery!), either here or in the function that is returned
                    innerRadius: 24,
                    outerRadius: 30,
                    percent: 0,
                    backgroundFill: "#eee",
                    foregroundFill: "#333",
                    textFill: "green",
                    shadowColor: "white",
                    pauseBeforeStart: 0,
                    duration: 2,
                    labelFontSize: 14,
                    easing: Konva.Easings.EaseOut,
                    onFinish: function () {
                        //
                    }
                }, params || {});


                return function (args) {


                    // copying the baseDefaults, so they themselves don't change
                    var defaults = $.extend({}, baseDefaults);


                    // merging the args into the default settings
                    $.extend(defaults, args || {});


                    // gotta have a .container property
                    if (!defaults.container) {
                        console.log("circleGraph requires a string (not jQuery) reference to a DOM element id!");
                        return false;
                    }


                    // creating a stage
                    var stage = new Konva.Stage({
                        width: defaults.outerRadius * 2,
                        height: defaults.outerRadius * 2,
                        container: defaults.container
                    });


                    // creating and adding a layer
                    var layer = new Konva.Layer();
                    layer.moveTo(stage);


                    // creating a background, usually light gray
                    var background = new Konva.Ring({
                        x: defaults.outerRadius,
                        y: defaults.outerRadius,
                        innerRadius: defaults.innerRadius,
                        outerRadius: defaults.outerRadius,
                        fill: defaults.backgroundFill
                    });


                    // creating a foreground that will expand, from 0deg to however many degrees
                    var foreground = new Konva.Arc({
                        x: defaults.outerRadius,
                        y: defaults.outerRadius,
                        innerRadius: defaults.innerRadius,
                        outerRadius: defaults.outerRadius,
                        fill: defaults.foregroundFill,
                        angle: 0.01, // start at 1 degree, to be tweened up later
                        rotation: 270 // so it starts from 12:00, instead of 3:00
                    });


                    var label = percentDoneLabel({
                        endValue: 100
                    });


                    // only executing this when the element is visible
                    tools.elementOnScreen($("#" + defaults.container), function () {


                        // starting the animation after a slight pause
                        setTimeout(function () {


                            // starting the label counting thing
                            label.start();


                            // animating the arc
                            foreground.to({
                                duration: defaults.duration,
                                angle: defaults.percent * 360,
                                easing: defaults.easing,
                                onFinish: defaults.onFinish ? defaults.onFinish : null
                            });


                        }, defaults.pauseBeforeStart * 1000);
                    });


                    // adding the circles
                    layer.add(background, foreground).draw();


                    function percentDoneLabel(params) {


                        var settings = $.extend({
                            endValue: 0, // required!
                            startValue: 0,
                            fill: defaults.textFill,
                            fontSize: defaults.labelFontSize,
                            preTag: "",
                            tag: "%\n完成",
                            duration: 2
                        }, params || {});


                        if (defaults.label) {
                            settings.fill = defaults.label.fill || settings.fill;
                            settings.fontSize = defaults.label.fontSize || settings.fontSize;
                        }


                        function getLabelText(text) {
                            return settings.preTag + text + settings.tag;
                        }


                        // checking that the param is an object with property .endvalue
                        if (!params || typeof params !== "object" || !params.endValue) {
                            console.log("percentDonelabel requires an object passed in with property 'endavalue'!");
                            return false;
                        }


                        var text = new Konva.Text({
                            text: getLabelText(parseInt(settings.startValue)),
                            fontSize: settings.fontSize,
                            fill: settings.fill,
                            width: stage.width(),
                            align: "center"
                        });


                        // centering the text vertically in its container (don't have to do horizontal alignment, 'cause the text is centered)
                        text.y((stage.height() - text.height()) / 2);


                        layer.add(text).draw();


                        function getPercentDone() {
                            return Math.floor(foreground.angle() / 360 * 100);
                        }


                        return {
                            start: function () {


                                // current time, plus 2 seconds (or whatever)
                                var endTime = tools.secondsFromNow(defaults.duration * 1000);


                                window.requestAnimationFrame(eachFrame);
                                function eachFrame() {


                                    var currentTime = (new Date()).getTime();


                                    // setting the text to percent done, or to its max value and exiting the loop if we're done
                                    if (currentTime < endTime) {
                                        var percentDone = getPercentDone();
                                        text.text(getLabelText(percentDone));
                                        window.requestAnimationFrame(eachFrame);
                                    } else {
                                        var endValue = parseInt(defaults.percent * 100);
                                        var newLabel = getLabelText(endValue);
                                        text.text(newLabel);
                                    }


                                    // drawing the layer
                                    layer.batchDraw();
                                }
                            }
                        };
                    }
                };
            };
        }
);