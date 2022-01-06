

define(
        [
            "Konva",
            "tools"
        ],
        function (Konva, tools) {


            // holds all the anims for each star so they can be accessed later
            var anims = [];
            var starsArray = [];


            // returns a StarsBackground class (to be used with the "new" keyword")
            return StarsBackground;
            function StarsBackground(defaults) {


                // checking the parameters
                if (!defaults || typeof defaults !== "object" || !defaults.stage || !defaults.layer || !defaults.numberStars || !defaults.starFlyTime) {
                    console.log("starsBackground got bad parameters!");
                    return false;
                }


                // adding an offset, so stars fly at different speeds
                defaults.stagger = defaults.stagger || defaults.starFlyTime / 2;
                var paralaxFactor = defaults.paralaxFactor || 0.2;

                var stage = defaults.stage;
                var stageWidth = stage.width();
                var stageHeight = stage.height();
                var stageCenterX = stageWidth / 2;
                var stageCenterY = stageHeight / 2;
                var timePaused = 0;
                var that = this;


                // generating the specified number of stars, each at a random angle
                for (var i = 0; i < defaults.numberStars; i++) {


                    // e.g., between 3 and -3, or 5 and -5
                    var flyOffset = defaults.stagger - (Math.random() * defaults.stagger * 2);


                    // a little longer or shorter than the default starFlyTime
                    var duration = defaults.starFlyTime + flyOffset;


                    // starting off in the middle of the flight
                    var randomStartPosition = Math.random() * duration;


                    // creating the new Star
                    var star = new Star(duration, randomStartPosition);
                    starsArray.push(star);
                }


                // function to create a single new star
                function Star(duration, position) {


                    var firstAnimation = true;
                    var star = new Konva.Circle({
                        x: stageCenterX,
                        y: stageCenterY,
                        radius: 3,
                        fill: tools.pickOneFrom(["white", "yellow"]),
                        opacity: 0,
                        listening: false,
                        scaleX: 0.1,
                        scaleY: 0.1
                    }).moveTo(defaults.layer).cache();


                    // choosing a random direction
                    var starDirection = Math.random() * 360;
                    var endX = Math.floor(stageCenterX + (stageCenterX + (stageWidth * paralaxFactor)) * Math.sin(starDirection));
                    var endY = Math.floor(stageCenterY + (stageCenterY + stageHeight * paralaxFactor) * Math.cos(starDirection));


                    // animating the star
                    var anim = new Konva.Animation(function (frame) {


                        if (that.turnedOff && frame.time > 1000) {
                            return false;
                        }


                        // setting the position of the star in instantiation
                        if (firstAnimation) {
                            frame.time = position;
                            firstAnimation = false;
                        }


                        // keeping track of how much time has passed while paused
                        if (that.isPaused) {
                            timePaused += frame.timeDiff;
                            return false;
                        } else {
                            frame.time -= timePaused; // changing the actual "frame" object
                            timePaused = 0;
                        }


                        var amountOfEasing = easingCalculator((frame.time % duration), duration);


                        // calculating the pointer offset based on the crosshairs position, 
                        // so the stars move right (slightly) when the crosshairs move left
                        var pointerOffset = {
                            x: (defaults.crosshairs.x() - stageCenterX) * paralaxFactor,
                            y: (defaults.crosshairs.y() - stageCenterY) * paralaxFactor
                        };


                        // calculating newX and newY
                        var newX = stageCenterX + ((stageCenterX - endX) * amountOfEasing) - pointerOffset.x;
                        var newY = stageCenterY + ((stageCenterY - endY) * amountOfEasing) - pointerOffset.y;


                        // setting the star properties, based on the amountOfEasing
                        star.scaleX(amountOfEasing);
                        star.scaleY(amountOfEasing);
                        star.opacity(amountOfEasing * 2); // "*2" to fade in stars faster (technically to opacity of 2)
                        star.x(newX);
                        star.y(newY);


                        // resetting the star if it's off-stage
                        if (star.x() > stage.width() || star.x() < 0 || stage.y() < 0 || star.y() > stageHeight) {
                            frame.time = 0;
                        }
                    }, defaults.layer).start();


                    // keeping track of the anims so we can pause them later
                    anims.push(anim);


                    return star;
                }


                // instance properties & methods
                this.turnedOff = false;
                this.isPaused = false;

                this.allStarMovements = function () {
                    return anims;
                };

                this.togglePause = function () {
                    this.isPaused = !this.isPaused;
                };

                this.removeAllStars = function () {
                    anims.forEach(function (anim) {
                        anim.stop();
                    });
                    starsArray.forEach(function (thisStar) {
                        defaults.layer.remove(thisStar);
                    });
                    anims.length = 0;
                    starsArray.length = 0;
                };
            }


            function easingCalculator(t, d) {

                var power = 5;
                var easing = Math.pow((t / d), power);
                return easing;

                // easeOut:
                // return 1 - Math.pow(1 - (t / d), power); 
            }
        }
);