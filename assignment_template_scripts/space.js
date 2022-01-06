/* jshint expr: true */

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


            let flyingWordsArray = [],
                audio,
                vocabList,
                myJSON,
                startButton,
                crosshairs,
                timer,
                mistakesLine,
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


            // const bgm = assignment.backgroundMusic({
            //     localStorageKey: "space_use_bgm",
            //     mp3Src: "https://www.bensound.com/bensound-music/bensound-epic.mp3",
            // });


            // disabling zoom on double-click
            if (isMobile) {
                $("#viewport").prop("content", "width=device-width, maximum-scale=1.0, user-scalable=no");
                // $(".row-sm-no-padding").css({ padding: "0px" }); // removing padding on mobile
            }


            const defaults = {
                wordFlyTime: 10 * 1000, // 10 seconds
                starFlyTime: 6 * 1000,
                bulletFlyTime: 0.5,
                number_sentakushi: 4,
                numberStars: 250,
                paralax: 0.4 // was 0.2
            };


            const problem = {
                unanswered: true,
                hittableOn: false,
                isPaused: false,
                data: [],
                allWords: [],
                remainingWords: [],
                wordToPlay: "",
                soundsHaveLoaded: false
            };


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


            // NEW TEST - resizing the canvas when the $canvasHolder has changed dimensions
            // setting the fixed problem holder
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

                let ufo, startText = {};


                // wiring up the onload listener FIRST before actually loading it
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


                pausedMark = new PausedMark(stage);


                laser = new Laser({
                    stage: stage,
                    layer: layer,
                    parentContainer: $canvasHolder,
                    onFire: function() {
                        soundEffects.play("laserSound");
                    },
                    onFinish: checkForHit,
                    bulletSolidColor: isMobile ? "yellow" : null,
                    paralax: defaults.paralax
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
                    paralaxFactor: defaults.paralax
                });
            }


            function setUpStage() {


                problem.soundsHaveLoaded = true;
                startButton.enable();
                laser.enabled = true;


                if (!isMobile) {
                    $("#spaceMain").on("click", function(e) {
                        e.stopPropagation();
                        !problem.isPaused && laser.fire(e);
                    });
                }


                // playing the vocabList.getTargetEnglish again by the space bar
                tools.keydown(32, function() { audio.play(); });
                tools.keydown(80, toggleTweenPause);


                // pausing the action (=plugin)
                $("#pauseButton").off(clickOrTouch).on(clickOrTouch, toggleTweenPause);
                $playButton.on(clickOrTouch, function(event) {
                    event.stopPropagation();
                    audio.play();
                });
            }


            function processProblemData(data) {


                myJSON = data;
                problem.data = tools.objectToArray(data.problem);
                vocabList = myVocabList({
                    words: data.problem
                });


                // using the number_problems, if specified
                if (myJSON.number_problems && !isNaN(myJSON.number_problems)) {
                    tools.whittleDownArray(problem.data, myJSON.number_problems);
                }


                defaults.number_sentakushi = myJSON.number_sentakushi || 3;
                mistakesLine = myJSON.assignment.time_limit;
                recycle = myJSON.assignment.recycle;
                mistakesLine = myJSON.assignment.mistakes_limit;
                numProblems = problem.data.length;


                // adding the scoreDots
                problem.data.forEach(function() {
                    $("#scorebar").prepend("<div class='dot dotBlank'></div>");
                });


                // instantiating the timer
                timer = new Timer({
                    pauseStart: true,
                    countdownFrom: timeLimit,
                    warnAt: timeLimit,
                    onWarn: function() {
                        //
                    },
                    eachSecond: function() {
                        // scorebox.clock.label(timer.time());
                    },
                    onFinish: function() {
                        endSequence(recycle ? "timeTrial" : "timeUp");
                    }
                });


                // setting the directions here
                // showing directions and various options for this particular assignment
                assignment.directions.show("space", {
                    directions: myJSON.assignment.directions,
                    mistakes: mistakesLine,
                    numProblems: recycle ? null : (numProblems ? numProblems : null),
                    time: timeLimit,
                    timeTrial: recycle ? true : false
                });


                crosshairs = new Crosshairs({ layer, });
                startButton = new StartButton(crosshairs);
                laser.setCrosshairs(crosshairs);


                // adding device tilt detector
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
                        return vocabList.getTargetEnglish();
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



            /*  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  */





            function nextProblem() {


                // NOTE have to do this here, manually, because we're not using an assignment.startButton
                assignment.gambariTimeStart();


                hint.hide();


                // showing the word by default
                setTimeout(hint.show, hint.pauseBeforeShow);


                flyingWordsArray.length = 0;
                problem.unanswered = true;
                problem.hittableOn = true;
                $("#pauseButton").removeClass("pauseButtonClicked").text("ポーズ");
                $(".answerDiv").fadeOut("slow");


                // populating an array from which to pick the incorrect choices
                let choicesArray = vocabList.getChoices(defaults.number_sentakushi);
                choicesArray = tools.shuffle(choicesArray);


                audio.play();


                // creating the flying words
                const randomOffset = Math.random() * (360 / defaults.number_sentakushi);
                for (let i = 0; i < defaults.number_sentakushi; i++) {
                    const japaneseWord = vocabList.getWordFor(choicesArray[i]);
                    const correctOrNot = choicesArray[i] === vocabList.getTargetEnglish();
                    flyingWords.create(japaneseWord, correctOrNot, i, randomOffset);
                }
            }



            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */




            const flyingWords = (function() {


                let animationsArray = [],
                    correctWord = null,
                    textFill;


                function clearAnimations() {
                    animationsArray.forEach(function(thisAnimation) {
                        thisAnimation.stop();
                    });
                    animationsArray.length = 0;
                }


                function createNewFlyingWord(wordText, isCorrect, index, offset) {


                    if (isCorrect) { correctWord = wordText; }


                    const direction = (Math.PI * 2 * index) / defaults.number_sentakushi + offset;
                    const endX = (stageWidth / 2) + (stageWidth / 2 + 100) * Math.sin(direction);
                    const endY = (stageHeight / 2) + (stageHeight / 2 + 100) * Math.cos(direction);
                    const startX = stageWidth / 2 + (endX - stageWidth / 2) * 0.05;
                    const startY = stageHeight / 2 + (endY - stageHeight) * 0.05;
                    const initialScale = 0.01;
                    let timePaused = 0;
                    const fontSize = stageWidth / 5;


                    if (index === 0) { textFill = tools.pickLightColor(); }


                    const flyingWord = new Konva.Text({
                        listening: false,
                        visible: false,
                        scaleX: initialScale,
                        scaleY: initialScale,
                        text: wordText,
                        fontSize: fontSize,
                        fill: textFill
                    }).moveTo(layer);


                    flyingWord.cache().x(startX).y(startY).visible(true);
                    flyingWord.offsetX(flyingWord.width() / 2);
                    flyingWord.offsetY(flyingWord.height() / 2);
                    flyingWord.cache();
                    flyingWord.moveToTop();
                    flyingWord.isCorrectAnswer = isCorrect;
                    flyingWordsArray.push(flyingWord);
                    const easer = tools.easer(2, defaults.wordFlyTime, "easeIn");


                    const anim = new Konva.Animation(function(frame) {


                        if (problem.isPaused) {
                            timePaused += frame.timeDiff;
                            return false;
                        } else {
                            frame.time -= timePaused;
                            timePaused = 0;
                        }


                        // getting the easing position for this frame
                        const easePosition = easer(frame.time);
                        const crosshairsOffsetX = (crosshairs.x() - stageCenterX) * defaults.paralax;
                        const crosshairsOffsetY = (crosshairs.y() - stageCenterY) * defaults.paralax;


                        // setting x, y an scale for each frame
                        flyingWord.setAttrs({
                            x: startX + easePosition * (endX - startX) - crosshairsOffsetX,
                            y: startY + easePosition * (endY - startY) - crosshairsOffsetY,
                            scaleX: initialScale + easePosition * (1 - initialScale),
                            scaleY: initialScale + easePosition * (1 - initialScale)
                        });


                        // if time is up, then stopping the animations and calling "answeredWrong"
                        if (frame.time > defaults.wordFlyTime) {
                            clearAnimations();
                            answeredWrong();
                        }
                    }, layer).start();


                    animationsArray.push(anim);
                }


                return { create: createNewFlyingWord, clearAnimations, };
            }());


            function checkForHit(x, y) {


                if (stage.findOne("#startButton")) {
                    explosionSequence(stageWidth / 2, stageHeight / 2);
                    stage.findOne("#startButton").remove();
                    setTimeout(nextProblem, 2000);
                    return true;
                }


                // cycling through all the flyingWords
                flyingWordsArray.forEach(function(thisWord) {


                    if (!problem.hittableOn) { return; }


                    const isHit = (function() {


                        // saving reference to the current word
                        const word = thisWord;


                        // setting conditions in separate, easy-to-understand variables
                        const overTop = y < word.y() - (word.height() / 2) * word.scaleY() * 2; // adding '*2' to make it easier to hit
                        const underBottom = y > word.y() + (word.height() / 2) * word.scaleY() * 2; // adding '*2' to make it easier to hit
                        const toRight = x > word.x() + (word.width() / 2) * word.scaleX();
                        const toLeft = x < word.x() - (word.width() / 2) * word.scaleX();


                        if (toRight || toLeft || overTop || underBottom) { return false; }


                        return true;
                    }());


                    // doing nothing if it's not a hit...
                    if (!isHit) { return; }

                    /*
                        Beyond this point, it IS a hit
                    */
                    hint.hide();
                    flyingWords.clearAnimations();
                    problem.hittableOn = false; // making sure we can't hit the same word twice


                    // forking off, depending on whether answer is right or wrong
                    if (thisWord.isCorrectAnswer) {
                        explosionSequence(x, y, thisWord);
                        answeredRight();
                    } else if (problem.unanswered) {
                        answeredWrong(thisWord.text());
                    }


                    // removing all the flyingWords
                    flyingWordsArray.forEach(function(thisFlyingWord) {
                        thisFlyingWord.destroy();
                    });
                });
            }


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
                const explosionSize = (function() {
                    if (x && y && flyingWord) {
                        let distanceX = $canvasHolder.width() / 2 - x;
                        let distanceY = $canvasHolder.height() / 2 - y;
                        return (Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2)) * 3) / 200;
                    }
                    return 1;
                }());


                // showing the explosion image, at the x & y coordinates if input, or in dead center, if not
                if (x && y) {
                    explosion.show(x, y, explosionSize);
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
                        x: stageWidth / 2,
                        y: stageHeight / 2,
                        stroke: "red"
                    });

                }
            }


            const answeredRight = (function() {


                let totalRight = 0;


                return function() {


                    problem.unanswered = false;
                    totalRight++;
                    soundEffects.play("explosionSound");
                    vocabList.removeAnsweredWord();
                    $(".dotBlank:first").removeClass("dotBlank").addClass("dotGreen");


                    // if we're not finished yet...
                    if (totalRight < problem.data.length) {
                        setTimeout(nextProblem, 1000); // was 2000

                        // ... but if we ARE finished...
                    } else {


                        // finishing up the problem and sending the results
                        const results = {
                            time_taken: score.time_taken,
                            number_problems: problem.data.length,
                            number_mistakes: score.number_mistakes
                        };


                        // removing html mousemove listeners
                        $("html").off("mousemove");
                        endSequence("allAnswered");
                    }
                };
            }());


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
                        time_taken: score.time_taken,
                        number_problems: problem.data.length, //vocabList.numberOfProblems,
                        number_mistakes: score.number_mistakes,
                        mistaken_vocab: null, //myMistakenVocab,
                        passed: passConditions[result]
                    };


                    assignment.send_results(results, function() {
                        setTimeout(function() {

                            const data = [
                                { label: "時間", value: score.time_taken + " 秒" },
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


            function answeredWrong(wordThatWasHit) {


                hint.hide();
                problem.unanswered = false;
                soundEffects.play("explosionSound");
                score.number_mistakes++;


                // sending mistaken vocabulary items to the user's tangocho
                if (myJSON.assignment.use_user_vocab) {


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
                            nextProblem();
                        });
                    }, 3000);
                }
            }


            function toggleTweenPause(event) {


                event && event.stopPropagation();


                // unpausing, if it's paused...
                if (problem.isPaused) {


                    starsBackground.isPaused = false;
                    crosshairs.show();
                    bgm && bgm.play();
                    laser.enabled = true;
                    $("#pauseButton").removeClass("pauseButtonClicked").text("ポーズ");
                    $playButton.click();
                    pausedMark.hide().draw();

                    // or else PAUSING if it's NOT paused
                } else {

                    // spaceBackgroundNoise && spaceBackgroundNoise.pause();
                    bgm && bgm.pause();
                    crosshairs.hide();
                    layer.draw();
                    laser.enabled = false;
                    starsBackground.isPaused = true;
                    $("#spaceGrayFilter").css("display", "block");
                    $("#pauseButton").addClass("pauseButtonClicked").text("再開");
                    pausedMark.show().draw();
                }

                // toggling problem.isPaused
                problem.isPaused = !problem.isPaused;
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
                        crosshairs: crosshairs,
                        paralax: defaults.paralax,
                        radius: explosionSize * 100 * 0.6,
                        fill: blastColor, // "limegreen",
                        callback: function() {
                            nowExploding = false;
                        }
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
                        stroke: blastColor, //"yellow",
                        crosshairs: crosshairs,
                        paralax: defaults.paralax,
                        callback: function() {
                            nowExploding = false;
                        }
                    });
                }


                return { show, };
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