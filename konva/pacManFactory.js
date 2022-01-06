define(
        [
            "jquery",
            "Konva",
            "konva/blastCircle",
            "tools",
            "howler",
        ],
    function($, Konva, BlastCircle, tools) {


        /*
         *
         *      Preloading sounds
         *
         */

        let movementSound = null,
            pacManDie = null;

        $(window).on("keydown touchend", enableSounds);

        function enableSounds() {

            $(window).off("keydown touchend", enableSounds);

            movementSound = new Howl({
                src: ["/sounds/pac_man/movementSound.mp3"],
                loop: true
            });
            movementSound.isPlaying = false;

            pacManDie = new Howl({
                src: ["/sounds/pac_man/pacManDie.mp3"]
            });
        }


        let startText, pakuTween;


        return function(inputs) {


            // settings
            let settings = $.extend({
                layer: null, // required
                stage: null, // not required
                // bodyColors: ["#339", "green", "orange", "red"],
                bodyColors: ["orange", "pink", "lawngreen", "lightblue", ],
                boundaries: null, // can be set to "stage"
                disableOnStartup: false,
                fill: "#090",
                growOnBirth: true,
                turnAnimationDuration: 100,
                pauseBeforeDie: 500,
                hittables: [],
                id: "pacMan",
                mouthOpenDegrees: 135,
                obstacles: [], // array of thing pacMan will stop at, but no callbacks
                pakuInterval: 0.15,
                playBirthSound: true,
                radius: 20,
                speed: 200, // pixels per second, the higher the faster
                useBlastCircleBeforeBirth: false,
                useBlastCircleOnDie: true,
                useSoundEffects: true,
                soundEffects: null, // passed in, probably
                onBirth: function() {
                    // called when pacMan is born
                },
                onMove: function() {
                    // function to be called whenever pacMan moves
                },
                birthBlastCircleDuration: 1000,
            }, inputs || {});


            const stage = settings.stage || settings.layer.getStage();


            // NOTE soundEffects are passed in
            // settings.soundEffects.addSounds({
            //     birthSound: "/sounds/pac_man/birthSound.mp3"
            // });


            // calculating the dimensions of the obstacles, which must be STATIC, not moving
            const obstacles = (function() {
                let array = [];
                settings.obstacles.forEach(function(thisObstacle) {
                    let object = {
                        left: thisObstacle.x(),
                        right: thisObstacle.x() + thisObstacle.width || thisObstacle.width(),
                        top: thisObstacle.y(),
                        bottom: thisObstacle.y() + thisObstacle.height || thisObstacle.height()
                    };
                    array.push(object);
                });
                return array;
            }());


            // the pacMan wedge itself
            const pacManBody = new Konva.Wedge({
                radius: settings.radius,
                rotation: 30, // mouth slightly open at start
                angle: 300
            });
            pacManBody.width = pacManBody.radius() * 2;
            pacManBody.height = pacManBody.radius() * 2;


            // filling the body with teh specified color, in a complelling gradient pattern
            fillBody(settings.fill);


            // the group, necessary for rotating pacMan
            const pacMan = new Konva.Group({
                id: settings.id
            });


            // adding width, height & radius properties, because the group doeesn't support them directly
            pacMan.width = pacManBody.radius() * 2;
            pacMan.height = pacManBody.radius() * 2;
            pacMan.radius = pacManBody.radius;

            pacMan.hasStartedMoving = false; // What is this for?


            /*
             *
             *  pacMan methods!
             *
             */


            pacMan.disable = function() {
                pacMan.isMovable = false;
            };


            pacMan.enable = function() {
                startText && startText.remove();
                pacMan.isMovable = true;
            };


            pacMan.add(pacManBody);
            pacMan.isMovable = !!(settings.disableOnStartup);


            // keyup & keydown listeners - to move pacMan, and to control mouth pakuing
            tools.keydown([37, 38, 39, 40], function(e) {
                pacMan.isMovable && paku.start();
            });


            // checking for arrow presses 30 times per second (default frame rate)
            const anim = (function() {

                // local variables
                let previousOrientation = null;

                const arrowKeys = {
                    37: { x: -1, y: 0, rotation: 180 },
                    38: { x: 0, y: -1, rotation: 270 },
                    39: { x: 1, y: 0, rotation: 0 },
                    40: { x: 0, y: 1, rotation: 90 },
                };


                const slideAnimation = new Konva.Animation(slidePacMan, settings.layer).start();

                function slidePacMan(frame) {

                    if (!pacMan.isMovable || tools.noArrowKeysPressed()) {
                        if (movementSound) {
                            movementSound.stop();
                            movementSound.isPlaying = false;
                        }
                        paku.stop();
                        return false;
                    }

                    // used to be surrounded with try/catch
                    if (movementSound && settings.useSoundEffects && !movementSound.isPlaying) {
                        settings.soundEffects.areOn() && movementSound.play();
                        movementSound.isPlaying = true;
                    }

                    pacMan.hasStartedMoving = true; // what is this for??
                    settings.onMove && settings.onMove();

                    // slowing speed to x0.8 if two+ keys are pressed
                    const seconds = frame.timeDiff / 1000;
                    const speed = settings.speed * seconds * (tools.numKeysPressed() >= 2 ? 0.8 : 1);
                    let newRotation = 0;


                    // setting newX & newY to pacMan's current coordinates to start with
                    let newX = pacMan.x();
                    let newY = pacMan.y();


                    // calculating pacMan's boundaries
                    const pm = {
                        top: newY - settings.radius,
                        bottom: newY + settings.radius,
                        right: newX + settings.radius,
                        left: newX - settings.radius
                    };


                    // cycling through ALL the arrow keys, calculating
                    // newX & newY and sliding pacMan
                    for (let i = 37; i <= 40; i++) {
                        if (tools.keyIsPressed(i)) {
                            newX += (speed * arrowKeys[i].x);
                            newY += (speed * arrowKeys[i].y);
                            newRotation += arrowKeys[i].rotation;
                        }
                    }


                    // stopping pacMan at boundaries, if defined
                    if (settings.boundaries) {

                        const radius = settings.radius;
                        const box = settings.boundaries;

                        if (newX - radius < box.x()) { newX = radius + box.x(); }
                        if (newX + radius > box.x() + box.width()) { newX = box.x() + box.width() - radius; }
                        if (newY - radius < box.y()) { newY = radius + box.y(); }
                        if (newY + radius > box.y() + box.height()) { newY = box.y() + box.height() - radius; }
                    }


                    // stopping pacMan at obstacles, if any
                    if (settings.obstacles) {

                        obstacles.forEach(function(ob) {

                            const r = settings.radius;

                            if ((newX < ob.left) && (newX + r > ob.left) && (newY + r > ob.top) && (newY - r < ob.bottom)) {
                                newX = ob.left - r;
                            }

                            if ((newX > ob.right) && (newX - r < ob.right) && (newY + r > ob.top) && (newY - r < ob.bottom)) {
                                newX = ob.right + r;
                            }

                            if ((newY > ob.bottom) && (newY - r < ob.bottom) && (newX + r > ob.left) && (newX - r < ob.right)) {
                                newY = ob.bottom + r;
                            }

                            if ((newY < ob.top) && (newY + r > ob.top) && (newX + r > ob.left) && (newX - r < ob.right)) {
                                newY = ob.top - r;
                            }
                        });
                    }

                    // sliding the pacMan group
                    pacMan.x(newX);
                    pacMan.y(newY);

                    // calcuating new rotation
                    newRotation = newRotation / tools.currentlyPressedKeys.numPressed(); // BUGGY because it looks at more than just arrow keys
                    if (tools.keysAreAllPressed([38, 39])) {
                        newRotation = 315;
                    }

                    // initiating the turning tween, if one isn't already in process
                    if (newRotation !== previousOrientation) {

                        // adjusting for rotation changes greater than half a circle, so
                        // pacMan takes the shorter distance to the correct rotation
                        if (previousOrientation - newRotation > 180) { // like, 12:00 to 3:00
                            previousOrientation -= 360;
                        } else if (newRotation - previousOrientation > 180) { // like, 3:00 to 12:00
                            previousOrientation += 360;
                        }
                        pacMan.rotation(previousOrientation);
                        previousOrientation = newRotation;
                        pacMan.to({
                            duration: settings.turnAnimationDuration / 1000,
                            rotation: newRotation
                        });
                    }

                    // cycling through the 'hittables' stuff, checking for hits, and executing the appropriate callback in that event
                    settings.hittables.forEach(function(d) {
                        checkForHit(d.items, d.onHit);
                    });

                    function checkForHit(array, callback) {

                        array.forEach(function(block) {

                            // accounting for offset and scaling
                            const width = block.width || block.width();
                            const height = block.height || block.height();
                            const offsetX = (block.offsetX() * block.scaleX());
                            const offsetY = (block.offsetY() * block.scaleY());

                            const target = {
                                left: block.x() - offsetX,
                                right: block.x() - offsetX + width,
                                top: block.y() - offsetY,
                                bottom: block.y() - offsetY + height
                            };

                            // checking for overlap (technically, LACK of overlap)
                            if (!(pm.right < target.left || pm.left > target.right || pm.bottom < target.top || pm.top > target.bottom)) {
                                callback(block);
                            }
                        });
                    }
                }
                return slideAnimation;
            }());


            pacMan.startText = function(inputs) {

                const startTextSettings = $.extend({
                    text: "Click to\nStart",
                    fill: "yellow",
                    fontSize: 16,
                    onClick: null,
                    align: "center",
                    useBlastCircle: true
                }, inputs || {});

                startText = new Konva.Text({
                    text: startTextSettings.text,
                    align: startTextSettings.align,
                    fontSize: startTextSettings.fontSize,
                    fill: startTextSettings.fill,
                    opacity: 0
                });

                pacMan.add(startText);
                startText.to({ duration: 1, opacity: 1 });
                startText.y(pacManBody.radius());
                startText.offsetX(startText.width() / 2);
                settings.layer.draw();

                // stage click triggers pacMan click
                stage.on("contentClick", layerClickTriggersPacmanClick);

                function layerClickTriggersPacmanClick() {
                    stage.off("contentClick", layerClickTriggersPacmanClick);
                    pacMan.fire("click");
                }

                pacMan.on("click tap", removeStartText);

                function removeStartText() {
                    pacMan.off("click tap", removeStartText);
                    startText.remove();
                    settings.layer.draw();
                    startTextSettings.onClick && startTextSettings.onClick();
                }
            };


            pacMan.die = function() {

                // turning off listeners
                pacMan.isMovable = false;
                paku.stop();
                pacManBody.angle(360);

                if (movementSound) {
                    movementSound.stop();
                    movementSound.isPlaying = false;
                }

                setTimeout(function() {

                    anim.stop();

                    settings.soundEffects && settings.soundEffects.play("pacManDie");
                    const dieTween = new Konva.Tween({
                        node: pacManBody,
                        duration: pacManDie._duration, // length of the AUDIO!  How cool is that?
                        angle: 0,
                        rotation: 180,
                        onFinish: function() {
                            if (settings.useBlastCircleOnDie) {
                                BlastCircle({
                                    layer: settings.layer,
                                    x: pacMan.x(),
                                    y: pacMan.y(),
                                    strokeWidth: 3,
                                    stroke: "yellow",
                                    numCircles: 3,
                                    blastInterval: 100,
                                });
                            }
                        }
                    }).play();
                }, settings.pauseBeforeDie);
            };


            // increasing pacMan's speed
            pacMan.speedUp = (function() {

                const defaultFactorToIncreaseSpeed = 1.5;
                let speedLevel = 0;

                return function(speedUpAmount) {

                    speedUpAmount = speedUpAmount || defaultFactorToIncreaseSpeed;

                    if (speedLevel < settings.bodyColors.length) {
                        speedLevel += 1;
                    }

                    settings.speed *= speedUpAmount;
                    fillBody(settings.bodyColors[speedLevel]);
                };
            }());


            pacMan.stop = function() {

                anim.stop();
                pacMan.isMovable = false;
                paku.stop();

                if (movementSound) {
                    movementSound.stop();
                    movementSound.isPlaying = false;
                }
            };


            // scaling pacMan...
            pacMan.scale = (function() {

                let currentScale;

                return function(scale, duration, bounce) {

                    // setting to OFF first, until we're sure we're expanding and not contracting
                    pacMan.isMovable = false;

                    if (!scale || isNaN(scale)) { return currentScale; }

                    // if pacMan is just appearing, without growing from nothing
                    if (!duration) {
                        pacManBody.scaleX(scale);
                        pacManBody.scaleY(scale);
                        currentScale = scale;
                        settings.layer.draw();

                        return true;
                    }

                    currentScale = scale;
                    const tween = new Konva.Tween({
                        node: pacManBody,
                        duration: duration || 1, // one second by default
                        scaleX: scale,
                        scaleY: scale,
                        easing: bounce ? Konva.Easings.BounceEaseOut : Konva.Easings.EaseOut,
                        onFinish: function() {
                            settings.radius = settings.radius * scale;
                        }
                    }).play();

                    // playing the birthSound, maybe...
                    settings.playBirthSound && settings.soundEffects.play("birthSound");
                };
            }());


            pacMan.flash = function() {
                const circle = new Konva.Circle({
                    fill: "white",
                    opacity: 1,
                    radius: pacManBody.radius()
                });
                pacMan.add(circle);
                circle.to({
                    opacity: 0,
                    duration: 0.5,
                    onFinish: function() {
                        circle.destroy();
                    }
                });
            };


            pacMan.shrinkAway = function(callback) {
                paku.stop();
                pacMan.isMovable = false;
                anim.stop();
                pacManBody.to({
                    radius: 0.01,
                    duration: 1,
                    onFinish: function() {
                        pacMan.remove();
                        callback && setTimeout(callback, 1000);
                    }
                });
            };


            pacMan.fadeAndRemove = (p = {}) => {
                pacMan.to({
                    opacity: 0,
                    duration: p.duration || 1,
                    onFinish: function() {
                        pacMan.removeMe();
                        p.callback && p.callback();
                    }
                });
            };


            pacMan.removeMe = function() {
                paku.stop();
                pacMan.isMovable = false;
                anim.stop();
                pacMan.remove();
            };


            pacMan.speedUpBlastCircle = function() {
                BlastCircle({
                    layer: settings.layer,
                    x: pacMan.x(),
                    y: pacMan.y(),
                    strokeWidth: pacMan.width / 4,
                    radius: Math.min(stage.width(), stage.height()) / 2,
                    duration: 2,
                    stroke: "yellow",
                });
            };


            // finally, displaying pacMan
            if (settings.growOnBirth) {

                pacMan.scale(0.01, 0);

                // if we're not using a reverse blastCircle before pacMan's birth, then just increasing scale
                if (!settings.useBlastCircleBeforeBirth) {
                    setTimeout(function() {
                        pacMan.scale(1, 0.5);
                        settings.onBirth();
                    }, 200);
                } else {

                    // ... or, if we ARE using a reverse blastCircle to herald the impending birth...
                    setTimeout(function() {
                        BlastCircle({
                            layer: settings.layer,
                            x: pacMan.x(),
                            y: pacMan.y(),
                            strokeWidth: 1,
                            radius: pacMan.width,
                            duration: settings.birthBlastCircleDuration / 1000,
                            numCircles: 1,
                            stroke: "green",
                            reverseMode: true,
                            callback: function() {
                                pacMan.scale(1, 0.5);
                                settings.onBirth();
                            }
                        });
                    }, 0);
                }
            }


            function fillBody(color) {
                pacManBody.fillRadialGradientEndRadius(pacManBody.radius());
                pacManBody.fillRadialGradientColorStops([0, "white", 1, color]);
                settings.layer.draw();
            }


            const paku = (function() {

                let pakuModeOn = false;

                function start() {

                    // making sure this won't be called multiple times
                    if (pakuModeOn) { return false; }
                    pakuModeOn = true;

                    // closing the mouth before starting pakuing
                    pacManBody.angle(360);
                    pacManBody.rotation(0);

                    // tweens the mouth open from a closed state
                    pakuTween = new Konva.Tween({ // using full Tween 'cause we're using .reverse() later
                        node: pacManBody,
                        rotation: settings.mouthOpenDegrees / 2,
                        angle: 360 - settings.mouthOpenDegrees,
                        duration: settings.pakuInterval,
                        onFinish: function() {
                            this.reverse();
                            setTimeout(function() {
                                pakuModeOn && pakuTween.reset().play();
                            }, settings.pakuInterval * 1000);
                        }
                    }).play();
                }

                function stop() {
                    pakuModeOn = false;
                }

                return { start, stop, };
            }());


            // returning a wedge with the above properties and methods
            return pacMan;
        };
    });