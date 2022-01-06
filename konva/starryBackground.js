define(
        [
            "jquery",
            "tools",
            "Konva"
        ],
        function ($, tools, Konva) {


            return function (params) {


                if (!params || typeof params !== "object" || !params.layer) {
                    console.log("starryBackground got some bad parameters!");
                    return false;
                }


                params = $.extend({
                    layer: null, // required
                    numberStars: 200,
                    twinkleInterval: 100,
                    radius: 1,
                    colors: ["yellow", "white"]
                }, params);


                var starsArray = [];
                var starMaster = new Konva.Circle({
                    width: 0.5,
                    height: 0.5
                });
                var stage = params.layer.getStage();
                var stageWidth = stage.width();
                var stageHeight = stage.height();
                var isPaused = false;
                params.colors = $.isArray(params.colors) ? params.colors : [params.colors];


                for (var i = 0; i < params.numberStars; i++) {

                    var thisStarMaxOpacity = 0.3 + Math.random() * 0.7;
                    var randomFill = tools.pickOneFrom(params.colors);

                    var clone = starMaster.clone()
                            .x(Math.random() * stageWidth)
                            .y(Math.random() * stageHeight)
                            .radius(params.radius)
                            .opacity(thisStarMaxOpacity)
                            .fill(randomFill)
                            .listening(false);

                    // saving "thisStarMaxOpacity" as a property, because 
                    // stars will vary in default brightness
                    clone.thisStarMaxOpacity = thisStarMaxOpacity;

                    params.layer.add(clone);
                    clone.cache();
                    starsArray.push(clone);
                }


                params.layer.batchDraw();


                setInterval(function () {

                    if (isPaused) {
                        return false;
                    }

                    starsArray.forEach(function (star) {
                        if (Math.random() < 0.01) {
                            star.opacity(star.opacity() === 0 ? star.thisStarMaxOpacity : 0);
                        }
                    });
                    params.layer.batchDraw();
                }, params.twinkleInterval);


                function pause() {
                    isPaused = true;
                }


                function resume() {
                    isPaused = false;
                }


                return {
                    pause: pause,
                    resume: resume
                };
            };
        });

// constructor
