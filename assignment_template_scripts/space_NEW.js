/* jshint expr: true */


(function() {
    "use strict";
}());


define(
    [
        "assignment",
        "jquery",
        "tools",
        "Konva",
        "konva/Laser",
        "konva/explosion",
        "konva/blastCircle",
        "helpers/vocabList",
        "helpers/AudioLoader",
        "helpers/SoundEffects",
        "konva/starsBackground",
        "helpers/Timer",
        "helpers/tangocho",
        "howler",
    ],
    function(
        assignment,
        $,
        tools,
        Konva,
        Laser,
        ExplosionFactory,
        BlastCircle,
        myVocabList,
        audioLoader,
        SoundEffects,
        StarsBackground,
        Timer,
        tangocho
    ) {


        $(function() {


            const isMobile = tools.isMobile(),
                isDesktop = !isMobile,
                $canvasHolder = $("#canvas_holder"),
                $playButton = $("#playButton"),
                clickOrTouch = tools.clickOrTouch,
                score = tools.score(),
                ufoImagePath = "/images/space/UFO.png";


            let audio,
                vocabList,
                flock,
                myJSON,
                startButton,
                crosshairs,
                timer,
                timeLimit,
                recycle,
                numProblems,
                stage,
                pausedMark,
                laser,
                starsLayer,
                layer,
                stageWidth,
                stageHeight,
                stageCenterX,
                stageCenterY,
                starsBackground,
                fireButtons,
                deviceTilt = function() {};


            const soundEffects = new SoundEffects({
                checkbox: $("#sound-effects-checkbox"),
                playThisOnCheckboxCheck: "tick",
                sounds: {
                    tick: "/sounds/tick.mp3",
                    laserSound: "/sounds/space/laser.mp3",
                    explosionSound: "/sounds/space/explosion.mp3",
                }
            });


            assignment.controlPanel.useBGM();
            const bgm = assignment.backgroundMusic;
            bgm.source("https://www.bensound.com/bensound-music/bensound-epic.mp3");


            // disabling zoom on double-click
            if (isMobile) {
                $("#viewport").prop("content", "width=device-width, maximum-scale=1.0, user-scalable=no");
            }


            const defaults = {
                starFlyTime: 6 * 1000,
                bulletFlyTime: 0.5,
                number_sentakushi: 4,
                numberStars: 150,
            };


            function Referee() {


                this.totalRight = 0;
                this.data = [];


                let that = this;


                function checkAnswer(target) {
                    const isCorrect = (flock.getTarget() === target);
                    isCorrect ? answeredRight(target) : answeredWrong(target);
                    return true;
                }


                function getTargetText() {
                    return flock.getTarget().attrs.text;
                }


                function newProblem() {
                    assignment.gambariTimeStart();
                    that.hittableOn = true;
                    hint.hide();
                    setTimeout(hint.show, hint.pauseBeforeShow);
                    $("#pauseButton").removeClass("pauseButtonClicked").text("ポーズ");
                    $(".answerDiv").fadeOut("slow");
                    flock.fillFlock();
                }


                function answeredRight(target) {


                    explosionSequence(target.x(), target.y(), target);
                    target.remove();
                    that.totalRight++;
                    soundEffects.play("explosionSound");
                    $(".dotBlank:first").removeClass("dotBlank").addClass("dotGreen");


                    // if we're not finished yet...
                    // if (vocabList.getNumberRemainingWords() > 0) {
                    if (flock.flyingWords().length > 0) {
                        setTimeout(referee.newProblem, 1000); // was 2000
                        return true;
                    }


                    // removing html mousemove listeners
                    $("html").off("mousemove");
                    endSequence("allAnswered");
                }


                function answeredWrong(wordThatWasHit) {


                    wordThatWasHit.flash();


                    flock.setDirection();


                    return;


                    hint.hide();
                    soundEffects.play("explosionSound");
                    score.number_mistakes++;


                    // sending mistaken vocabulary items to the user's tangocho
                    if (myJSON.assignment.use_user_vocab) { // NOTE added "!" just for testing purposes


                        // the flyingWord that was hit, and its English partner
                        const j1 = wordThatWasHit;
                        const e1 = vocabList.getWordFor(j1);


                        // the target English word, and its Japanese partner
                        const e2 = vocabList.getTargetEnglish();
                        const j2 = vocabList.getWordFor(e2);


                        tangocho.add({ english: e1, japanese: j1 });
                        tangocho.add({ english: e2, japanese: j2 });
                    }


                    // removing all the flyingWords
                    while (flyingWordsArray.length > 0) {
                        flyingWordsArray[0].remove();
                        flyingWordsArray.splice(0, 1);
                    }


                    showAnswer(false);


                    // flashing the spaceShake div before going on to the answeredWrong function!
                    let hidden = true;
                    let spaceShakeCounter = 0;


                    const spaceShakeLimit = 10;
                    const flashInterval = setInterval(function() {
                        if (hidden) {
                            spaceShakeCounter++;
                            $("#spaceShake").css("visibility", "visible");
                            hidden = false;
                            if (spaceShakeCounter > spaceShakeLimit) {
                                $("#spaceShake").css("visibility", "hidden");
                                clearInterval(flashInterval);
                            }
                        } else {
                            $("#spaceShake").css("visibility", "hidden");
                            hidden = true;
                        }
                    }, 50);
                }


                this.hittableOn = false;
                this.isPaused = false;
                this.getTargetText = getTargetText;
                this.newProblem = newProblem;
                this.checkAnswer = checkAnswer;
                this.answeredRight = answeredRight;
                this.answeredWrong = answeredWrong;
            }
            const referee = new Referee();


            tools.isNotMobile() ? setup() : assignment.mobileChuui({
                warningsLast: [
                    {
                        paragraphs: ["さあ、Do your best!"],
                        img: "/images/mobile-usage-icons/ufo.png",
                        buttonText: "Start!",
                        onClick: setup,
                    },
                ],
            });


            assignment.fixedProblemHolder({
                onSlideUp: function() {
                    const currentStageWidth = stage.width();
                    const scale = stage.container().offsetWidth / currentStageWidth;
                    stage.width(currentStageWidth * scale);
                    stage.scale({ x: scale });
                    stage.draw();
                },
                onSlideDown: function() {
                    const containerWidth = stage.container().offsetWidth;
                    stage.width(containerWidth);
                    stage.scale({ x: 1 });
                    stage.draw();
                },
            });


            function DeviceTilt(params) {


                const tiltSettings = $.extend({
                    sensitivity: 10, // tilt of 10 brings it to the edge
                    lag: 0.1
                }, params || {});


                const crosshairs = params.crosshairs;


                let currentX = 0,
                    currentY = 0;


                // triggering "orientationchange" once to get the current orientation
                $(window).trigger("orientationchange");


                function changeHandler(event) {


                    const sensitivity = tiltSettings.sensitivity;
                    const tilt = tools.getTilt(event);
                    const tiltX = Math.max(Math.min(tilt.x, sensitivity), -sensitivity);
                    const tiltY = Math.max(Math.min(tilt.y, sensitivity), -sensitivity);
                    const targetX = stageCenterX + (tiltX * (stageWidth / sensitivity) / 2);
                    const targetY = stageCenterY + (tiltY * (stageHeight / sensitivity) / 2);
                    const diffX = targetX - currentX;
                    const diffY = targetY - currentY;
                    const newX = currentX + (diffX * tiltSettings.lag);
                    const newY = currentY + (diffY * tiltSettings.lag);


                    crosshairs.x(newX).y(newY).moveToTop();


                    currentX = newX;
                    currentY = newY;
                }


                return changeHandler;
            }


            function StartButton(crosshairs) {


                const image = new Image();
                const loadedText = "ここをクリックして\n\nLet's Start!";
                const group = new Konva.Group({
                    id: "startButton",
                    opacity: 0,
                    scale: { x: 1.5, y: 1.5 }
                });

                let ufo,
                    startText = {};


                image.onload = function() {


                    timer.start();
                    score.startTimer();


                    ufo = new Konva.Image({
                        image: image,
                        width: 120,
                        height: 60,
                        offset: { x: 60, y: 30 }
                    });


                    startText = new Konva.Text({
                        text: loadedText,
                        fill: "yellow",
                        fontSize: 14,
                        align: "center"
                    });


                    const transparentCircle = new Konva.Circle({
                        radius: 80,
                        fill: "transparent"
                    });


                    group.add(ufo, startText, transparentCircle);
                    startText.offset({ x: startText.width() / 2, y: -40 });
                    group.x(stageWidth / 2).y(stageHeight / 2);
                    layer.add(group).batchDraw();


                    setTimeout(function() {
                        group.getLayer() && group.to({ // NEW TEST adde group.getLayer() &&  in order to avoid warning
                            duration: 0.5,
                            opacity: 1,
                            scaleX: 1,
                            scaleY: 1,
                            easing: Konva.Easings.EaseOut
                        });
                    }, 500);


                    // making sure the crosshairs show up ABOVE the UFO
                    crosshairs.showCrosshairs();
                };


                image.src = ufoImagePath;


                return {
                    enable: function() {
                        layer.draw();
                    }
                };
            }


            function Crosshairs(p = {}) {


                const strokeWidth = p.strokeWidth || 2,
                    lineLength = p.lineLength || isMobile ? 16 : 10,
                    stroke = p.stroke || "yellow",
                    group = new Konva.Group({
                        listening: false
                    }),
                    lineTemplate = new Konva.Line({
                        stroke: stroke,
                        strokeWidth: strokeWidth
                    });


                // cloning the lineTemplate to make the two bars of the crosshairs
                const verticalLine = lineTemplate.clone().points([lineLength, 0, lineLength, lineLength * 2]),
                    horizontalLine = lineTemplate.clone().points([0, lineLength, lineLength * 2, lineLength]);


                group.add(verticalLine, horizontalLine);
                p.layer.add(group);


                group.offsetX(lineLength / 2);
                group.offsetY(lineLength / 2);
                group.x(stageWidth / 2);
                group.y(stageHeight / 2);
                group.cache();
                layer.batchDraw();


                // DESKTOP moving the crosshairs with the (invisible) mouse pointer
                !isMobile && $(window).on("mousemove", function() {


                    let pos = { x: 0, y: 0 };
                    try {
                        pos = stage.getPointerPosition();
                    } catch (e) {
                        return false;
                    }


                    // hiding the crosshairs when the mouse is outside the stage
                    if (!pos) {
                        group.visible(false);
                        return;
                    }


                    // showing the crosshairs *IF* the mouse pointer is over the stage
                    group.setAttrs({
                        x: pos.x,
                        y: pos.y,
                        visible: true
                    }).moveToTop();
                    layer.batchDraw();
                });


                // used to force
                group.showCrosshairs = function() {
                    group.moveToTop();
                    layer.batchDraw();
                };


                return group;
            }


            function FireButtons(p = {}) {

                if (!p.isMobile) {
                    return null;
                }

                const stage = p.stage;
                const laser = p.laser;
                const radius = Math.min(stage.width(), stage.height()) / 8;
                const offset = radius * 0.8;
                const fireButtonsLayer = new Konva.Layer().moveTo(stage);

                // left button first, then cloning it to make the right
                const leftButtonGroup = new Konva.Group({
                    x: offset,
                    y: stage.height() - offset,
                }).add(new Konva.Circle({
                    radius: radius,
                    fillLinearGradientStartPoint: { x: 0, y: -radius },
                    fillLinearGradientEndPoint: { x: 0, y: radius },
                    fillLinearGradientColorStops: [0, "#faa", 1, "#f00"],
                })).add(new Konva.Ring({
                    outerRadius: radius,
                    innerRadius: radius * 0.8,
                    fillLinearGradientStartPoint: { x: 0, y: -radius },
                    fillLinearGradientEndPoint: { x: 0, y: radius },
                    fillLinearGradientColorStops: [0, "#ccc", 1, "#666"],
                })).cache().moveTo(fireButtonsLayer);

                const rightButtonGroup = leftButtonGroup.clone()
                    .x(stage.width() - offset)
                    .moveTo(fireButtonsLayer)
                    .cache();

                fireButtonsLayer.batchDraw();

                rightButtonGroup.on("touchend", laser.fire);
                leftButtonGroup.on("touchend", laser.fire);

                return {
                    //
                };
            }


            function PausedMark(stage) {


                const pausedLayer = new Konva.Layer().moveTo(stage);
                const group = new Konva.Group().moveTo(pausedLayer);


                group.add(new Konva.Rect({
                    height: stageHeight,
                    width: stageWidth,
                    fill: "black",
                    opacity: 0.5
                }));


                const bar = new Konva.Rect({
                    height: stageHeight * 0.5,
                    width: stageWidth * 0.1,
                    fill: "skyblue",
                    opacity: 0.8,
                    x: stageWidth * 0.35,
                    y: stageHeight * 0.25,
                    cornerRadius: 6
                }).moveTo(group);


                bar.clone().x(stageWidth * 0.55).moveTo(group);
                pausedLayer.cache().hide().draw();
                group.on(clickOrTouch, function() {
                    $("#pauseButton").click();
                });


                return pausedLayer;
            }


            function setup() {


                // defining stage
                stage = new Konva.Stage({
                    container: "canvas_holder",
                    width: $canvasHolder.width(),
                    height: $canvasHolder.height()
                });


                starsLayer = new Konva.Layer().moveTo(stage);
                layer = new Konva.Layer().moveTo(stage);
                stageWidth = stage.width();
                stageHeight = stage.height();
                stageCenterX = stageWidth / 2;
                stageCenterY = stageHeight / 2;


                flock = new Flock({
                    numWords: 5,
                    layer: layer,
                    fontSize: 18,
                });


                pausedMark = new PausedMark(stage);


                laser = new Laser({
                    stage: stage,
                    layer: layer,
                    parentContainer: $canvasHolder,
                    onFire: function() {
                        soundEffects.play("laserSound");
                    },
                    onFinish: flock.checkForHit,
                    bulletSolidColor: isMobile ? "yellow" : null,
                });


                assignment.getProblemData(processProblemData);


                fireButtons = new FireButtons({
                    stage: stage,
                    isMobile: isMobile,
                    laser: laser,
                });


                starsBackground = new StarsBackground({
                    stage,
                    crosshairs,
                    layer: starsLayer,
                    numberStars: defaults.numberStars,
                    starFlyTime: defaults.starFlyTime,
                });
            }


            function setUpStage() {


                startButton.enable();
                laser.enabled = true;


                if (!isMobile) {
                    $("#spaceMain").on("click", function(e) {
                        e.stopPropagation();
                        !referee.isPaused && laser.fire(e);
                    });
                }


                tools.keydown(32, () => audio.play());
                tools.keydown(80, toggleTweenPause); // "p"


                $("#pauseButton").off(clickOrTouch).on(clickOrTouch, toggleTweenPause);
                $playButton.on(clickOrTouch, function(event) {
                    event.stopPropagation();
                    audio.play();
                });
            }


            function processProblemData(data) {


                let ship = Ship();
                let shipAnimation = new Konva.Animation(animateShip, layer).start();


                tools.keydown([37, 28, 29, 40], function() {
                    //
                });


                function Ship() {
                    let ship = new Konva.Rect({
                        x: stage.width() / 4,
                        y: stage.height() / 4,
                        fill: "yellow",
                        width: 20,
                        height: 10,
                    });
                    ship.offsetX(ship.width() / 2).offsetY(ship.height() / 2);
                    ship.rotation(0);
                    layer.add(ship).draw();
                    ship.dps = 90; // rotation
                    ship.velocity = 0;
                    return ship;
                }


                function animateShip(frame) {


                    const leftKey = tools.keyIsPressed(37);
                    const rightKey = tools.keyIsPressed(39);
                    const upKey = tools.keyIsPressed(38);
                    const downKey = tools.keyIsPressed(40);


                    const onlyLeft = leftKey && !rightKey;
                    const onlyRight = !leftKey && rightKey;
                    const onlyUp = upKey && !downKey;
                    const onlyDown = !upKey && downKey;


                    onlyLeft && ship.rotation(ship.rotation() - ship.dps * frame.timeDiff / 1000);
                    onlyRight && ship.rotation(ship.rotation() + ship.dps * frame.timeDiff / 1000);


                    if (onlyUp) {
                        ship.velocity += frame.timeDiff / 1000;
                    } else if (onlyDown) {
                        ship.velocity -= frame.timeDiff / 1000;
                    }


                    ship.velocity = Math.min(ship.velocity, 10);
                    ship.velocity = Math.max(ship.velocity, 0);


                    const newX = ship.x() + Math.cos(ship.rotation() * Math.PI / 180) * ship.velocity;
                    const newY = ship.y() + Math.sin(ship.rotation() * Math.PI / 180) * ship.velocity;


                    ship.x(newX).y(newY);
                }




                myJSON = data;
                referee.data = tools.objectToArray(data.problem);


                if (myJSON.number_problems && !isNaN(myJSON.number_problems)) {
                    tools.whittleDownArray(referee.data, myJSON.number_problems);
                }


                vocabList = myVocabList({
                    words: data.problem
                });


                defaults.number_sentakushi = myJSON.number_sentakushi || 3;
                recycle = myJSON.assignment.recycle;
                numProblems = vocabList.getTotalNumberProblems();


                referee.data.forEach(function() {
                    $("#scorebar").prepend("<div class='dot dotBlank'></div>");
                });


                timer = new Timer({
                    pauseStart: true,
                    countdownFrom: timeLimit,
                    warnAt: timeLimit,
                    onWarn: function() {
                        //
                    },
                    eachSecond: function() {
                        //
                    },
                    onFinish: function() {
                        endSequence(recycle ? "timeTrial" : "timeUp");
                    }
                });


                assignment.directions.show("space", {
                    directions: myJSON.assignment.directions,
                    // mistakes: mistakesLine,
                    numProblems: recycle ? null : (numProblems ? numProblems : null),
                    time: timeLimit,
                    timeTrial: recycle ? true : false
                });


                crosshairs = new Crosshairs({ layer, });
                startButton = new StartButton(crosshairs);
                laser.setCrosshairs(crosshairs);


                tools.activateTiltDetection({
                    onSuccess: function() {
                        deviceTilt = new DeviceTilt({ crosshairs: crosshairs, });
                        window.addEventListener("deviceorientation", deviceTilt, true);
                    },
                    onFail: function() {
                        alert("デバイスの傾きを検知する事はできないため、この問題はできません！");
                    }
                });


                audio = audioLoader({
                    audioFiles: myJSON.audioFiles,
                    onReady: setUpStage,
                    playButton: $("#playIcon"),
                    getWordToPlay: function() {
                        return flock.getTarget().english;
                    },
                    onPlay: function() {
                        $playButton.addClass("playButtonClicked");
                        bgmVolume = bgm.volume();
                        bgm.temporarilyReduceVolume();
                    },
                    onEnded: function() {
                        $playButton.removeClass("playButtonClicked");
                        bgm.restoreVolume();
                    },
                });
            }


            function Flock(obj = {}) {


                if (!obj.layer) {
                    log("new Flock needs a layer to a layer");
                    return false;
                }


                const flyingWordsAnimation = new Konva.Animation(eachFrame, obj.layer).start();
                const flyingWordBuffer = { x: obj.wordBufferX || 20, y: obj.wordBufferY || 30, };


                let pps = stage.width() / 10;


                this.target = null; // will hold the correct answer
                this.targetEnglish = null;
                this.targetJapanese = null;


                function keepOnScreen(word) {
                    if (word.x() < -word.offsetX()) { word.x(stage.width() + word.offsetX()); }
                    if (word.x() > stage.width() + word.offsetX()) { word.x(-word.offsetX()); }
                    if (word.y() < -word.offsetY()) { word.y(stage.height() + word.offsetY()); }
                    if (word.y() > stage.height() + word.offsetY()) { word.y(-word.offsetY()); }
                    return true;
                }


                function eachFrame(frame) {
                    if (referee.isPaused) return false;
                    flyingWords().forEach(word => {
                        let newX = word.x() + Math.cos(word.direction) * pps * frame.timeDiff / 1000;
                        let newY = word.y() + Math.sin(word.direction) * pps * frame.timeDiff / 1000;
                        word.x(newX).y(newY);
                        keepOnScreen(word);
                    });
                    return true;
                }


                function checkForHit(x, y) {


                    if (stage.findOne("#startButton")) {
                        explosionSequence(stageWidth / 2, stageHeight / 2);
                        stage.findOne("#startButton").remove();
                        referee.newProblem();
                        return true;
                    }


                    if (!referee.hittableOn) { return; }


                    flyingWords().some(thisWord => {
                        if (isMiss(x, y, thisWord)) return false;
                        return referee.checkAnswer(thisWord);
                    });
                }


                function removeWords() {
                    flyingWords().forEach(word => word && word.destroy());
                    obj.layer.batchDraw();
                    return this;
                }


                function flyingWords() {
                    return stage.find(".flying_word").toArray();
                }


                function setTarget(p = {}) {
                    p = $.extend({ audioDelay: 500, }, p);
                    this.target = tools.pickOneFrom(flyingWords());
                    setTimeout(() => audio.play(this.target.english), p.audioDelay);
                    return this.target;
                }


                function getTarget() {
                    return this.target;
                }


                function setDirection(words) {
                    words = words || flyingWords();
                    tools.forceArray(words).forEach(word => {
                        word.direction = Math.random() * Math.PI * 2;
                    });
                    return true;
                }


                function newFlyingWord(text) {


                    text = text || vocabList.popOne();
                    text = vocabList.getJapaneseFor(text);
                    if (!text) return false;


                    const flyingWord = new Konva.Text({
                        text: text,
                        fill: obj.fill || "yellow",
                        fontSize: obj.fontSize || 36,
                        x: obj.x || Math.random() * stageWidth,
                        y: obj.y || Math.random() * stageHeight,
                        opacity: 0,
                        name: "flying_word",
                    });
                    flyingWord.offsetX(flyingWord.width() / 2).offsetY(flyingWord.height() / 2);


                    flyingWord.isHittable = true;
                    flyingWord.english = tools.isEnglish(text) ? text : vocabList.getEnglishFor(text);
                    flyingWord.japanese = tools.isEnglish(text) ? vocabList.getJapaneseFor(text) : text;


                    setDirection(flyingWord);


                    obj.layer.add(flyingWord);
                    flyingWord.to({ opacity: 1, duration: obj.fadeInDuratoin || 1 });


                    flyingWord.flash = function() {
                        flyingWord.isHittable = false;
                        const baseFill = flyingWord.fill();
                        flyingWord.fill("red").to({
                            fill: baseFill,
                            duration: 2,
                            onFinish: () => flyingWord.isHittable = true,
                        });
                    };


                    return flyingWord;
                }


                // Either creating a whole new flock, or replenishing a depleted one
                function fillFlock(numberObjects = obj.numWords) {
                    while (flyingWords().length < numberObjects && vocabList.getNumberRemainingWords()) {
                        newFlyingWord();
                    }
                    flock.setTarget();
                }


                function isHit(x, y, shape) {


                    if (!shape.isHittable) return false;


                    const over = y < shape.y() - shape.offsetY() * shape.scaleY() - flyingWordBuffer.y;
                    const under = y > shape.y() + shape.offsetY() * shape.scaleY() + flyingWordBuffer.y;
                    const right = x > shape.x() + shape.offsetX() * shape.scaleX() + flyingWordBuffer.x;
                    const left = x < shape.x() - shape.offsetX() * shape.scaleX() - flyingWordBuffer.x;


                    return !(right || left || over || under);
                }


                function isMiss(x, y, shape) {
                    return !isHit(x, y, shape);
                }


                return {
                    newFlyingWord,
                    fillFlock,
                    flyingWords,
                    isHit,
                    isMiss,
                    setTarget,
                    getTarget,
                    checkForHit,
                    setDirection,
                };
            }






            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */




            function explosionSequence(x, y, flyingWord) {


                // showing the correct word in floating text, if specified
                if (flyingWord) {


                    const jap = flyingWord.text();
                    const eng = vocabList.getTargetEnglish();
                    const text = new Konva.Text({
                        text: jap + "\n" + eng,
                        fontSize: 18,
                        fill: "yellow",
                        x: x,
                        y: y,
                        align: "center",
                        opacity: 0
                    });


                    text.x(text.x() - text.width() / 2);
                    text.y(text.y() - text.height() / 2);


                    // keeping the text on-screen if it would otherwise be too high
                    if (text.y() < 40) {
                        text.y(40);
                    }
                    layer.add(text);


                    // 1 of 2: moving the word up the screen
                    const tween = new Konva.Tween({
                        node: text,
                        y: text.y() - 40,
                        duration: 3,
                        onFinish: function() {
                            text.remove();
                        }
                    }).play();


                    // 2 of 2: fading the word in (quickly) and then out (more slowly)
                    const fadeInTween = new Konva.Tween({
                        node: text,
                        opacity: 1,
                        duration: 0.5,
                        onFinish: function() {
                            setTimeout(function() {
                                let fadeOutTween = new Konva.Tween({
                                    node: text,
                                    opacity: 0,
                                    duration: 1
                                }).play();
                            }, 1500);
                        }
                    }).play();
                }


                soundEffects.play("explosionSound");


                // calculating the explosion size, based on distance from center
                // const explosionSize = (function() {
                //     if (x && y && flyingWord) {
                //         let distanceX = $canvasHolder.width() / 2 - x;
                //         let distanceY = $canvasHolder.height() / 2 - y;
                //         return (Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2)) * 3) / 200;
                //     }
                //     return 1;
                // }());


                // showing the explosion image, at the x & y coordinates if input, or in dead center, if not
                if (x && y) {
                    explosion.show(x, y, 1);
                } else {
                    const myExplosion = ExplosionFactory({
                        layer: layer,
                        x: x || stageWidth / 2,
                        y: y || stageHeight / 2,
                        fill: "orange"
                    });
                    const myBlast = BlastCircle({
                        layer: layer,
                        radius: stageHeight / 4,
                        duration: 2,
                        blastInterval: 100,
                        strokeWidth: 4,
                        opacity: 1,
                        x: x || stageWidth / 2,
                        y: y || stageHeight / 2,
                        stroke: "red"
                    });

                }
            }





            const endSequence = (function() {


                let hasBeenCalled = false;


                const passConditions = {
                    tooManyMistakes: false,
                    timeUp: false,
                    allAnswered: true,
                    timeTrial: true
                };


                return function(result) {


                    result = result || "allAnswered";


                    if (hasBeenCalled) { return; }


                    hasBeenCalled = true;
                    timer && timer.stop();
                    score.stopTimer();
                    assignment.gambariTimeStop();
                    audio.disable().stopAll();


                    // sending off the results
                    const results = {
                        time_taken: score.time_taken(),
                        number_problems: referee.data.length, //vocabList.numberOfProblems,
                        number_mistakes: score.number_mistakes,
                        mistaken_vocab: null, //myMistakenVocab,
                        passed: passConditions[result]
                    };


                    assignment.send_results(results, function() {
                        setTimeout(function() {

                            const data = [
                                { label: "時間", value: results.time_taken + " 秒" },
                                { label: "問題数", value: results.number_problems ? results.number_problems + " 問" : "-" },
                                { label: "正解", value: score.number_correct + " 問" },
                                { label: "間違い", value: score.number_mistakes + " 問" }
                            ];

                            assignment.showAssignmentResults({
                                container: $("#mainProblemsHolder"),
                                result: result,
                                data: data
                            });


                            bgm && bgm.fadeOut();


                            let percentCorrect = results.number_problems / score.number_guesses;
                            percentCorrect = Math.min(percentCorrect, 1); // keeping it between 0 and 1
                            percentCorrect = Math.max(percentCorrect, 0);
                        }, 1000);
                    });


                    return true;
                };
            }());


            // div that shows the answer, or other messages
            function showAnswer(answeredCorrectly) {


                const engWord = vocabList.getTargetEnglish();
                const japWord = vocabList.getTargetJapanese();


                $(".answerDiv").html(`<p>${engWord} = ${japWord}</p>`)
                    .off(clickOrTouch)
                    .css({
                        color: "lightgreen",
                        display: "block"
                    });


                // adding clickability if the problem was not answered correctly
                if (!answeredCorrectly) {
                    $(".answerDiv").css({ color: "red" });
                    setTimeout(function() {
                        $(".answerDiv").append("<br class='clearFloat'><div class='spaceControls' id='closeButton'>Next <span class='glyphicon glyphicon-play'></span><span class='glyphicon glyphicon-play'></span></div>");
                        $("#closeButton").on(clickOrTouch, function(event) {
                            event.stopPropagation();
                            $(this).off(clickOrTouch);
                            referee.newProblem();
                        });
                    }, 3000);
                }
            }


            function toggleTweenPause(event) {
                event && event.stopPropagation();
                referee.isPaused ? pauseModeOn() : pauseModeOff();
                referee.isPaused = !referee.isPaused;
            }


            function pauseModeOff() {
                bgm && bgm.pause();
                crosshairs.hide();
                layer.draw();
                laser.enabled = false;
                starsBackground.isPaused = true;
                $("#spaceGrayFilter").css("display", "block");
                $("#pauseButton").addClass("pauseButtonClicked").text("再開");
                pausedMark.show().draw();
            }


            function pauseModeOn() {
                starsBackground.isPaused = false;
                crosshairs.show();
                bgm && bgm.play();
                laser.enabled = true;
                $("#pauseButton").removeClass("pauseButtonClicked").text("ポーズ");
                $playButton.click();
                pausedMark.hide().draw();
            }


            /*  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  */




            const explosion = (function() {


                let nowExploding = false;


                function show(x, y, explosionSize) {


                    if (nowExploding) { return; }
                    nowExploding = true;
                    const blastColor = tools.pickLightColor();


                    // the glowy, half-transparent explosion thing
                    !isMobile && ExplosionFactory({
                        layer: layer,
                        x: x,
                        y: y,
                        radius: explosionSize * 100 * 0.6,
                        fill: blastColor,
                        callback: () => nowExploding = false,
                    });


                    // the expanding ring
                    BlastCircle({
                        stage: stage,
                        layer: layer,
                        radius: explosionSize * 100,
                        duration: 2,
                        strokeWidth: 3 * explosionSize,
                        opacity: 0.8,
                        easing: Konva.Easings.EaseOut,
                        x: x,
                        y: y,
                        stroke: blastColor,
                        callback: () => nowExploding = false,
                    });
                }


                return {
                    show,
                };
            }());


            const hint = (function() {


                function show() {


                    if (!vocabList.getTargetEnglish) { return; }


                    // hiding the hint instead if it is already showing
                    if ($("#hint-holder").css("top") === "0px") {
                        hint.hide();
                        return;
                    }


                    // setting the hint text to the wordToPlay, and positioning it accordingly
                    $("#hint-holder").text(vocabList.getTargetEnglish())
                        .css({ top: "-34px", opacity: "1" })
                        .animate({ top: "0px" }, 400);
                }


                function hide() {
                    $("#hint-holder").css({ top: "0px" }).fadeTo(400, 0, function() {
                        $("#hint-holder").empty().css({ top: "-34px" });
                    });
                }


                return { show, hide, pauseBeforeShow: 500 };
            }());


            // wiring up the hint-button
            $("#hintButton").on("click", function() {
                hint.show();
            });


            $("#stars-movement").on("change", function() {
                starsBackground.turnedOff = !$(this).is(":checked");
            });
        });
    });