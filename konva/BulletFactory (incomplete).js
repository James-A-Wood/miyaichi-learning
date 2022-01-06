


define(
        [
            "jquery",
            "Konva"
        ],
        function ($, Konva) {


            return function (settings) {


                if (!settings || typeof settings !== "object" || !settings.layer) {
                    console.log("Bad parameters! Need an object with 'layer' property!");
                    return false;
                }


                settings = $.extend({
                    pauseBeforeFire: 0,
                    target: null,
                    aimOffsetX: 0,
                    aimOffsetY: 0,
                    sounds: null,
                    pauser: null,
                    bulletPrototype: null,
                    mp3Name: null,
                    bulletSpeed: 100, // pixels per second
                    checkForHit: function() {
                        //
                    }
                }, settings);


                var layer = settings.layer;
                var pauser = settings.pauser;
                var bulletsArray = [];
                var bulletPrototype = settings.bulletPrototype || new Konva.Circle({
                    fillRadialGradientStartPoint: 0,
                    fillRadialGradientStartRadius: 0,
                    fillRadialGradientEndPoint: 0,
                    fillRadialGradientEndRadius: 5,
                    fillRadialGradientColorStops: [0, "white", 0.3, "white", 1, "orange"],
                    radius: 4
                });


                function shoot(p) {


                    p = p || {};


                    // using the defaults for BulletFactory, else overriding with 
                    // ones passed in for this bullet
                    var shooter = p.shooter || settings.shooter;
                    var target = p.target || settings.target;
                    var sounds = p.sounds || settings.sounds;
                    var mp3Name = p.mp3Name || settings.mp3Name;
                    var pauseBeforeFire = p.pauseBeforeFire || settings.pauseBeforeFire;
                    var bulletSpeed = p.bulletSpeed || settings.bulletSpeed;
                    var bullet = bulletPrototype.clone({
                        x: shooter.x(),
                        y: shooter.y()
                    });


                    if (!shooter || !target) {
                        console.log("Need shooter and target!");
                        return false;
                    }


                    setTimeout(function () {


                        bullet.moveTo(layer).cache();
                        bulletsArray.push(bullet);
                        sounds && sounds.play(mp3Name);


                        // using animation, not tween, so we can check for hit on each frame
                        var targetX = target.x() + settings.aimOffsetX;
                        var targetY = target.y() + settings.aimOffsetY;
                        var angleRadians = Math.atan2(targetX - bullet.x(), targetY - bullet.y());


                        // adding the animation as a PROPERTY of the bullet!
                        bullet.anim = new Konva.Animation(moveBullet, layer);
                        bullet.anim.start();
                        function moveBullet(frame) {


                            if (pauser && pauser.isPaused()) {
                                console.log("Bulet paused...");
                                return false;
                            }


                            if (!bullet) {
                                console.log("Bullet stopped 'cause it doesn't exist!");
                                bullet.anim && bullet.anim.stop();
                                return;
                            }


                            // calculating and assigning the new X & Y
                            var newX = bullet.x() + (frame.timeDiff / 1000) * bulletSpeed * Math.sin(angleRadians);
                            var newY = bullet.y() + (frame.timeDiff / 1000) * bulletSpeed * Math.cos(angleRadians);
                            bullet.x(newX).y(newY);
                            
                            
                            if (settings.checkForHit()) {
                                
                            }


                            if (target.isHit && target.isHit(bullet)) {
                                bullet.remove();
                                target.wasHit && target.wasHit();
                                bullet.anim.stop();
                                console.log("Target hit!");
                                return;
                            }


                            if (isOffStage(bullet)) {
                                bullet.remove();
                                bullet.anim && bullet.anim.stop();
                                console.log("Bullet removed");
                            }
                        }
                    }, pauseBeforeFire);


                    return bullet;
                }


                function removeAllBullets() {
                    bulletsArray.forEach(function (thisBullet) {
                        if (thisBullet) {
                            thisBullet.anim && thisBullet.anim.stop();
                            thisBullet.destroy();
                        }
                    });
                }


                // private
                function isOffStage(bullet) {
                    var stage = bullet.getStage();
                    if (bullet.x() < 0
                            || bullet.y() < 0
                            || bullet.x() > stage.width()
                            || bullet.y() > stage.height()) {
                        return true;
                    }
                    return false;
                }


                this.shoot = shoot;
                this.removeAllBullets = removeAllBullets;
            };
        }
);