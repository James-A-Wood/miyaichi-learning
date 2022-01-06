define(
        [
            "jquery",
            "Konva",
            "konva/blastCircle",
            "tools",
        ],
    function($, Konva, blastCircle, tools) {


        let deviceTilt = null;


        // adding device tilt detector
        tools.activateTiltDetection({
            onSuccess: function() {
                deviceTilt = new tools.DeviceTiltDetector();
                window.addEventListener("deviceorientation", deviceTilt); // removed: , true
            },
            onFail: function() {
                //
            },
        });


        return function(params) {

            params = $.extend({
                radius: 20,
                turretFill: "yellow",
                bulletsPerSecond: 3,
                base: { fillRadialGradientColorStops: [0, "#fff", 1, "#77f"] },
                turret: {
                    fillLinearGradientColorStops: [
                        0, "#44f",
                        0.3, "#fff",
                        1, "#44f"
                    ]
                }
            }, params || {});

            const layer = params.layer;
            const stage = layer.getStage();
            const actionArea = params.actionArea;
            const touchRect = params.touchRect;
            const pauser = params.pauser;
            const bulletFactory = params.bulletFactory;
            const isMobile = params.isMobile;
            const baseRadius = params.radius;
            let baseHasMoved = false;
            let baseIsActive = true;
            let stageCenterX = stage.width() / 2;
            const sounds = params.sounds;

            let startY = actionArea.height() - baseRadius;
            let startX = actionArea.width() / 2 - baseRadius;


            /*
             *
             *      whether to move by mouse or keyboard
             *
             *      NOTE the checkbox is not shown on mobile
             *
             *
             */
            const moveMethod = (function() {

                let method = localStorage.invaders_move_method ? localStorage.invaders_move_method : "mouse";
                $(`input[name='move-method'][value='${method}']`).prop({ checked: true });

                setCursorMode(method);

                $("input[name='move-method']").on("change", function() {
                    method = $(this).val();
                    setCursorMode(method);
                    localStorage.invaders_move_method = method;
                    (method === "keyboard") && howToUseMessage.activate();
                    $(this).blur(); // NOTE have to do this so arrow keys won't switch values (on IE)
                });

                return function() {
                    return method;
                };
            }());


            function setCursorMode(method) {
                $("#invaders_main").toggleClass("move-by-mouse", !!(method === "keyboard"));
            }


            const getMousePosition = (function() {

                let mousePosX = stage.width() / 2; // default == middle
                const previousX = mousePosX;

                $(document).on("mousemove", function(e) {
                    try {
                        if (stage.getPointerPosition()) { // cause pos might be null
                            mousePosX = stage.getPointerPosition().x;
                            previouxX = mousePosX;
                        }
                    } catch (e) {
                        return previousX;
                    }
                });

                return function() {
                    return mousePosX;
                };
            }());


            const baseGroup = new Konva.Group({
                width: baseRadius * 2,
                height: baseRadius
            });


            const base = new Konva.Wedge({
                x: baseRadius,
                y: baseRadius,
                radius: baseRadius,
                angle: 180,
                fillRadialGradientStartPoint: { x: 7, y: 10 },
                fillRadialGradientStartRadius: 0,
                fillRadialGradientEndPoint: 0,
                fillRadialGradientEndRadius: baseRadius,
                fillRadialGradientColorStops: params.base.fillRadialGradientColorStops,
                rotation: 180
            });


            const turret = new Konva.Rect({
                width: 6,
                height: 10,
                fillLinearGradientStartPoint: { x: 0, y: 0 },
                fillLinearGradientEndPoint: { x: 6, y: 0 },
                fillLinearGradientColorStops: params.turret.fillLinearGradientColorStops,
                y: -10,
                x: baseRadius,
                offsetX: 3
            });


            layer.add(baseGroup).draw();
            base.cache();
            turret.cache();
            baseGroup.active = true;
            baseGroup.x(startX).y(startY);


            function direction() {

                /*
                 *
                 *      LEFT arrow pressed === -1
                 *      RIGHT arrow pressed === 1
                 *      NEITHER or BOTH === 0
                 *
                 */

                const left = tools.keyIsPressed(37);
                const right = tools.keyIsPressed(39);

                // returning 0 if neither key is pressed, or if both are
                if ((left && right) || (!left && !right)) { return 0; }

                return left ? -1 : 1;
            }


            const fire = (function() {

                let fireInterval;
                let isFiring = false;

                function startShooting() {
                    if (isFiring) { return false; }
                    clearInterval(fireInterval);
                    fireInterval = setInterval(fire, (1000 / params.bulletsPerSecond));
                    isFiring = true;
                    fire();
                }

                function stopShooting() {
                    clearInterval(fireInterval);
                    isFiring = false;
                }

                function fire() {
                    if (!isFiring || !baseIsActive || pauser.isPaused()) { return; }
                    bulletFactory.newBullet(baseGroup.x() + baseRadius, baseGroup.y());
                    let turretOldY = -10;
                    turret.y(turretOldY / 2).moveToBottom();
                    turret.to({ duration: 0.1, y: turretOldY });
                    // baseGroup.clip.decrement();
                }

                return { startShooting, stopShooting };
            }());


            // mousedown (or touchstart) start shooting; mouse up stops it
            touchRect.on("mousedown touchstart", fire.startShooting);
            $(document).on("mouseup touchend", fire.stopShooting); // NEW TEST changed to $(document) from touchRect


            // shoot on spacebar and up arrow key
            tools.keydown([32, 38], function() {
                !pauser.isPaused() & fire.startShooting();
            });


            tools.keyup([32, 38], function(e) {
                const code = e.which || e.keyCode;
                if (code === 32 || code === 38) {
                    e.preventDefault();
                    fire.stopShooting();
                }
            })


            const anim = new Konva.Animation(moveBase, layer);
            anim.start();


            const howToUseMessage = (function() {

                let label = null;
                let labelRemoved = false;

                function activate() {
                    !label && setTimeout(function() {
                        if (baseHasMoved || isMobile || moveMethod() === "mouse") { return; }
                        label = new Konva.Label({
                            x: baseGroup.width() * 0.75,
                            y: -20,
                            opacity: 0
                        });
                        label.add(new Konva.Tag({
                            fill: "darkorange",
                            pointerDirection: "down",
                            pointerWidth: 10,
                            pointerHeight: 10,
                            lineJoin: "round",
                            stroke: "white",
                            strokeWidth: 1,
                            cornerRadius: 3
                        }));
                        label.add(new Konva.Text({
                            text: "アロー・キーで\n動かしてください！\n\n←　　　→",
                            fontFamily: "Meiryo",
                            fontSize: 12,
                            padding: 10,
                            align: "center",
                            fill: "white"
                        }));
                        baseGroup.add(label);
                        label.to({ duration: 1, opacity: 0.75 });
                    }, 8000);
                }

                activate();

                function remove() {
                    if (isMobile || labelRemoved) { return; }
                    label && label.to({
                        duration: 0.4,
                        opacity: 0,
                        onFinish: function() {
                            labelRemoved = true;
                            label.destroy();
                        }
                    });
                }

                return { remove, activate };
            }());


            function moveBase(frame) {

                if (!isMobile && moveMethod() === "keyboard" && direction() === 0) { return false; }
                if (pauser.isPaused() || !baseGroup.active) { return false; }
                if (!baseIsActive) { return false; }

                baseHasMoved = true;
                howToUseMessage.remove();

                // moving by tilt, on mobile...
                if (window.hasOwnProperty(deviceTilt)) { return; }

                let newX = null;

                if (deviceTilt && deviceTilt.x) {
                    const fullX = stageCenterX + (deviceTilt.x * (stageCenterX / deviceTilt.maxTilt));
                    newX = baseGroup.x() + (fullX - baseGroup.x()) * 0.1; // klugey, but works!

                    //... or by mouse, if set...
                } else if (moveMethod() === "mouse") {
                    const mouseX = getMousePosition();
                    const diff = (mouseX - baseGroup.x() - baseGroup.width() / 2) * 0.1;
                    newX = baseGroup.x() + diff;

                    // ... or moving by arrow key, on desktop
                } else {
                    const velocity = stageCenterX;
                    const amount = (frame.timeDiff / 1000) * velocity * direction();
                    newX = baseGroup.x() + amount;
                }

                newX = Math.max(baseGroup.offsetX(), newX);
                newX = Math.min(stage.width() - baseGroup.width(), newX);

                baseGroup.x(newX);
            }


            //                baseGroup.clip = (function () {
            //
            //
            //                    var fullClip = 20;
            //                    var bulletsRemaining = fullClip;
            //                    var bulletReplenishRate = 1000;
            //
            //
            //                    var clipText = new Konva.Text({
            //                        x: baseRadius,
            //                        y: baseRadius * (2 / 3),
            //                        fill: "blue",
            //                        fontSize: 10,
            //                        text: fullClip
            //                    });
            //                    clipText.offsetX(clipText.width() / 2).offsetY(clipText.height() / 2);
            //
            //
            //                    baseGroup.clipText = clipText;
            //
            //
            //                    setInterval(function () {
            //                        if (!pauser.isPaused()) {
            //                            bulletsRemaining += 1;
            //                            bulletsRemaining = Math.min(bulletsRemaining, fullClip);
            //                            setClipText();
            //                        }
            //                    }, bulletReplenishRate);
            //
            //
            //                    function decrement() {
            //                        bulletsRemaining -= 1;
            //                        bulletsRemaining = Math.max(0, bulletsRemaining);
            //                        setClipText(bulletsRemaining);
            //                    }
            //
            //
            //                    function setClipText() {
            //                        clipText.clearCache();
            //                        clipText.text("" + bulletsRemaining); // adding "" to make it text, so 0 does not evaluate to null
            //                        clipText.offsetX(clipText.width() / 2);
            //                        clipText.cache();
            //                    }
            //
            //
            //                    return {
            //                        decrement: decrement,
            //                        getRemaining: function () {
            //                            return bulletsRemaining;
            //                        }
            //                    };
            //                }());


            baseGroup.add(base, turret); //, baseGroup.clipText

            baseGroup.fire = fire;

            baseGroup.isHittable = true;

            baseGroup.width = function() {
                return baseRadius;
            };

            baseGroup.height = function() {
                return baseRadius;
            };

            baseGroup.centerX = function() {
                return baseGroup.x() + baseRadius;
            };

            baseGroup.centerY = function() {
                return baseGroup.y() + baseRadius;
            };

            baseGroup.isHit = function(bullet) {

                if (!baseIsActive || !baseGroup.isHittable) { return false; }

                // returning false if the bullet is OUTSIDE the base
                if (bullet.x() < baseGroup.x() ||
                    bullet.x() > baseGroup.x() + (baseRadius * 2) ||
                    bullet.y() < baseGroup.y() ||
                    bullet.y() > baseGroup.y() + (baseRadius * 2)) {
                    return false;
                }

                return true;
            };

            function wasHit() {
                baseIsActive = false;
                baseGroup.to({
                    duration: 0.3,
                    opacity: 0,
                    onFinish: function() {
                        baseGroup.y(stage.height());
                    }
                });
                sounds && sounds.play("base_hit");
                blastCircle({
                    layer: layer,
                    x: baseGroup.x() + params.radius,
                    y: baseGroup.y() + params.radius / 2,
                    stroke: "transparent",
                    fill: "rgba(255, 255, 255, 0.5)",
                    radius: 60,
                    numCircles: 4,
                    blastInterval: 100
                });

                setTimeout(spawn, 2000);
            }

            function spawn() {
                baseGroup.x(startX);
                baseGroup.to({
                    duration: 1,
                    opacity: 1,
                    y: startY,
                    easing: Konva.Easings.EaseOut,
                    onFinish: function() {
                        baseIsActive = true;
                    }
                });
            }

            baseGroup.wasHit = wasHit;
            baseGroup.spawn = spawn;


            // returns the CENTER of the base, so, like we can aim bullets at the center
            baseGroup.center = function() {
                return {
                    x: baseGroup.x() + baseRadius,
                    y: baseGroup.y() + baseRadius
                };
            };


            return baseGroup;
        };
    }
);