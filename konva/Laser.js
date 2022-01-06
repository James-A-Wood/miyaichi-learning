define(
        [
            "jquery",
            "tools",
            "Konva"
        ],
    function($, tools, Konva) {

        // returns a Laser class, to be used with the "new" keyword
        return Laser;

        function Laser(inputs) {

            const log = console.log;

            const that = this;
            that.enabled = true;

            // scrubbing arguments
            if (!inputs || typeof inputs !== "object" || !(inputs.layer || inputs.stage)) {
                console.log("Laser requires an object with properties layer and stage!");
                return;
            }

            // setting defaults
            let defaults = $.extend({
                crosshairs: null, // REQUIRED
                stage: null, // REQUIRED
                layer: null, // REQUIRED
                bulletRadius: 40,
                fireSound: "",
                bulletOffset: 10,
                flyTime: 500,
                bulletInnerColor: "white",
                bulletOuterColor: "red",
                bulletSolidColor: null, // or using a solid color, if specified,
                paralax: 0.2,
                onFinish: function() {
                    // checking for hit, etc.
                },
                onFire: function() {
                    // stuff to do when fired, e.g., the laser sound
                }
            }, inputs);

            const bulletHomeX = defaults.stage.width() / 2;
            const bulletHomeY = defaults.stage.height() + defaults.bulletRadius;
            let crosshairs = defaults.crosshairs;

            // creating a bullet PROTOTYPE to be cloned when laser is fired
            const bulletPrototype = new Konva.Circle({
                listening: false,
                radius: defaults.bulletRadius,
                x: bulletHomeX,
                y: bulletHomeY,
                fill: defaults.bulletSolidColor ? defaults.bulletSolidColor : null,
                fillRadialGradientEndRadius: defaults.bulletSolidColor ? null : defaults.bulletRadius,
                fillRadialGradientColorStops: defaults.bulletSolidColor ? null : [0, defaults.bulletInnerColor, 1, defaults.bulletOuterColor],
                opacity: 0
            });
            defaults.layer.add(bulletPrototype);
            bulletPrototype.cache().listening(false);


            function fire(event) {

                // doing nothing if the gun is not enabled
                if (!that.enabled) { return false; }

                // necessary to keep events from firing twice on mobile (touchstart & click events)
                if (tools.isMobile() && event && event.type === "click") { return; }

                // calling the on-fire callback, if present
                defaults.onFire();

                // creating & adding the bullet circle
                const bullet = bulletPrototype.clone().moveTo(defaults.layer);
                bullet.setAttrs({
                    opacity: 1,
                    x: (defaults.stage).width() / 2,
                    y: (defaults.stage).height() + defaults.bulletRadius,
                    listening: false
                });
                bullet.cache();

                // saving the destination coordinates
                const endX = crosshairs.x();
                const endY = crosshairs.y();

                const diffX = endX - bulletHomeX;
                const diffY = endY - bulletHomeY;
                const easer = tools.easer(2, defaults.flyTime, "easeOut");
                const anim = new Konva.Animation(function(frame) {

                    const easePosition = easer(frame.time);
                    let newX = bulletHomeX + easePosition * diffX;
                    let newY = bulletHomeY + easePosition * diffY;
                    const crosshairsOffsetX = (crosshairs.x() - endX) * (defaults.paralax);
                    const crosshairsOffsetY = (crosshairs.y() - endY) * (defaults.paralax);

                    newX -= crosshairsOffsetX;
                    newY -= crosshairsOffsetY;

                    // adjusting the bullet properties each frame
                    bullet.setAttrs({
                        x: newX,
                        y: newY,
                        scaleX: 1 - easePosition,
                        scaleY: 1 - easePosition
                    });

                    // callback!
                    if (frame.time > defaults.flyTime) {
                        bullet.destroy();
                        anim.stop();
                        defaults.onFinish(bullet.x(), bullet.y());
                    }
                }, defaults.layer).start();
            }


            function setCrosshairs(newCrosshairs) {
                crosshairs = newCrosshairs;
            }


            this.fire = fire;
            this.setCrosshairs = setCrosshairs;
        }
    });