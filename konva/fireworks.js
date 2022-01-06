

define(
        [
            "jquery",
            "Konva",
            "konva/blastCircle",
            "tools",
            "howler"
        ],
        function (
            $, 
            Konva, 
            blastCircle, 
            tools
        ) {


            /*
             * 
             * 
             *      These lines run on program start
             * 
             *           
             */


            const colorsArray = ["red", "orange", "green", "yellow", "lightblue"];
            const tail = {
                height: 75,
                width: 2,
                color: "orange"
            };


            let fireworksLayer = null;


            // preploading the sound
            const fireworksSound = new Howl({
                src: ["/sounds/pac_man/fireworks.mp3"],
                audoplay: true
            });


            // the fireworks flaming line, to be cloned below
            const lineMaster = new Konva.Rect({
                width: tail.width,
                height: tail.height,
                fillLinearGradientStartPoint: {
                    x: 0,
                    y: 0
                },
                fillLinearGradientEndPoint: {
                    x: 0,
                    y: 100
                },
                fillLinearGradientColorStops: [0, tail.color, 1, "rgba(255, 255, 255, 0)"]
            });


            // generates (clone) new lines, with rabndom X/Y values
            const line = (function () {


                let linesArray = [];


                function makeNew(stage, layer) {


                    const randomX = (Math.random() * (stage.width() - 200)) + 100;
                    const randomY = (Math.random() * (stage.height() - 200)) + 50;


                    const line = lineMaster.clone({
                        x: randomX,
                        y: randomY + stage.height() // below the stage
                    }).cache().moveTo(layer);


                    return line;
                }


                function destroyAll(layer) {
                    linesArray.forEach(function (thisLine) {
                        thisLine && thisLine.destroy();
                    });
                    layer.destroyChildren();
                    layer.draw();
                }


                return {
                    makeNew,
                    destroyAll,
                };
            }());




            /*
             * 
             * 
             *      The following runs on instantiation
             *      
             *      
             */



            return function (defaults) {


                if (!defaults || typeof defaults !== "object" || !defaults.stage) {
                    console.log("Bad parameters!");
                    return false;
                }


                defaults = $.extend({
                    stage: null, // REQUIRED
                    numberOfFireworks: 20,
                    strokeWidth: 2,
                    fill: "yellow",
                    useSounds: true,
                    onFinish: function () {
                        //
                    }
                }, defaults || {});


                const stage = defaults.stage;
                
                
                let fireworksInterval = null;
                let tweensArray = [];
                let counter = 0;


                fireworksLayer = new Konva.Layer().moveTo(stage);


                const cleanUp = (function () {


                    let hasBeenCalled = false;


                    return function () {
                        if (hasBeenCalled) { return false; }
                        hasBeenCalled = true;
                        stage.off("contentClick contentTap", cleanUp);
                        clearInterval(fireworksInterval);
                        fireworksLayer.destroy();
                        setTimeout(function () {
                            defaults.onFinish();
                        }, 500);
                    };
                }());


                stage.on("contentClick contentTap", cleanUp);


                fireworksInterval = setInterval(shootFirework, 50);
                function shootFirework() {


                    // exiting if there are no more fireworks
                    counter++;
                    if (counter > defaults.numberOfFireworks) {
                        clearInterval(fireworksInterval);
                        return;
                    }


                    // picking off the first line in the linesArray
                    const thisLine = line.makeNew(stage, fireworksLayer);


                    // shooting the firework (line only)
                    let tween = new Konva.Tween({
                        node: thisLine,
                        duration: 1,
                        y: thisLine.y() - stage.height(),
                        onFinish: function () {


                            if (defaults.useSound) {
                                tools.coinToss() && fireworksSound.play(); // sound on SOME fireworks
                            }


                            // firing off a blastCircle for the firework head
                            blastCircle({
                                layer: fireworksLayer,
                                x: thisLine.x(),
                                y: thisLine.y(),
                                strokeWidth: 2, //defaults.strokeWidth,
                                outerRadius: 50,
                                innerRadius: 40,
                                numPoints: 12,
                                shape: "star",
                                stroke: tools.pickOneFrom(colorsArray),
                                fill: defaults.fill
                            });


                            thisLine.remove();
                            defaults.numberOfFireworks--;
                            if (defaults.numberOfFireworks === 0) {
                                console.log("counter is " + counter);
                                console.log("defaults.numberOfFireworks is " + defaults.numberOfFireworks);
                                cleanUp();
                            }
                        }
                    });
                    tweensArray.push(tween);
                    tween.play();
                }
            };
        });
