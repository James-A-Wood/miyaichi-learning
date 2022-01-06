/* jshint expr: true */



define(
        [
            "jquery",
            "Konva",
            "konva/blastCircle",
            "konva/shakeStage",
            "helpers/SoundEffects",
        ],
    function($, Konva, blastCircle, shakeStage, SoundEffects) {


        return function(obj = {}) {


            if (!obj.layer && !obj.stage) {
                log("BallFactory requires a reference to either a layer or a stage");
                return false;
            }


            const layer = obj.layer || new Konva.Layer().moveTo(obj.stage);
            const stage = obj.stage || layer.getStage();
            const home = obj.home || { x: stage.width() / 2, y: stage.height() - 60 };


            let isArmed = true;
            let ballsArray = [];
            let trailBallsArray = [];


            let settings = $.extend({
                ballRadius: 10,
                ballFill: "blue",
                flashOnShoot: true,
                targets: [],
                useShootTrail: false,
                ballSpeed: 600,
                spawnOnInsantiation: true,
                shootSound: null,
                doUseTrailBalls: true,
                trailBallDuration: 0.8,
                checkAnswer: function(ball, target) {
                    blastCircle({
                        layer: layer,
                        radius: stage.height() / 4,
                        duration: 2,
                        blastInterval: 100,
                        strokeWidth: 4,
                        opacity: 1,
                        x: ball.x(),
                        y: ball.y(),
                        stroke: "red"
                    });
                    shakeStage({
                        stage: stage
                    });
                },
                onShoot: function() {
                    // log("Shooting");
                },
                onSpawn: function() {
                    // log("Spawning ball");
                },
                onOffStage: function() {
                    // log("Off stage");
                },
            }, obj);


            const sounds = new SoundEffects({
                container: $("#sounds-stuff"),
                playThisOnCheckboxCheck: "tickSound",
                sounds: {
                    shoot: settings.shootSound
                }
            });


            const ring = new Konva.Circle({
                x: home.x,
                y: home.y,
                fill: "transparent",
                stroke: "#eee",
                radius: 60,
            }).cache();
            ring.flash = function() {
                ring.opacity(0).to({ duration: 0.2, opacity: 1 });
            };
            layer.add(ring).draw();


            function changeSettings(obj) {
                for (const key in obj) {
                    settings[key] = obj[key];
                }
            }


            const ballMaster = new Konva.Circle({
                x: home.x,
                y: home.y,
                radius: settings.ballRadius,
                // fill: settings.ballFill,
                fillRadialGradientStartPoint: { x: -settings.ballRadius / 4, y: -settings.ballRadius / 4 },
                fillRadialGradientStartRadius: 0,
                fillRadialGradientEndPoint: { x: 0, y: 0 },
                fillRadialGradientEndRadius: settings.ballRadius,
                fillRadialGradientColorStops: [0, "#eee", 1, "#444"],
                draggable: true,
                hitFunc: function(context) {
                    context.beginPath();
                    context.arc(0, 0, ring.radius(), 0, Math.PI * 2, true);
                    context.closePath();
                    context.fillStrokeShape(this);
                },
            });


            function newBall() {
                if (!isArmed) { return; }
                settings.onSpawn();
                const ball = ballMaster.clone().moveTo(layer); // NOT CACHING here because it messes with the hitFunc
                ballsArray.push(ball);
                ball.scaleX(0.01).scaleY(0.01).on("dragmove", ballDragHandler).on("dragend", function() {
                    springBack(ball);
                });
                ball.to({ duration: 0.2, scaleX: 1, scaleY: 1 });
            }
            settings.spawnOnInsantiation && newBall();


            function springBack(ball) {
                ball.to({ duration: 0.2, x: home.x, y: home.y, easing: Konva.Easings.EaseIn });
            }


            function ballDragHandler(e) {
                const ball = e.target;
                const distanceFromCenter = Math.sqrt(Math.pow(home.x - ball.x(), 2) + Math.pow(home.y - ball.y(), 2));
                if (distanceFromCenter > ring.radius()) {
                    shootBall(ball);
                }
            }


            function shootBall(ball) {
                isArmed && setTimeout(newBall, 600);
                settings.onShoot();
                settings.shootSound && sounds.play("shoot");
                ring.flash();
                ball.cache(); // caching here 'cause caching messes with the hitFunc, and now we don't need that
                ball.off("dragend dragmove").draggable(false);
                ball.vector = {
                    x: home.x - ball.x(),
                    y: home.y - ball.y(),
                };
                ball.anim = new Konva.Animation(function(frame) {


                    const newX = ball.x() + (ball.vector.x / ring.radius()) * (settings.ballSpeed / 1000 * frame.timeDiff);
                    const newY = ball.y() + (ball.vector.y / ring.radius()) * (settings.ballSpeed / 1000 * frame.timeDiff);
                    ball.x(newX).y(newY);


                    settings.doUseTrailBalls && trailBall(ball);


                    // checking for target hit
                    settings.targets.forEach(function(target) {
                        if (shapesOverlap(ball.getClientRect(), target.getClientRect())) {
                            ball.anim.stop();
                            settings.checkAnswer(ball, target);
                            ball.destroy();
                        }
                    });


                    // checking for offstage
                    if (isOffStage(ball)) {
                        ball.anim.stop();
                        ball.destroy();
                        settings.onOffStage();
                    }
                }, layer).start();
            }


            function trailBall(ball) {
                if (!settings.useShootTrail) { return; }
                const tBall = ballMaster.clone();
                trailBallsArray.push(tBall);
                tBall.moveTo(layer).fill("#eee").x(ball.x()).y(ball.y()).radius(ball.radius() / 2).opacity(ball.opacity() / 2).to({
                    radius: 0,
                    duration: settings.trailBallDuration,
                    opacity: 0.2,
                    onFinish: function() {
                        tBall.destroy();
                    }
                });
                tBall.moveToBottom();
            }


            function shapesOverlap(r1, r2) {
                return !(
                    r2.x > r1.x + r1.width ||
                    r2.x + r2.width < r1.x ||
                    r2.y > r1.y + r1.height ||
                    r2.y + r2.height < r1.y
                );
            }


            function isOffStage(ball) {
                const r = ball.radius();
                return ball.x() < -r ||
                    ball.x() > stage.width() + r ||
                    ball.y() < -r ||
                    ball.y() > stage.height() + r;
            }


            function armedState(value) {
                if (value === null) { return armedState; }
                isArmed = value;
                return this;
            }


            function arm() {
                armedState(true);
                newBall();
                return this;
            }


            function disarm() {
                armedState(false);
                return this;
            }


            function clearAll() {
                ballsArray.forEach(function(ball) {
                    if (!ball) { return; }
                    ball.anim && ball.anim.stop();
                    ball.destroy();
                });
                layer.draw();
                ballsArray.length = 0;
                disarm();
                return this;
            }


            return {
                newBall,
                changeSettings,
                arm,
                disarm,
                clearAll,
                armedState
            };
        };
    });