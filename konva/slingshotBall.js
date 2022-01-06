/*
 The ball for Slingshot
 */


define(
        [
            "jquery",
            "Konva",
            "konva/blastCircle",
            "helpers/lineIntersectsRectangle",
            "helpers/SoundEffects",
            "konva/slingshotBallRubberband",
            "tools"
        ],
    function($, Konva, blastCircleFactory, lineIntersectsRectangle, SoundEffects, slingshotBallRubberband, tools) {


        return function(inputs) {


            // settings
            let settings = $.extend({
                stage: null,
                layer: null,
                radius: 10,
                speed: 5,
                targets: [], // array of things to hit (or avoid...)
                ballHome: {
                    x: 100,
                    y: 100
                },
                shootTweenDuration: 750,
                sounds: true,
                hitSoundSource: "/sounds/slingshot/hit.mp3",
                shootSoundSource: "/sounds/slingshot/shoot.mp3",
                gravity: 9,
                goalPostSpread: 75,
                goalPostColor: "gray",
                goalPostRadius: 3,
                blastCircleStroke: "gray",
                blastCircleRadius: 50,
                blastCircleStrokeWidth: 2,
                bounceOffStageEdge: false,
                rubberband: true,
                rubberbandColor: "lightgray",
                rubberbandWidth: 1,
                onShoot: function() {
                    // callback executed when the ball is shot
                },
                onHit: function() {
                    // callback executed on target hit
                }
            }, inputs || {});


            // making sure we have either a stage or layer passed in
            if (!settings.stage && !settings.layer) {
                console.log("slingshotBall needs either a layer or a stage passed in!");
                return false;
            }
            settings.stage = settings.stage || settings.layer.getStage();
            let layer = settings.layer || (function() {
                let layer = new Konva.Layer();
                settings.stage.add(layer);
                return layer;
            }());


            // adding sound effects, if they haven't been added already (on last instantiation of the slingshotBall)
            const soundEffects = new SoundEffects({
                container: $("#sounds-stuff"),
                playThisOnCheckboxCheck: "hitSound",
                checkBoxTextAlign: "left",
                sounds: {
                    hitSound: settings.hitSoundSource,
                    shootSound: settings.shootSoundSource
                },
            });

            const radius = settings.radius,
                stageWidth = settings.stage.width(),
                stageHeight = settings.stage.height(),
                isMobile = tools.isMobile();
            let numBalls = 0,
                animation;


            // setting lines that denote the borders
            const border = {
                left: {
                    x: radius, // accounting for the circle edge, not just the center point
                    y: -radius * 2,
                    height: stageHeight + (radius * 4),
                    width: 0
                },
                right: {
                    x: stageWidth - radius, // accounting for the circle edge, not just the center point
                    y: -radius * 2,
                    height: stageHeight + (radius * 4),
                    width: 0
                },
                top: {
                    x: -radius * 2, // accounting for the circle edge, not just the center point
                    y: radius,
                    height: 0,
                    width: stageWidth + (radius * 4)
                },
                bottom: {
                    x: -radius * 2, // accounting for the circle edge, not just the center point
                    y: stageHeight + (radius * 6),
                    height: 0,
                    width: stageWidth + (radius * 4)
                }
            };


            let newBall = (function() {


                let masterBall = new Konva.Circle({
                    radius: radius,
                    fillRadialGradientStartRadius: 2,
                    fillRadialGradientEndRadius: radius,
                    fillRadialGradientStartPoint: {
                        x: -2,
                        y: -2
                    },
                    fillRadialGradientColorStops: [0, "#DDD", 1, "#44A"],
                    x: settings.ballHome.x,
                    y: settings.ballHome.y,
                    draggable: true,
                    shadowColor: "rgba(0, 0, 0, 0.2)",
                    shadowOffset: {
                        x: 4,
                        y: 4
                    },
                    shadowBlur: 3,
                    // keeping the ball's upper drag limit to 50 pixels below the words (to avoid cheating)
                    dragBoundFunc: function(pos) {


                        if (settings.targets.length === 0) {
                            return pos;
                        }


                        return {
                            x: pos.x,
                            y: (function() {

                                // stopping 50 pixels before the targets
                                let lineBelowTargets = settings.targets[0].y() + 50;
                                if (pos.y < lineBelowTargets) {
                                    return lineBelowTargets;
                                }

                                // stopping at the bottom edge
                                if (isMobile && pos.y > (stageHeight - radius)) {
                                    return stageHeight - radius;
                                }

                                return pos.y;
                            }())
                        };
                    },
                    // making the 'draggable' region around the circle wider than the circle radius itself
                    // also, making the 'draggable' region even wider when we're on a mobile device
                    hitFunc: function(context) {
                        context.beginPath();
                        context.arc(0, 0, this.radius() + (tools.isMobile() ? 75 : 30), 0, Math.PI * 2, true); // was '100' for mobile
                        context.closePath();
                        context.fillStrokeShape(this);
                    }
                });


                // setting the master ball
                masterBall.x((settings.stage).width() + radius); // offstage
                layer.add(masterBall);
                masterBall.cache();


                function returnHomeAndFadeIn(p) {


                    // setting default values
                    p = p || {};
                    p.delay = p.delay || 0;
                    p.fadeInTime = p.fadeInTime || 0.3;
                    p.onFinish = p.onFinish || null;
                    p.easing = p.easing ? Konva.Easings[p.easing] : Konva.Easings.EaseOut;


                    // returning the ball home, scaling it to 0, and turning on listening
                    ball.x(settings.ballHome.x)
                        .y(settings.ballHome.y)
                        .scale({
                            x: 0,
                            y: 0
                        })
                        .opacity(1)
                        .listening(true)
                        .moveToTop();


                    // fading in the ball
                    let fadeInTween = new Konva.Tween({
                        node: ball,
                        scaleX: 1,
                        scaleY: 1,
                        duration: p.fadeInTime,
                        easing: p.easing,
                        onFinish: function() {
                            if (p.onFinish) {
                                p.onFinish();
                            }
                        }
                    });


                    // fading in the ball, after a delay, if specified
                    setTimeout(function() {
                        fadeInTween.play();
                    }, p.delay);


                    // returning the Tween itself, so we can cancel it later
                    return fadeInTween;
                }


                function destroy(ball) {
                    numBalls -= 1;
                    ball.destroy();
                }


                function make() {
                    numBalls += 1;
                    let thisBall = masterBall.clone();
                    thisBall.setAttrs({
                        x: settings.ballHome.x,
                        y: settings.ballHome.y,
                        opacity: 0,
                        layer: layer
                    });
                    // caching - have to cache AROUND the ball for hitFunc to work right
                    thisBall.cache({
                        x: -(tools.isMobile() ? 75 : 30),
                        y: -(tools.isMobile() ? 75 : 30),
                        height: 2 * (tools.isMobile() ? 75 : 30),
                        width: 2 * (tools.isMobile() ? 75 : 30)
                    });
                    // adding the ball AFTER adding the rubberband
                    layer.add(thisBall);
                    thisBall.returnHomeAndFadeIn = returnHomeAndFadeIn;
                    return thisBall;
                }


                // returning a CLONE of the masterBall
                return {
                    make: make,
                    destroy: destroy
                };
            }());


            let ball = newBall.make();


            ball.returnHomeAndFadeIn({
                delay: 0,
                fadeInTime: 1
            });


            (settings.rubberband) && slingshotBallRubberband({
                settings: settings,
                ball: ball
            });


            // shooting the ball when it's released
            ball.on("dragend", shootBall);

            function shootBall() {


                // turning off listening for slightly better performance
                ball.listening(false);
                settings.onShoot();
                soundEffects.play("shootSound");
                const gravity = settings.gravity * settings.speed; // pixels per second to decelerate Y


                // setting the distance pulled away from ballHome as the base distance
                // the ball should travel per second
                ball.inertia = {
                    x: ball.x() - settings.ballHome.x,
                    y: ball.y() - settings.ballHome.y
                };


                // calculating how fast the ball was traveling when it was released
                const initialVelocity = (function() {
                    let x2 = Math.pow(ball.inertia.x, 2);
                    let y2 = Math.pow(ball.inertia.y, 2);
                    return Math.sqrt(x2 + y2);
                }());


                // returns the strength of the hit
                ball.currentX = ball.x();
                ball.currentY = ball.y();


                animation = new Konva.Animation(animateBallLayer, layer);
                animation.start();


                function checkForOffStage(ball) {
                    if ((ball.goingRight && ball.currentX < -radius) || (ball.goingLeft && ball.currentX > stageWidth + radius)) {
                        return true;
                    }
                    return false;
                }


                function checkForRicochet(ball, line, newX, newY) {

                    if (!settings.bounceOffStageEdge) { return false; }

                    // checking for out-of-bounds - crossing the border, or actually over the border (for whatever reason)
                    if ((ball.goingUp && lineIntersectsRectangle(line, border.top)) || newY < radius) {
                        ricochet({ direction: "bottom", XY: "y", value: (radius + 1) });
                    }

                    // checking for left border hit
                    if ((ball.goingLeft && lineIntersectsRectangle(line, border.left)) || newX < radius) {
                        ricochet({ direction: "right", XY: "x", value: (radius + 1) });
                    }

                    // checking for right border hit
                    if ((ball.goingRight && lineIntersectsRectangle(line, border.right)) || newX > (stageWidth - radius)) { // newX was: ball.currentX
                        ricochet({ direction: "left", XY: "x", value: (stageWidth - radius - 1) });
                    }
                }


                function animateBallLayer(frame) {


                    // keeping track of the old ball position
                    ball.currentX = ball.x();
                    ball.currentY = ball.y();


                    // calculating the new position
                    let newX = ball.currentX - ball.inertia.x * settings.speed * frame.timeDiff / 1000;
                    let newY = ball.currentY - ball.inertia.y * settings.speed * frame.timeDiff / 1000;


                    // returns how fast the ball is traveling, relative to its initialVelocity
                    ball.impactForce = (function() {
                        const travelX = Math.pow(ball.currentX - newX, 2);
                        const travelY = Math.pow(ball.currentY - newY, 2);
                        const impactForce = Math.sqrt(travelX + travelY) / initialVelocity;
                        return impactForce * settings.speed;
                    }());


                    // calculating a line from the current XY to the new XY, to see if it intersects with anything
                    let line = {
                        x1: ball.currentX,
                        y1: ball.currentY,
                        x2: newX,
                        y2: newY
                    };


                    // applying gravity to drag the ball slowly down
                    ball.inertia.y -= (frame.timeDiff / 1000) * gravity;


                    // noting which direction the ball is moving, so we can avoid unnecessary checks
                    ball.goingUp = ball.inertia.y > 0;
                    ball.goingDown = ball.inertia.y < 0;
                    ball.goingRight = ball.inertia.x > 0;
                    ball.goingLeft = ball.inertia.x < 0;


                    checkForRicochet(ball, line, newX, newY);

                    if (checkForOffStage(ball)) {
                        returnHome();
                        return;
                    }


                    // checking for off-the-bottom -- use ball.currentY, not newY,
                    // because we're testing for where the ball REALLY IS, not where it WILL be
                    if (ball.goingDown && ball.currentY > (stageHeight + radius * 3)) {
                        returnHome();
                        return;
                    }


                    // simply redrawing the ball, if there are no targets (unlikely...)
                    if (settings.targets.length === 0) {
                        ball.x(newX).y(newY);
                        return true;
                    }


                    // checking for target hit (returning once any block is hit)
                    settings.targets.some(function(thisBlock) {


                        // NEW TEST thisBlock.width may be a property or method, so handling that!
                        thisBlock.width = (typeof thisBlock.width === "function" ? thisBlock.width() : thisBlock.width);
                        thisBlock.height = (typeof thisBlock.height === "function" ? thisBlock.height() : thisBlock.height);

                        const ballLeft = newX - radius;
                        const ballRight = newX + radius;
                        const ballTop = newY - radius;
                        const ballBottom = newY + radius;

                        const blockLeft = thisBlock.x() - thisBlock.offsetX();
                        const blockRight = blockLeft + thisBlock.width + thisBlock.offsetX(); // NEW TEST removed parentheses
                        const blockTop = thisBlock.y() - thisBlock.offsetY();
                        const blockBottom = blockTop + thisBlock.height + thisBlock.offsetY(); // NEW TEST removed parentheses

                        const rect = {
                            x: blockLeft - radius, // accounting for the circle edge, not just the center point
                            y: blockTop - radius,
                            height: thisBlock.height + (radius * 2),
                            width: thisBlock.width + (radius * 2)
                        };


                        // testing for intersection
                        if (lineIntersectsRectangle(line, rect)) {


                            let overlapT = ballBottom - blockTop;
                            let overlapB = blockBottom - ballTop;
                            let overlapL = ballRight - blockLeft;
                            let overlapR = blockRight - ballLeft;


                            if (overlapT === Math.min.apply(null, [overlapT, overlapB, overlapL, overlapR])) {
                                ball.hitFromDirection = "top";
                                ball.y(rect.y - 2); // setting ball.x() slightly away from the border
                            }

                            if (overlapB === Math.min.apply(null, [overlapT, overlapB, overlapL, overlapR])) {
                                ball.hitFromDirection = "bottom";
                                ball.y(rect.y + rect.height + 2); // setting ball.x() slightly away from the border
                            }

                            if (overlapL === Math.min.apply(null, [overlapT, overlapB, overlapL, overlapR])) {
                                ball.hitFromDirection = "left";
                                ball.x(rect.x - 2); // setting ball.x() slightly away from the border
                            }

                            if (overlapR === Math.min.apply(null, [overlapT, overlapB, overlapL, overlapR])) {
                                ball.hitFromDirection = "right";
                                ball.x(rect.x + rect.width + 2); // setting ball.x() slightly away from the border
                            }


                            // saving the currentX and currentY values
                            ball.currentX = ball.x();
                            ball.currentY = ball.y();


                            // checking whether it's the right word or not from the main class
                            let isCorrect = settings.onHit(thisBlock);


                            // if we've hit the correct target...
                            if (isCorrect) {
                                soundEffects.play("hitSound");
                                ball.opacity(0); // hiding, but not (yet) removing the ball
                                makeBlastCircle(thisBlock.x(), thisBlock.y());
                                returnHome();
                            } else {
                                ricochet({ direction: ball.hitFromDirection });
                            }

                            return true;
                        } else {
                            ball.x(newX).y(newY);
                        }
                    });
                }
            }


            function returnHome() {


                animation.stop();


                // setting any remaining inertia to 0
                ball.inertia = {
                    x: 0,
                    y: 0
                };


                // fading out the ball quickly (opacity only, not radius) before returning it home
                ball.to({
                    duration: 0.2,
                    opacity: 0,
                    easing: Konva.Easings.EaseIn,
                    onFinish: function() {


                        // expanding the ball from 0 to its full radius, once it's back in its home position
                        let thisTween = ball.returnHomeAndFadeIn();


                        // if the ball is dragged while still tweening, then jumping to the end of the tween (so the ball is fully enlarged)
                        ball.off("dragstart", finishTween).on("dragstart", finishTween);

                        function finishTween() {
                            thisTween.finish();
                        }
                    }
                });
            }


            function makeBlastCircle(x, y) {


                blastCircleFactory({
                    stage: settings.stage,
                    layer: layer,
                    x: x,
                    y: y,
                    duration: 1,
                    radius: settings.blastCircleRadius,
                    strokeWidth: settings.blastCircleStrokeWidth,
                    stroke: settings.blastCircleStroke,
                    squishY: false,
                    shape: settings.blastCircleShape || "circle",
                    // FOLLOWING LINES are new, because we're making a star
                    innerRadius: settings.blastCircleInnerRadius || 30, // NEW TEST
                    outerRadius: settings.blastCircleOuterRadius || 50, // NEW TEST
                    fill: settings.blastCircleFill ? settings.blastCircleFill : null
                });
            }


            let ricochet = (function() {


                let ricochetSoundLastPlayed = (new Date()).getTime();


                return function(p) {


                    // checking parameters
                    if (!p || typeof p !== "object" || !p.direction) {
                        console.log("Ricochet didn't recieve the right parameters!");
                        return false;
                    }


                    let direction = p.direction;
                    let XY = p.XY;
                    let value = p.value;


                    // ensuring we don't play the ricochet sound twice in a row (particularly for the same ricochet event)
                    let currentTime = (new Date()).getTime();
                    if (currentTime - ricochetSoundLastPlayed > 50) {
                        soundEffects.play("hitSound");
                        ricochetSoundLastPlayed = currentTime;
                    }


                    if (direction === "bottom") {
                        // making ball's Y interia NEGATIVE
                        ball.inertia.y = -Math.abs(ball.inertia.y);
                    } else if (direction === "top") {
                        // making ball's Y interia POSITIVE
                        ball.inertia.y = Math.abs(ball.inertia.y);
                    } else if (direction === "right") {
                        // making ball's X interia NEGATIVE
                        ball.inertia.x = -Math.abs(ball.inertia.x);
                    } else if (direction === "left") {
                        // making ball's X interia POSITIVE
                        ball.inertia.x = Math.abs(ball.inertia.x);
                    }


                    // forcing the x or y value, if passed in
                    if (XY && value !== "undefined") {
                        ball[XY](value);
                        ball.currentX = ball.x();
                        ball.currentY = ball.y();
                    }
                };
            }());


            // setting new targets
            ball.targets = function(array) {
                settings.targets = array;
            };


            // NEW TEST setting whether to have the ball ricochet off edges or not dynamically
            ball.bounceOffStageEdge = function(value) {
                settings.bounceOffStageEdge = value;
                return ball;
            }


            // returning the completed ball
            return ball;
        };
    });