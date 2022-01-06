/* jshint expr: true */


define(
    [
        "jquery",
        "Konva",
        "tools",
        "howler"
    ],
    function($, Konva, tools) {


        return function(p = {}) {


            p = $.extend({
                source: "/images/sheep.png",
                music: "/sounds/sheepAttack.mp3",
                button: null,
                rainInterval: 0.1,
                rainSpeed: 3,
                rotation: 90,
                stageClickClears: true,
                escapeKeyClears: true,
                sheepWidth: 100,
                sheepHeight: 100,
                fallEasing: null,
                varyDepths: true,
                darken: true,
                maxDepthVariation: 0.5,
                onAllSheepDropped: function() {
                    //
                }
            }, p);


            const clickEvent = tools.isMobile() ? "contentTap" : "contentClick";
            const music = p.music ? new Howl({
                src: [p.music]
            }) : null;


            const imageData = new Image();
            imageData.onload = function() {
                sheepMaster = new Konva.Image({
                    image: imageData,
                    offsetX: p.sheepWidth / 2,
                    offsetY: p.sheepHeight / 2,
                    width: p.sheepWidth,
                    height: p.sheepHeight
                });
            };
            imageData.src = p.source;


            let sheepRainInterval = null,
                sheepMaster = null,
                sheepArray = [],
                tweensArray = [],
                numberSheepDropped = 0,
                numberActiveSheep = 0,
                $holder,
                stage,
                layer;


            p.button.on("click", rain);


            function createNewHolder() {


                $holder = $("<div></div>").css({
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: window.innerWidth,
                    height: window.innerHeight
                }).appendTo("body");


                stage = new Konva.Stage({
                    container: $holder[0],
                    height: window.innerHeight,
                    width: window.innerWidth
                });
                layer = new Konva.Layer().moveTo(stage);


                return true;
            }


            function rain() {


                if ($holder) {
                    clear();
                    return false;
                }


                createNewHolder();


                const checkInterval = setInterval(checkForSheep, 5);


                function checkForSheep() {
                    if (sheepMaster) {
                        clearInterval(checkInterval);
                        beginRain();
                    }
                }
            }


            function beginRain() {


                p.escapeKeyClears && tools.keydownOnce(27, clear);
                p.darken && darkenBackground(stage);


                const speed = p.rainSpeed;
                let interval = p.rainInterval;
                p.stageClickClears && stage.on(clickEvent, clear);
                music && music.play && music.play();


                sheepRainInterval = setInterval(function() {


                    const sheep = sheepMaster.clone({
                        x: Math.random() * stage.getWidth(),
                        rotation: (p.rotation / 2) - (Math.random() * p.rotation),
                        listening: false
                    }).moveTo(layer).cache();
                    sheep.y(-(sheep.height() - sheep.offsetY()));


                    numberSheepDropped++;


                    // making some sheeps closer (bigger), others farther away (smaller);
                    if (p.varyDepths) {
                        const scale = (1 + p.maxDepthVariation) - (Math.random() * p.maxDepthVariation * 2);
                        sheep.scaleX(scale).scaleY(scale);
                    }


                    sheepArray.push(sheep);
                    numberActiveSheep++;


                    const fallTween = new Konva.Tween({
                        node: sheep,
                        duration: speed * (1 / sheep.scaleX()), // smaller scaleX => slower drop
                        y: stage.height() + (sheep.height() - sheep.offsetY()),
                        rotation: sheep.rotation() + (sheep.rotation() > 0 ? 40 : -40),
                        easing: p.fallEasing,
                        onFinish: function() {
                            sheep.destroy();
                            numberActiveSheep--;
                            if (numberActiveSheep <= 0) {
                                destroy();
                            }
                        }
                    }).play();
                    tweensArray.push(fallTween);
                }, interval * 1000);
            }


            function darkenBackground(stage) {
                const rect = new Konva.Rect({
                    x: 0,
                    y: 0,
                    width: stage.width(),
                    height: stage.height(),
                    fill: "black",
                    opacity: 0
                }).moveTo(layer).cache().to({
                    opacity: 0.3,
                    duration: 1,
                });
                return true;
            }


            function clear() {


                cancelRain();


                sheepArray.forEach(function(sheep) {
                    sheep && sheep.destroy && sheep.destroy();
                });


                tweensArray.forEach(function(tween) {
                    tween && tween.destroy && tween.destroy();
                });


                sheepArray.length = 0;
                tweensArray.length = 0;


                stage && stage.destroyChildren().draw();
                $holder.remove();
                stage = null;
                layer = null;
                $holder = null;
            }


            function cancelRain() {
                music && music.stop();
                clearInterval(sheepRainInterval);
                sheepRainInterval = null;
            }


            return {
                rain,
                clear,
                cancel: cancelRain,
            };
        };

    });