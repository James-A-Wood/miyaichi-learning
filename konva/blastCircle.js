define(
        [
            "jquery",
            "Konva"
        ],
    function($, Konva) {

        return function(inputParams) {

            let myInterval;

            if (!inputParams || typeof inputParams !== "object") {
                console.log("BlastCircle got some bad params!");
                return false;
            }

            // settings
            let settings = $.extend({
                x: null, // required
                y: null, // required
                stage: null,
                radius: 30,
                innerRadius: 15,
                outerRadius: 40,
                fill: null,
                stroke: "red",
                strokeWidth: 2,
                duration: 1,
                opacity: 2,
                blastInterval: 500,
                numCircles: 1,
                useGraduallySmallerCircles: false,
                offset: 0,
                squishY: false,
                reverseMode: false,
                callback: null,
                shape: "circle", // can also be "star"
                numPoints: null, // for star only
                easing: Konva.Easings.StrongEaseOut,
                paralax: 0.4,
                crosshairs: null
            }, inputParams);

            // building and blasting the circles!
            const stageCenterX = settings.stage ? settings.stage.width() / 2 : null;
            const stageCenterY = settings.stage ? settings.stage.height() / 2 : null;

            let counter = 0;
            let lastCircleRadius = settings.radius; // used when making each circle slightly smaller
            let numberCircle = 0;

            // always calling at least one circle immediately
            blastShape();

            // ...but if there are more than one, then calling them by setInterval
            if (settings.numCircles > 1) {
                myInterval = setInterval(blastShape, settings.blastInterval);
            }

            function blastShape() {

                numberCircle++;

                if (numberCircle > 1 && settings.useGraduallySmallerCircles) {
                    lastCircleRadius = lastCircleRadius * 0.5;
                }

                // default shape is circle, unless "star" is explicitly passed in
                const KonvaShape = (settings.shape !== "star") ? Konva.Circle : Konva.Star;

                // creating either "Circle" (default) or "Star"
                const blastShape = new KonvaShape({
                    layer: null, // REQUIRED
                    x: settings.x,
                    y: settings.y,
                    radius: settings.shape === "circle" ? 0.1 : null,
                    innerRadius: settings.shape === "star" ? 0.1 : null,
                    outerRadius: settings.shape === "star" ? 0.1 : null,
                    opacity: settings.opacity,
                    numPoints: settings.shape === "star" ? settings.numPoints : null,
                    offsetX: (settings.offset / 2) - (Math.random() * settings.offset),
                    offsetY: (settings.offset / 2) - (Math.random() * settings.offset),
                    stroke: settings.stroke,
                    strokeWidth: settings.strokeWidth,
                    fill: settings.fill,
                    scaleY: settings.squishY ? 0.1 : 1,
                    lineJoin: settings.shape === "star" ? "round" : null // for the star points
                }).moveTo(settings.layer);

                // making blast circle move in opposite direction of the crosshairs, if applicable
                let anim = null;
                if (settings.paralax && settings.crosshairs) {
                    anim = new Konva.Animation(function() {
                        const newX = settings.x - (settings.crosshairs.x() - stageCenterX) * settings.paralax;
                        const newY = settings.y - (settings.crosshairs.y() - stageCenterY) * settings.paralax;
                        blastShape.x(newX).y(newY);
                    }, settings.layer).start();
                }

                let tween = new Konva.Tween({
                    node: blastShape,
                    radius: settings.shape === "circle" ? lastCircleRadius : null,
                    innerRadius: settings.shape === "star" ? settings.innerRadius : null,
                    outerRadius: settings.shape === "star" ? settings.outerRadius : null,
                    duration: settings.duration,
                    easing: settings.easing,
                    opacity: 0,
                    onFinish: function() {
                        blastShape.destroy();
                        anim && anim.stop();
                    }
                }).play();

                // running the tween in reverse, optionally
                if (settings.reverseMode) {
                    tween.seek(settings.duration).reverse();
                    setTimeout(function() {
                        blastShape.destroy();
                        anim && anim.stop();
                    }, settings.duration * 1000);
                }

                // keeping count of how many circles have been fired
                counter += 1;

                // breaking the cycle after the specified number of circles
                if (counter >= settings.numCircles) {
                    clearInterval(myInterval);
                    settings.callback && setTimeout(function() {
                        settings.callback();
                    }, settings.duration * 1000);
                }
            }
        };
    });