/* jshint expr: true */


/*
 Generic explosion, using KonvaJS!
 Must pass in a layer!  Don't forget this!  Critical!
 */


define(
        [
            "jquery",
            "Konva"
        ],
    function($, Konva) {


        return function(inputParams = {}) {


            let defaults = {
                layer: null, // MANDATORY
                x: 0,
                y: 0,
                radius: 50,
                fill: null,
                width: 1,
                height: 1,
                duration: 0.5, // half a second
                numberFragements: 50,
                callback: null,
                easing: Konva.Easings.StrongEaseOut
            };
            $.extend(defaults, inputParams);


            const stage = defaults.layer.getStage();
            const colors = ["red", "limegreen", "yellow", "pink", "white"];


            let anim = null;


            if (!defaults.fill) {
                let randomIndex = Math.floor(Math.random() * colors.length);
                defaults.fill = colors[randomIndex];
            }


            const circle = new Konva.Circle({
                x: defaults.x,
                y: defaults.y,
                scaleX: 0.5,
                scaleY: 0.5,
                radius: defaults.radius,
                fillRadialGradientStartPoint: { x: 0, y: 0 },
                fillRadialGradientStartRadius: 0,
                fillRadialGradientEndRadius: defaults.radius,
                fillRadialGradientColorStops: [0, defaults.fill, 1, 'rgba(255, 255, 255, 0)']
            });
            defaults.layer.add(circle);


            const tween = new Konva.Tween({
                node: circle,
                scaleX: 1,
                scaleY: 1,
                duration: defaults.duration,
                easing: Konva.Easings.EaseOut,
                onFinish: function() {
                    const tween2 = new Konva.Tween({
                        node: circle,
                        scaleX: 0.1,
                        scaleY: 0.1,
                        duration: defaults.duration * 2,
                        easing: Konva.Easings.EaseIn,
                        onFinish: function() {
                            anim && anim.stop();
                            circle.remove();
                            defaults.callback && defaults.callback();
                        }
                    }).play();
                }
            }).play();


            if (defaults.paralax && defaults.crosshairs) {
                anim = new Konva.Animation(function() {
                    const newX = defaults.x - (defaults.crosshairs.x() - stage.width() / 2) * defaults.paralax;
                    const newY = defaults.y - (defaults.crosshairs.y() - stage.height() / 2) * defaults.paralax;
                    circle.x(newX).y(newY);
                }, defaults.layer).start();
            }
        };
    });