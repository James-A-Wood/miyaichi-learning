

define(
        [
            "Konva"
        ],
        function (Konva) {


            return function (inputs) {


                // checking inputs
                if (!inputs || typeof inputs !== "object" || !inputs.settings) {
                    console.log("slingshotBallRubberband got some bad inputs");
                    return false;
                }

                /*
                 * 
                 *      The inputs are clean!
                 *      
                 */


                var settings = inputs.settings;
                var ball = inputs.ball;
                var layer = new Konva.Layer();
                inputs.settings.stage.add(layer);
                layer.moveToBottom();
                var anim; // will hold the Konva.Animation


                // returns an array of two goalposts
                var goalPosts = (function () {

                    function newGoalPost(position) {

                        var goalPost = new Konva.Circle({
                            radius: settings.goalPostRadius || 4, // four by default
                            fill: settings.goalPostColor,
                            fillLinearGradientStartPoint: {
                                x: 0,
                                y: -5
                            },
                            fillLinearGradientEndPoint: {
                                x: 0,
                                y: 5
                            },
                            fillLinearGradientColorStops: [0, "#AAA", 1, "#000"],
                            x: settings.ballHome.x + position,
                            y: settings.ballHome.y,
                            listening: false,
                            name: "goalPost"
                        });
                        layer.add(goalPost);
                        goalPost.moveToBottom();
                        goalPost.cache();
                        return goalPost;
                    }


                    var goalPost1 = newGoalPost(settings.goalPostSpread);
                    var goalPost2 = newGoalPost(-settings.goalPostSpread);
                    var goalPosts = [goalPost1, goalPost2];


                    return goalPosts;
                }());


                // rubberband
                var rubberband = new Konva.Line({
                    points: [
                        goalPosts[0].x(),
                        goalPosts[0].y(),
                        settings.ballHome.x,
                        settings.ballHome.y,
                        goalPosts[1].x(),
                        goalPosts[1].y()
                    ],
                    stroke: settings.rubberbandColor,
                    strokeWidth: settings.rubberbandWidth,
                    tension: 0.2,
                    listening: false
                });
                layer.add(rubberband).draw();


                // making sure the rubberband is under the ball
                rubberband.moveToBottom();


                // called on mouse drag - NOT an animation or Tween per se
                function stretch(snapBackAfterRelease) {
                    
                    
                    var distanceFromBallHome = (function () {
                        var diffX = Math.pow(ball.x() - settings.ballHome.x, 2);
                        var diffY = Math.pow(ball.y() - settings.ballHome.y, 2);
                        var totalDistance = Math.sqrt(diffX + diffY);
                        return totalDistance;
                    }());


                    var newGoalpostSpread = (function () {
                        var spread = settings.goalPostSpread * (distanceFromBallHome / settings.goalPostSpread / 2);
                        return Math.min(spread, 70);
                    }());


                    // setting the goalposts' positions
                    goalPosts[0].x(settings.ballHome.x - (settings.goalPostSpread - newGoalpostSpread));
                    goalPosts[1].x(settings.ballHome.x + (settings.goalPostSpread - newGoalpostSpread));


                    // setting the rubberband's points
                    rubberband.points([
                        goalPosts[0].x(),
                        goalPosts[0].y(),
                        ball.x(),
                        ball.y(),
                        goalPosts[1].x(),
                        goalPosts[1].y()
                    ]);


                    if (snapBackAfterRelease) {


                        // only if the ball is ABOVE the home position, or if the ball's 
                        // inertia is positive (meaning, it's traveling up)
                        if (ball.y() < settings.ballHome.y || ball.inertia.y < 0) {
                            anim.stop();
                            goalPosts[0].x(settings.ballHome.x - settings.goalPostSpread);
                            goalPosts[1].x(settings.ballHome.x + settings.goalPostSpread);
                            rubberband.points([
                                goalPosts[0].x(),
                                goalPosts[0].y(),
                                settings.ballHome.x,
                                settings.ballHome.y,
                                goalPosts[1].x(),
                                goalPosts[1].y()
                            ]);
                        }
                    }


                    layer.batchDraw();
                }


                // stretching the string whenever the ball is dragged
                ball.on("dragmove", function () {
                    stretch(false);
                });


                // returning the string and goalPosts on dragEnd
                ball.on("dragend", function () {
                    anim = new Konva.Animation(function () {
                        stretch(true);
                    }, layer);
                    anim.start();
                });


                // Adding a "remove" function that removes the whole layer, 
                // so we can insert a new rubberband from scratch
                return {
                    remove: function () {
                        layer.remove();
                    }
                };
            };
        });