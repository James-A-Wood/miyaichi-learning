/* jshint expr: true */


define(
    [
        "jquery",
        "tools",
        "Konva",
    ],
    function(
        $,
        tools,
        Konva
    ) {


        const holderClass = "confetti-holder";


        const getRandomColor = (function() {

            const colorsArray = [
                "red",
                "green",
                "orange",
                "purple",
            ];

            return function() {
                return tools.pickOneFrom(colorsArray);
            };
        }());


        function stopAndRemove() {
            $(`.${holderClass}`).remove();
            return this;
        }


        function makeNew(obj = {}) {


            obj = $.extend({
                parent: null, // REQUIRED unless specifying x and y below
                x: null, // optional, if parent not specified
                y: null, // optional, if parent not specified
                numSparks: 15,
                fill: null,
                duration: 1.3,
                scatterWidth: window.innerWidth / 3,
                scatterHeight: window.innerHeight / 2,
                numberFlutters: 3,
                delayBetweenSparks: 5,
                pieceFadeoutDuration: 0, // percentage of the whole duration
                pieceWidth: 10,
                pieceHeight: 10,
            }, obj);


            if (obj.parent) {
                const $parent = tools.forceJQuery(obj.parent);
                obj.x = $parent.offset().left + $parent.outerWidth() / 2;
                obj.y = $parent.offset().top + $parent.outerHeight() / 2;
            }


            const $konvaHolder = $(`<div class="${holderClass}"></div>`).css({
                position: "absolute",
                top: obj.y - obj.scatterHeight / 2,
                left: obj.x - obj.scatterWidth / 2,
                width: obj.scatterWidth,
                height: obj.scatterHeight,
            }).appendTo("body");


            const stage = new Konva.Stage({
                container: $konvaHolder[0],
                width: $konvaHolder.outerWidth(),
                height: $konvaHolder.outerHeight(),
            });
            const layer = new Konva.Layer().moveTo(stage);


            for (let i = 0; i < obj.numSparks; i++) {
                setTimeout(pieceOfConfetti, i * obj.delayBetweenSparks);
            }


            function pieceOfConfetti() {


                const pieceWidth = (obj.pieceWidth * 0.7) + (Math.random() * obj.pieceWidth * 0.6);
                const pieceHeight = (obj.pieceHeight * 0.7) + (Math.random() * obj.pieceHeight * 0.6);
                const rotation = 3 - Math.random() * 6; // between -3 and 3
                const duration = (obj.duration * 0.8) + (Math.random() * obj.duration * 0.4);


                const piece = new Konva.Rect({
                    x: stage.width() / 2,
                    y: stage.height() / 2,
                    width: pieceWidth,
                    height: pieceHeight,
                    fill: obj.fill || getRandomColor(),
                    offsetX: pieceWidth / 2,
                    offsetY: pieceHeight / 2,
                }).cache().moveTo(layer).filters([Konva.Filters.Brighten]);


                // vertical movement (rising, then falling)
                piece.to({
                    y: Math.random() * obj.scatterHeight / 2,
                    easing: Konva.Easings.EaseOut,
                    duration: duration / 2,
                    onFinish: function() {
                        piece.to({
                            y: obj.scatterHeight,
                            easing: Konva.Easings.EaseIn,
                            duration: duration / 2,
                        });
                    }
                });


                // lateral movement & rotation
                piece.to({
                    x: Math.random() * obj.scatterWidth,
                    duration: duration,
                    rotation: 360 * rotation,
                    onFinish: function() {
                        piece.destroy();
                        if (layer.getChildren().length < 1) {
                            $konvaHolder.remove();
                            obj.callback && obj.callback();
                        }
                    }
                });


                // fluttering
                piece.to({
                    scaleX: 0,
                    duration: duration / (Math.random() * obj.numberFlutters * 0.4 + obj.numberFlutters * 0.8),
                    yoyo: true, // interesting that "yoyo" is not in the documentation
                });


                // fading out
                setTimeout(function() {
                    piece.getLayer() && piece.to({
                        opacity: 0,
                        duration: obj.duration * obj.pieceFadeoutDuration,
                    });
                }, duration * (1 - obj.pieceFadeoutDuration) * 1000);
            }


            return this;
        }


        return {
            makeNew,
            stopAndRemove,
        };
    });