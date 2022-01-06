define(
        [
            "jquery",
            "Konva"
        ],
    function($, Konva) {


        return function(obj) { // returns a "circleCounter" object


            var master = $.extend(true, {
                width: null,
                height: null,
                inactiveFill: "#ccc",
                outerRadius: obj.outerRadius || obj.width / 2,
                innerRadius: obj.innerRadius || (obj.width / 2) * 0.8,
                strokeWidth: 1,
                labelText: "", //null,
                showNumber: true,
                pulseDuration: 0.5,
                recycle: false,
                prefix: "",
                suffix: "",
                fontSize: 12,
                segmentInactiveOpacity: 0.3,

                // NEW TEST the inner circle
                useInnerCircle: true,
                innerCircleBuffer: 0.9
            }, obj || {});


            return function(obj) {


                obj = obj || {};
                var clone = JSON.parse(JSON.stringify(master)); // COOL SYNTAX!  Cloning an object...
                var params = $.extend(true, clone, obj); // true == deep copy


                if (!params.height || !params.width) {
                    console.log("circleCounter needs width and height to be specified!");
                    return false;
                }


                // setting numberSegments to 1, if we're recycling the problems
                var recycle = params.recycle;
                var numberSegments = recycle ? 1 : params.numberSegments;
                params.suffix = params.numberSegments ? " / " + params.numberSegments : "";
                var inactiveSegments = [];
                var counter = 0;
                var stage = params.stage || new Konva.Stage({
                    container: params.container,
                    height: params.height,
                    width: params.width
                });
                var layer = new Konva.Layer();
                stage.add(layer);


                // adding segments
                for (var i = 0; i < numberSegments; i++) {
                    var segment = newSegment(i, recycle);
                    layer.add(segment);
                    inactiveSegments.push(segment);
                }
                layer.draw();


                // adding a circle to the "clock face", optionally
                if (params.useInnerCircle) {
                    var backgroundCircle = new Konva.Circle({
                        x: stage.width() / 2,
                        y: stage.height() / 2,
                        fill: params.labelFill || params.fill,
                        radius: params.innerRadius * params.innerCircleBuffer
                    });

                    layer.add(backgroundCircle);
                    backgroundCircle.cache();
                }


                // adding a label
                var label = new Konva.Text({
                    text: (function() {
                        var label = params.labelText;
                        var prefix = params.prefix;
                        var number = params.showNumber ? counter : null;
                        var suffix = params.suffix;
                        return label + prefix + number + suffix;
                    }()),
                    fontSize: params.fontSize,
                    fontFamily: params.fontFamily || null,
                    fill: params.useInnerCircle ? "white" : (params.labelFill || params.fill),
                    align: "center"
                });
                layer.add(label);
                centerOnLayer(label);


                // gradually decreasing fontSize until the label fits inside
                while (label.width() > params.innerRadius * 2) {
                    label.fontSize(label.fontSize() - 1);
                    centerOnLayer(label);
                }


                function centerOnLayer(element) {
                    element.clearCache();
                    element.offsetX(label.width() / 2)
                        .offsetY(label.height() / 2)
                        .x(layer.width() / 2)
                        .y(layer.height() / 2)
                        .cache();
                    layer.draw();
                    return this;
                }


                function updateLabel() {
                    var text = params.labelText;
                    var number = params.showNumber && counter;
                    label.text(text + number + params.suffix);
                    centerOnLayer(label);
                    return this;
                }


                function showNumber() {
                    updateLabel();
                    return this;
                }


                function newSegment(i, recycle) {

                    var arc = new Konva.Arc({
                        x: params.width / 2,
                        y: params.height / 2,
                        outerRadius: params.outerRadius,
                        innerRadius: params.innerRadius,
                        angle: 360 / numberSegments,
                        rotation: 270 + (i / numberSegments) * 360,
                        fill: params.fill,
                        stroke: recycle ? null : params.stroke, // no stroke if we're recycling
                        strokeWidth: params.hasOwnProperty("strokeWidth") ? params.strokeWidth : recycle ? null : params.strokeWidth,
                        opacity: params.segmentInactiveOpacity
                    });

                    arc.activate = function() {
                        //                            arc.fill(params.fill);
                        arc.opacity(1);
                        layer.draw();
                    };

                    recycle && arc.activate();

                    return arc;
                }


                function increment() {
                    counter++;
                    recycle && pulse();
                    inactiveSegments.length && inactiveSegments.shift().activate();
                    setLabelText(counter);
                    return this;
                }


                function setLabelText(text) {
                    label.opacity(0).text(params.labelText + text + params.suffix).to({ opacity: 1, duration: 0.1 });
                    centerOnLayer(label);
                    return this;
                }


                function pulse() {
                    layer.opacity(0).to({ opacity: 1, duration: params.pulseDuration });
                }


                return {
                    increment: increment,
                    updateLabel: updateLabel,
                    showNumber: showNumber,
                    pulse: pulse
                };
            };
        };
    }
);