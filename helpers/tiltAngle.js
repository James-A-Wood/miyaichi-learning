

/*
 *
 *
 *
 *          getting the 
 *          
 *  
 *  
 *  
 */


define(
        [
            "jquery"
        ],
        function ($) {


            return function (settings) {


                // exiting if we're not on mobile...
                if (!window.DeviceOrientationEvent) {
                    return false;
                }


                settings = $.extend({
                    minTilt: 5,
                    maxTilt: 15
                }, settings || {});


                var currentTilt = {
                    x: 0,
                    y: 0,
                    angle: 0
                };

                window.addEventListener("deviceorientation", function (event) {
                    currentTilt.x = event.gamma;
                    currentTilt.y = event.beta;
                }, true);

                function getCurrent() {
                    return currentTilt;
                }

                return {
                    getCurrent: getCurrent
                };
            };
        }
);



