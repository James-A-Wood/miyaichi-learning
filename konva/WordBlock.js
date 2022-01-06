define(
        [
            "jquery",
            "Konva"
        ],
    function($, Konva) {


        // returns a function that creates individual wordBlocks
        return function(inputs) {


            // settings for all words
            let settings = {
                x: 0,
                y: 0,
                isActive: true, // means wordBlocks are clickable/eatable
                parentLayer: null, // NECESSARY only when layer.draw is required, as when deleting the word (when eaten words are not tweened away...)
                paddingX: 10,
                paddingY: 15,
                textSize: 18,
                opacity: 1,
                width: null,
                height: null,
                rotate: null,
                align: "center",
                fill: "lightblue",
                stroke: "navy",
                textFill: "navy",
                strokeWidth: 1,
                cornerRadius: 2,
                draggable: false,
                text: "",
                removeMethod: "shrink",
                name: "wordBlock",
                id: "",
                breakAtSpaces: false,
            };
            $.extend(settings, inputs || {});


            // returning a wordblock factory...
            return function(inputs) {


                // optional inputs for each wordBlock instance
                $.extend(settings, inputs || {});


                // optionally replacing spaces with line breaks, when each word is 3+ characters long
                if (settings.breakAtSpaces) {
                    settings.text = settings.text.replace(/(\w{3,})\s(\w{3,})/g, "$1\n$2"); // Cool syntax!
                }


                // building the pieces - first, the text itself
                const text = new Konva.Text({
                    text: settings.text,
                    align: "center",
                    fontSize: settings.textSize,
                    fill: settings.textFill,
                    x: settings.paddingX,
                    y: settings.paddingY,
                    opacity: settings.opacity,
                    align: settings.align || "center"
                });


                // keeping the text no taller than the card height minus paddingY
                if (settings.height) {

                    function isTooTall() {
                        return text.height() > settings.height - (settings.paddingY * 2 || 0);
                    }

                    while (isTooTall()) {
                        text.fontSize(text.fontSize() - 1);
                    }
                }


                // keeping the text no wider than the card width minus paddingX
                if (settings.width) {

                    text.width(settings.width - settings.paddingX * 2);

                    function isTooWide() {
                        return text.width() > settings.width - settings.paddingX * 2;
                    }

                    while (isTooWide()) {
                        text.fontSize(Math.floor(text.fontSize()) - 3);
                    }
                }


                // keeping the text no taller than the card height minus paddingY
                if (settings.height) {

                    function isTooTall() {
                        return text.height() > settings.height - (settings.paddingY * 2 || 0);
                    }

                    while (isTooTall()) {
                        text.fontSize(Math.floor(text.fontSize()) - 3);
                    }
                }


                // building the background
                const background = new Konva.Rect({
                    fill: settings.fill,
                    stroke: settings.stroke,
                    strokeWidth: settings.strokeWidth,
                    cornerRadius: settings.cornerRadius,
                    width: settings.width || text.width() + settings.paddingX * 2,
                    height: settings.height || text.height() + settings.paddingY * 2,
                    opacity: settings.opacity,
                    shadowBlur: settings.shadowBlur,
                    shadowOffset: settings.shadowOffset,
                    shadowColor: settings.shadowColor,
                    shadowOpacity: settings.shadowOpacity
                });


                // making sure the corner radius is no larger than half the background height
                background.cornerRadius(Math.min(background.height() / 2, settings.cornerRadius));


                // making box bigger to accomodate tall text
                if (text.height() > background.height() + settings.paddingY) {
                    background.height(text.height() + settings.paddingY);
                }


                // centering text vertically in the background
                text.y(background.height() / 2 - text.height() / 2);


                // grouping background & text together...
                const group = new Konva.Group({
                    draggable: settings.draggable,
                    name: settings.name || "wordBlock",
                    x: settings.x,
                    y: settings.y,
                    id: settings.id
                });
                group.add(background, text);


                // adding some properties to the group
                group.isActive = true; // whether the wordBlock is 'hittable' or not
                group.width = background.width(); // hardcoding the width
                group.height = background.height(); // hardcoding the height


                // adding rotation, if there's a "rotate" property and it's a number
                if (settings.rotate && !isNaN(settings.rotate)) {
                    const number = settings.rotate / 2;
                    const random = Math.random() * settings.rotate;
                    group.rotate(number - random);
                }


                // flashing some element of the background (e.g. background-fill or stroke)
                group.flash = function(inputs) {

                    let settings = {
                        color: "pink",
                        interval: 500,
                        element: "fill"
                    };
                    $.extend(settings, inputs || {});

                    // saving the original color of the element to be flashed
                    const originalColor = background[settings.element]();
                    const parentLayer = background.getLayer();

                    group.flashInterval = setInterval(function() {
                        const newColor = (background[settings.element]() === originalColor) ? settings.color : originalColor;
                        background[settings.element](newColor);
                        parentLayer.batchDraw();
                    }, settings.interval);
                };


                // deleting the word when it is eaten
                group.removeMe = function() {

                    // returning if settings.isActive is FALSE
                    if (!settings.isActive) { return; }

                    if (group.isActive) {

                        group.isActive = false;

                        if (settings.removeMethod === "shrink") {
                            group.to({
                                scaleX: 0,
                                scaleY: 0,
                                duration: 0.2,
                                onFinish: function() {
                                    group.remove();
                                }
                            });
                        } else {
                            group.remove();
                            settings.parentLayer.batchDraw();
                        }
                    }
                };


                group.shrinkAway = function(p) {
                    group.to({
                        duration: p.duration || 11,
                        scaleX: p.scaleX || 0.01,
                        scaleY: p.scaleY || 0.01,
                        onFinish: function() {
                            group.remove();
                        }
                    });
                };


                group.popUp = function(delay = 0) {
                    const originalX = group.x();
                    const originalY = group.y();
                    group.scaleX(0.01).scaleY(0.01);
                    group.to({
                        x: originalX,
                        y: originalY,
                        scaleX: 1,
                        scaleY: 1,
                        duration: 0.5,
                        easing: Konva.Easings.EaseInOut
                    });
                };


                group.fadeAndRemove = function(p) {
                    p = p || {};
                    group.to({
                        opacity: p.opacity ? p.opacity : 0,
                        duration: p.duration ? p.duration : 1,
                        scaleX: p.scaleX ? p.scaleX : 0.01,
                        scaleY: p.scaleY ? p.scaleY : 0.01,
                        onFinish: function() {
                            p.callback || group.destroy();
                        }
                    });
                };


                // scales the whole group (text & background) to whatever number you give it
                group.scaleTo = function(number) {

                    if (!number || isNaN(number)) {
                        console.log("group.scaleTo takes a single number, the percent to scale to!");
                        return false;
                    }

                    log(number);

                    // scaling the text and the background
                    group.scale({ x: number, y: number });
                    // text.scaleX(number).scaleY(number);
                    // background.scaleX(number).scaleY(number);

                    // setting the newly adjusted group width and height
                    group.width = group.width * number;
                    group.height = group.height * number;

                    // adjusting the text position, which would be off otherwise
                    const newTextX = text.x() - (background.width() - text.width()) / 4;
                    const newTextY = text.y() - (background.height() - text.height()) / 4;
                    text.x(newTextX).y(newTextY);

                    // don't forget this!
                    settings.parentLayer.batchDraw();
                };


                group.offsetX(group.width / 2);
                group.offsetY(group.height / 2);
                settings.cache !== false && group.cache();

                return group;
            };
        };
    });