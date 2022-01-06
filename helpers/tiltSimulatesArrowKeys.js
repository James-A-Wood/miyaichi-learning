/*
 *
 *
 *
 *          Simulating arrow key presses according to
 *
 *          device orientation on mobile devices!
 *
 *
 *
 */


define(
        [
            "jquery"
        ],
    function($) {



        return function(inputs) {

            if (!window.DeviceOrientationEvent) { return false; }

            let defaults = $.extend({
                sensitivity: 5,
                mode: "on"
            }, inputs || {});

            // keycodes to simulate, depending on phone orientation
            const orientation = {
                "0": { // portrait mode
                    up: 40,
                    down: 38,
                    right: 39,
                    left: 37
                },
                "180": { // NEW TEST added this, but does it change anything?
                    up: 38,
                    down: 40,
                    right: 37,
                    left: 39
                },
                "-90": { // landscape, phone top at 3:00
                    up: 37,
                    down: 39,
                    right: 40,
                    left: 38
                },
                "90": { // landscape, phone top at 9:00
                    up: 39,
                    down: 37,
                    right: 38,
                    left: 40
                }
            };


            DeviceMotionEvent.requestPermission().then(function(response) {

                if (response !== "granted") { return false; }

                window.addEventListener("deviceorientation", function(event) {

                    // up or down (vertical events)
                    if (event.beta > defaults.sensitivity) { // pointing up
                        simulateKeyPress("keydown", "up");
                    } else if (event.beta < -defaults.sensitivity) { // pointing down
                        simulateKeyPress("keydown", "down");
                    } else { // neither up nor down
                        simulateKeyPress("keyup", "up");
                        simulateKeyPress("keyup", "down");
                    }

                    // right or left (horizontal events)
                    if (event.gamma > defaults.sensitivity) { // pointing right
                        simulateKeyPress("keydown", "right");
                    } else if (event.gamma < -defaults.sensitivity) { // pointing left
                        simulateKeyPress("keydown", "left");
                    } else { // neither right nor left
                        simulateKeyPress("keyup", "right");
                        simulateKeyPress("keyup", "left");
                    }
                }, true);
            }).catch(function() {
                console.error();
            });

            function simulateKeyPress(keyUpOrDown, upDownLeftRight) {
                let event = $.Event(keyUpOrDown);
                event.which = orientation[window.orientation][upDownLeftRight];
                $(window).trigger(event);
            }
        };

    }
);