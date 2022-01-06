define(
        [
            "jquery",
            "Konva",
            "konva/blastCircle"
        ],
    function($, Konva, blastCircle) {


        let numShotsToFire = 0;


        return function(p) {


            if (!p || typeof p !== "object" || !p.layer) {
                console.log("ufo.js got some bad parameters!");
                return false;
            }


            p = $.extend({
                text: "",
                fontSize: 12,
                textFill: "navy",
                textAlign: "center",
                bodyPaddingTopBottom: 10,
                bodyPaddingLeftRight: window.innerWidth < 450 ? 5 : 15,
                bodyStroke: "white",
                ufoBodyColor: "red",
                ufoBodyGradient: false,
                bodyCornerRadius: 500,
                msBetweenBullets: 500,
                bulletSpeed: 250,
                bulletTarget: null, // set to base
                textMinWidth: 45
            }, p);


            const pauser = p.pauser;
            const layer = p.layer;
            const sounds = p.sounds;


            const ufoGroup = new Konva.Group();
            ufoGroup.text = p.text;
            ufoGroup.isArmed = true;


            const word = new Konva.Text({
                text: p.text,
                fontSize: p.fontSize,
                fill: p.textFill,
                align: p.textAlign
            });


            // ensuring minimum word width
            if (word.width() < p.textMinWidth) {
                word.width(p.textMinWidth);
            }


            const bulletPrototype = new Konva.Circle({
                fillRadialGradientStartPoint: 0,
                fillRadialGradientStartRadius: 0,
                fillRadialGradientEndPoint: 0,
                fillRadialGradientEndRadius: 5,
                fillRadialGradientColorStops: [0, "white", 0.3, "white", 1, "orange"],
                radius: 4
            });


            const ufoBody = new Konva.Rect({
                height: word.height() + p.bodyPaddingTopBottom,
                width: word.width() + (p.bodyPaddingLeftRight * 2),
                cornerRadius: p.bodyCornerRadius,
                stroke: p.bodyStroke,
                strokeWidth: 1,
                shadowColor: "black",
                shadowBlur: 2,
                shadowOffset: { x: 0, y: 0 }
            });


            if (p.ufoBodyGradient) {
                ufoBody.fillLinearGradientStartPointX(0)
                    .fillLinearGradientStartPointY(0)
                    .fillLinearGradientEndPointX(0)
                    .fillLinearGradientEndPointY(ufoBody.height())
                    .fillLinearGradientColorStops([
                                0, p.ufoBodyColor,
                                0.2, p.ufoBodyColor,
                                0.5, "white",
                                0.8, p.ufoBodyColor,
                                1, p.ufoBodyColor
                            ]);
            } else {
                ufoBody.fill(p.ufoBodyColor);
            }



            ufoGroup.width(ufoBody.width())
                .height(ufoBody.height())
                .offset({
                    x: ufoBody.width() / 2,
                    y: ufoBody.height() / 2
                });


            const capsule = new Konva.Wedge({
                x: ufoGroup.width() / 2,
                y: 0,
                fillLinearGradientStartPoint: { x: 0, y: 0 },
                fillLinearGradientEndPoint: { x: 5, y: 5 },
                fillLinearGradientColorStops: [0, p.ufoBodyColor, 1, "white"],
                angle: 180,
                rotation: 180,
                radius: 10,
                stroke: p.bodyStroke,
                strokeWidth: 1
            });


            const leg1 = new Konva.Line({
                stroke: p.ufoBodyColor,
                strokeWidth: 2,
                lineCap: "round",
                points: [-5, 0, -10, 10],
                x: ufoGroup.width() / 2,
                y: ufoGroup.height() - 4
            });
            const leg2 = leg1.clone().scaleX(-1);


            ufoGroup.add(leg1, leg2, capsule, ufoBody, word);


            word.offset({ x: word.width() / 2, y: word.height() / 2 })
                .x(ufoBody.width() / 2)
                .y(ufoBody.height() / 2);


            ufoGroup.cache();
            ufoGroup.bulletsArray = [];


            ufoGroup.removeBullets = function() {
                ufoGroup.bulletsArray.forEach(function(thisBullet) {
                    if (thisBullet) {
                        thisBullet.anim && thisBullet.anim.stop();
                        thisBullet.destroy && thisBullet.destroy();
                    }
                });
            };


            ufoGroup.ufoFire = (function() {

                let fireInterval = null;
                let isFiring = false;

                return function() {

                    if (isFiring) { return false; }
                    isFiring = true;

                    let ufo = ufoGroup;
                    let target = p.bulletTarget;
                    let counter = 0;
                    numShotsToFire++;

                    // shortening time between bullets with each increase, but no shorter than 200ms
                    p.msBetweenBullets *= 0.8;
                    p.msBetweenBullets = Math.max(p.msBetweenBullets, 200);

                    // NEW TEST also increasing speed slightly
                    p.bulletSpeed *= 1.2;
                    p.bulletSpeed = Math.min(p.bulletSpeed, 400);

                    fireInterval = setInterval(function() {

                        if (!ufoGroup || !ufoGroup.isArmed) { return false; }

                        if (!target.isHittable || ++counter > numShotsToFire) {
                            clearInterval(fireInterval);
                            isFiring = false;
                            return false;
                        }

                        let bullet = bulletPrototype.clone({ x: ufo.x(), y: ufo.y() }).cache().moveTo(layer).setZIndex(0);
                        ufoGroup.bulletsArray && ufoGroup.bulletsArray.push(bullet);
                        sounds && sounds.play("ufo_fire");

                        let angleRadians = (function() {
                            let diffX = target.center().x - bullet.x();
                            let diffY = target.center().y - bullet.y();
                            return Math.atan2(diffX, diffY); // Cool syntax!
                        }());

                        // using animation, not tween, so we can check for hit on each frame
                        bullet.anim = new Konva.Animation(moveBullet, layer);
                        bullet.anim.start();

                        function moveBullet(frame) {

                            if (pauser && pauser.isPaused()) { return false; }

                            if (!bullet) {
                                bullet.anim && bullet.anim.stop();
                                return;
                            }

                            // calculating and assigning the new X & Y
                            let newX = bullet.x() + (frame.timeDiff / 1000) * p.bulletSpeed * Math.sin(angleRadians);
                            let newY = bullet.y() + (frame.timeDiff / 1000) * p.bulletSpeed * Math.cos(angleRadians);
                            bullet.x(newX).y(newY);

                            if (target.isHit(bullet)) {
                                counter = numShotsToFire; // NEW TEST stopping the UFO from firing
                                bullet.remove();
                                target.wasHit();
                                bullet.anim && bullet.anim.stop();
                                return;
                            }

                            if (bullet && bullet.getStage() && bullet.y() > bullet.getStage().height()) {
                                bullet.remove();
                                bullet.anim && bullet.anim.stop();
                            }
                        }
                    }, p.msBetweenBullets);
                };
            }());


            ufoGroup.height = function() {
                return ufoBody.height() / 2;
            };


            ufoGroup.width = function() {
                return ufoBody.width();
            };

            ufoGroup.show = function(obj) {

                obj = $.extend({
                    delay: 100,
                    fadeIn: true,
                    opacity: 1,
                    sound: "shu"
                }, obj || {});

                if (!obj.fadeIn) {
                    ufoGroup.opacity(1);
                    return ufoGroup;
                }

                // BEYOND THIS POINT we're fading in the UFO, using blastCircles
                ufoGroup.opacity(0);
                setTimeout(function() {

                    let x = ufoGroup.x();
                    let y = ufoGroup.y();

                    blastCircle({
                        stroke: "rgba(255,165,0, 0.8)",
                        strokeWidth: 1,
                        fill: "rgba(255,165,0, 0.1)",
                        reverseMode: true,
                        x: x,
                        y: y,
                        layer: obj.layer,
                        radius: 50,
                        duration: 0.75,
                        easing: Konva.Easings.EaseOut,
                        callback: function() {

                            blastCircle({
                                layer: obj.layer,
                                x: x,
                                y: y,
                                stroke: "rgba(255,255,0, 0.8)",
                                fill: "rgba(255,255,0, 0.1)",
                                duration: 0.3,
                                radius: 50
                            });

                            sounds.play(obj.sound);
                            ufoGroup.isFlying = true;
                            ufoGroup.to({
                                duration: 0.3,
                                opacity: 1
                            });
                        }
                    });
                }, obj.delay);
            };


            ufoGroup.removeMe = function() {
                ufoGroup.isArmed = false;
                ufoGroup.removeBullets();
                ufoGroup && ufoGroup.destroy && ufoGroup.destroy();
            };


            return ufoGroup;
        };

    }
);