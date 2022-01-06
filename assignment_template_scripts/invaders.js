/* jshint expr: true */

define(
    [
        "assignment",
        "jquery",
        "Konva",
        "tools",
        "helpers/AudioLoader",
        "helpers/SoundEffects",
        "helpers/Timer",
        "konva/blastCircle",
        "konva/invaderBase",
        "konva/shakeStage",
        "konva/starryBackground",
        "konva/ufo",
        "helpers/processSentence"
    ],
    function(
        assignment,
        $,
        Konva,
        tools,
        audioLoader,
        SoundEffects,
        Timer,
        blastCircle,
        invaderBase,
        shakeStage,
        myStarryBackground,
        ufo,
        processSentence
    ) {



        let myJSON,
            problem,
            allProblemsArray,
            remainingProblemsArray,
            currentProblemIndex,
            theCurrentProblem,
            mistakesLine,
            timeLimit,
            recycle,
            timer,
            ufosFactory,
            ufosArray,
            audio,
            nowBetweenProblems = true;


        const isMobile = tools.isMobile();
        const score = tools.score();


        // disabling zoom on double-click
        isMobile && $("#viewport").prop("content", "width=device-width, maximum-scale=1.0, user-scalable=no");


        assignment.controlPanel.useBGM();
        const bgm = assignment.backgroundMusic;
        bgm.source("https://www.bensound.com/bensound-music/bensound-actionable.mp3");


        const stage = new Konva.Stage({
            height: parseInt($("#konva-holder").parent().height()),
            width: parseInt($("#konva-holder").parent().width()),
            container: "konva-holder"
        });
        const stageWidth = stage.width();
        const stageHeight = stage.height();
        const backgroundLayer = new Konva.Layer({ listening: false });
        const animLayer = new Konva.Layer({ listening: false });
        const touchLayer = new Konva.Layer();
        stage.add(backgroundLayer, animLayer, touchLayer);


        const touchRect = new Konva.Rect({
            x: 0,
            y: 0,
            width: stageWidth,
            height: stageHeight,
            fill: "transparent"
        });
        touchLayer.add(touchRect).batchDraw();


        const actionArea = new Konva.Rect({
            x: 0,
            y: 0,
            width: stageWidth,
            height: stageHeight - 10,
            fill: "transparent"
        });


        const targets = (function() {


            const targetClass = "target";
            const basePPS = isMobile ? 60 : 80; // slower on mobile

            let targetDirection = 1; // to be toggled to -1 below


            function addTargets(targets, fly) {
                tools.forceArray(targets).forEach(function(target) {
                    target.name(targetClass);
                    targetDirection *= -1; // flipping the direction on each iteration of the loop
                    const speed = fly ? (basePPS * 0.8) + (Math.random() * basePPS / 5) : 0;
                    const vector = (Math.PI / 2) + (Math.random() * (Math.PI / 16)) - (Math.random() * (Math.PI / 8));
                    target.vector = vector;
                    target.vectorX = Math.sin(vector) * targetDirection;
                    target.vectorY = Math.cos(vector);
                    target.speed = speed;
                });
            }


            function getTargets() {
                return stage.find("." + targetClass);
            }


            function flipDirection() {
                getTargets().forEach(function(target) {
                    target.vectorX *= -1;
                });
            }


            function removeRemaining(callback) {


                base.isHittable = false; // so stray bullets can't hit


                getTargets().forEach(function(target) {
                    target.name(null);
                    target.to({
                        duration: 0.2, // 200ms
                        opacity: 0.3,
                        onFinish: function() {
                            target.removeMe(function() {
                                ufosArray.splice(ufosArray.indexOf(target), 1);
                            }); // removes the corresponding bullets, etc.
                            target.remove(); // removes the actual target
                        }
                    });
                });


                setTimeout(callback, 200);
            }


            return {
                addTargets,
                getTargets,
                flipDirection,
                removeRemaining
            };
        }());


        const startButton = (function() {


            const sb = new Konva.Text({
                x: stageWidth / 2,
                y: stageHeight / 3,
                text: "スタート",
                fill: "lawngreen",
                fontSize: 24,
                padding: 20,
                textDecoration: "underline"
            });

            sb.offsetX(sb.width() / 2);
            sb.offsetY(sb.height() / 2);

            sb.on("click touchend", startButtonHandler);
            sb.onHit = startButtonHandler;


            tools.keydownOnce(13, startButtonHandler);
            targets.addTargets(sb);


            function startButtonHandler(bullet) {


                const sbLayer = sb.getLayer();
                bullet && blastCircle({
                    layer: touchLayer,
                    duration: 1.5,
                    x: sb.x(),
                    y: sb.y(),
                    stroke: "lawngreen",
                    strokeWidth: 3,
                    shape: "star",
                    innerRadius: 30,
                    outerRadius: 50
                });
                sounds && sounds.play("correct");
                sb.onHit = null;
                base.active = true;
                sb.destroy();
                sbLayer && sbLayer.batchDraw();


                setTimeout(nextProblem, bullet ? 1000 : 0);
            }


            return sb;
        }());


        const pauser = tools.pauser({
            element: $("#pause-checkbox"),
            onPause: function() {
                stage.opacity(0.7).batchDraw();
                starryBackground.pause();
                bgm.pause();
            },
            onResume: function() {
                stage.opacity(1).batchDraw();
                starryBackground.resume();
                bgm.play();
            }
        });


        function getEdges(shape) {
            return {
                top: shape.y() - shape.offsetY(),
                bottom: shape.y() + shape.height() - shape.offsetY(),
                left: shape.x() - shape.offsetX(),
                right: shape.x() + shape.width() - shape.offsetX()
            };
        }


        const backgroundRect = new Konva.Rect({
            x: 0,
            y: 0,
            width: stageWidth,
            height: stageHeight,
            fillLinearGradientStartPoint: { x: 0, y: 0 },
            fillLinearGradientEndPoint: { x: 0, y: stageHeight },
            fillLinearGradientColorStops: [0, "#002", 1, "#ccc"]
        });


        const playButton = (function() {


            const group = new Konva.Group({
                width: 50,
                height: 50
            });


            const playButtonBackground = new Konva.Rect({
                fill: "transparent",
                width: 50,
                height: 50
            });


            const buttonIcon = new Konva.Line({
                x: 15,
                y: 15,
                points: [0, 0, 0, 20, 15, 10],
                stroke: "white",
                strokeWidth: 6,
                lineJoin: "round",
                fill: "white",
                closed: true
            });


            group.add(playButtonBackground, buttonIcon);
            group.x(stageWidth - group.width());
            group.on("click touchend", function() {
                audio && audio.play(theCurrentProblem.find(item => tools.isEnglish(item)));
            });


            function remove() {
                const layer = group.getLayer(); // saving reference to layer so we can reference it after destroying it below
                group.off("click");
                group.destroy();
                layer.batchDraw();
            }


            function nowPlaying() {
                buttonIcon.fill("#aaa").stroke("#aaa");
                touchLayer.batchDraw();
            }


            function nowPaused() {
                buttonIcon.fill("white").stroke("white");
                touchLayer.batchDraw();
            }


            return {
                remove,
                nowPlaying,
                nowPaused,
                icon: group,
            };
        }());


        backgroundLayer.add(backgroundRect).batchDraw();
        animLayer.add(actionArea).batchDraw();
        touchLayer.add(startButton, playButton.icon).batchDraw(); //, yarikata.yarikataText


        const starryBackground = myStarryBackground({
            layer: backgroundLayer,
            pauser: pauser
        });


        const sounds = new SoundEffects({
            container: $("#sounds-stuff"),
            sounds: {
                shoot: "/sounds/invaders/shoot.mp3",
                wrong: "/sounds/invaders/wrongSound.mp3",
                correct: "/sounds/invaders/correctSound.mp3",
                base_hit: "/sounds/invaders/base_hit.mp3",
                ufo_fire: "/sounds/invaders/ufo_fire.mp3",
                tick: "/sounds/tick.mp3",
                shu: "/sounds/invaders/shu.mp3"
            },
            checkBoxTextAlign: "left",
            playThisOnCheckboxCheck: "tick"
        });


        const textHolder = (function() {


            const buffer = 5;
            const fontSize = stageWidth < 400 ? 14 : 24;
            const japaneseFill = "rgb(154,252,30)";
            const englishFill = "yellow";
            const ellipsis = " ...";


            let englishSentence = "";
            let japText, engText;


            function clearText() {
                japText && japText.destroy();
                engText && engText.destroy();
                englishSentence = "";
                animLayer.batchDraw();
            }


            function appendEllipsis() {
                appendWord(ellipsis);
            }


            function setJapanese(text) {
                clearText();
                japText = new Konva.Text({
                    width: stageWidth * 0.9,
                    x: stageWidth * 0.05,
                    y: buffer,
                    text: text,
                    align: "center",
                    fontSize: fontSize,
                    fill: japaneseFill
                });
                backgroundLayer.add(japText).batchDraw();
            }


            function appendWord(text) {
                englishSentence = englishSentence.replace(ellipsis, "");
                englishSentence += text;
                engText && engText.destroy();
                let japTextHeight = japText ? (japText.y() + japText.height()) : null;
                engText = new Konva.Text({
                    y: japTextHeight + buffer,
                    width: stageWidth * 0.9,
                    x: stageWidth * 0.05,
                    align: "center",
                    fontSize: fontSize,
                    fill: englishFill,
                    text: englishSentence
                });
                backgroundLayer.add(engText).batchDraw();
            }


            return {
                setJapanese,
                appendWord,
                clearText,
                appendEllipsis,
            };
        }());


        function UFOsFactory() {


            const threshhold = {
                top: 50,
                bottom: (stageHeight * 0.50)
            };
            let targetAnimation;


            function spaceEvenly(arrayOfObjects) {


                const blockSize = stageWidth / arrayOfObjects.length;
                const buffer = blockSize / 2;


                arrayOfObjects.forEach(function(item, index) {
                    const startingY = threshhold.top + (Math.random() * (threshhold.bottom - threshhold.top));
                    item.y(startingY).x(buffer + (blockSize * index));
                });


                animLayer.batchDraw();
            }


            function makeNew(p) {


                let settings = $.extend({
                    words: "",
                    spaceEvenly: true,
                    randomize: true,
                    layer: animLayer,
                    doRemoveUnderscores: true,
                    fontSize: isMobile ? 12 : 18,
                    bulletTarget: base,
                    pauser: pauser,
                    sounds: sounds,
                    ufoBodyColor: tools.pickLightColor(),
                }, p || {});


                let arrayOfUFOs = [];
                let flock = assignment.processSentenceForNarabekae(settings.words);


                flock.all.forEach(function(text) {


                    let newUFO = ufo({
                        layer: settings.layer,
                        text: settings.doRemoveUnderscores ? text.replace(/\_/g, " ") : text,
                        fontSize: settings.fontSize,
                        ufoBodyColor: settings.ufoBodyColor,
                        ufoBodyGradient: false,
                        bulletTarget: settings.bulletTarget,
                        aimOffsetX: settings.bulletTarget.width / 2,
                        pauser: settings.pauser,
                        sounds: settings.sounds
                    });


                    newUFO.dummy = flock.dummy.indexOf(text) === -1 ? false : true;


                    newUFO.badHit = function() {
                        blastCircle({
                            layer: animLayer,
                            x: this.x(),
                            y: this.y() + this.height(),
                            duration: 2,
                            stroke: "white",
                            radius: 100,
                            strokeWidth: 6,
                            squishY: true
                        });
                        base.isHittable && this.ufoFire();
                    };


                    arrayOfUFOs.push(newUFO);
                });


                problem.choices.length = 0;
                problem.choices = arrayOfUFOs.slice();
                arrayOfUFOs = tools.shuffle(arrayOfUFOs);


                settings.spaceEvenly && spaceEvenly(arrayOfUFOs);


                arrayOfUFOs.forEach(function(thisUFO, index) {


                    animLayer.add(thisUFO);
                    targets.addTargets(thisUFO, true);


                    thisUFO.cache().show({
                        delay: index * 100,
                        layer: animLayer // needed for the blastCircle(s)
                    });
                });


                animLayer.batchDraw();


                return arrayOfUFOs;
            }


            function flyAnimation(startOrStop) {


                if (startOrStop === "stop") {
                    targetAnimation && targetAnimation.stop && targetAnimation.stop();
                    return;
                }


                targetAnimation = new Konva.Animation(moveTargets, animLayer);
                targetAnimation.start();


                function moveTargets(frame) {


                    let allTargets = targets.getTargets();
                    if (pauser.isPaused() || allTargets.length === 0) { return false; }


                    allTargets.each(function(target) {


                        // not moving the target if not "isFlying"
                        // NOTE this starts the UFO flying only AFTER the opening blastCircle animation
                        // has finished!
                        if (!target.isFlying) { return false; }


                        const amountChange = (frame.timeDiff / 1000) * target.speed;
                        let newX = target.x() + target.vectorX * amountChange;
                        let newY = target.y() + target.vectorY * amountChange;


                        // bouncing off top, bottom and sides
                        if (newY < threshhold.top || newY > threshhold.bottom) {
                            target.vectorY *= -1;
                        }


                        if (newX < 0 || newX > stageWidth) {
                            target.vectorX *= -1;
                        }


                        newX = (newX < 0) ? 0 : (newX > stageWidth ? stageWidth : newX);
                        newY = (newY < threshhold.top) ? threshhold.top : (newY > threshhold.bottom ? threshhold.bottom : newY);


                        target.x(newX);
                        target.y(newY);
                    });
                }
            }


            this.makeNew = makeNew;
            this.spaceEvenly = spaceEvenly;
            this.flyAnimation = flyAnimation;
        }


        const bulletFactory = (function() {


            const bulletIdentifier = "bullet";
            const clippingRegion = new Konva.Group({
                clip: {
                    x: 0,
                    y: 0,
                    width: stageWidth,
                    height: stageHeight - 30 // base height
                }
            });


            animLayer.add(clippingRegion);


            function destroyAllBullets() {
                stage.find("." + bulletIdentifier).each(function(bullet) {
                    bullet.removeBullet();
                });
            }


            function removeBullet(bullet) {
                bullet.flyAnim && bullet.flyAnim.stop();
                bullet.remove();
            }


            const newBullet = (function() {

                const bulletLength = 60;
                const bulletWidth = 2;

                const bulletPrototype = new Konva.Rect({
                    fillLinearGradientStartPoint: { x: 0, y: 0 },
                    fillLinearGradientEndPoint: { x: 0, y: bulletLength },
                    fillLinearGradientColorStops: [
                            0, "yellow",
                            0.05, "yellow",
                            0.05, "rgba(255, 153, 0, 1)",
                            1, "rgba(255, 153, 0, 0)"
                        ],
                    width: bulletWidth,
                    height: bulletLength,
                    cornerRadius: 100,
                    name: bulletIdentifier
                });


                return function(x, y, params) {


                    params = $.extend({
                        armed: true,
                        pixelsPerSecond: 500,
                    }, params || {});


                    const pps = params.pixelsPerSecond;
                    const bullet = bulletPrototype.clone();


                    sounds.play("shoot");


                    clippingRegion.add(bullet);


                    bullet.x(x - 1).y(y).cache();
                    bullet.flyAnim = new Konva.Animation(moveBullet, animLayer);
                    bullet.flyAnim.start();


                    function moveBullet(frame) {
                        if (pauser.isPaused()) { return false; }
                        const totalDistance = (frame.timeDiff / 1000) * pps;
                        bullet.y(bullet.y() - totalDistance);
                        params.armed && checkForBulletHit({
                            bullet: bullet,
                            onHit: problem ? problem.checkAnswer : null
                        });


                        // completely removing the bullet once offstage
                        if (bullet.y() + bulletLength < 0) {
                            bullet.flyAnim.stop();
                            bullet.destroy();
                        }
                    }
                };
            }());


            return {
                newBullet,
                destroyAllBullets,
                removeBullet,
            };
        }());


        function Problem(params) {


            params = params || {};


            const that = this;
            const correctChoice = params.correctChoice ? params.correctChoice : null;


            function getCorrectAnswer() {
                if (that.answerMethod === "firstInLine") {
                    return that.choices[0];
                } else {
                    return correctChoice;
                }
            }


            function checkAnswer(bullet, hitTarget) {
                if (hitTarget.onHit) {
                    hitTarget.onHit(bullet, hitTarget);
                } else if (hitTarget === getCorrectAnswer()) {
                    correctHandler(hitTarget);
                } else {
                    wrongHandler(hitTarget);
                }
            }


            this.answerMethod = params.answerMethod || "firstInLine";
            this.checkAnswer = checkAnswer;
            this.choices = (function() {
                if (Array.isArray(params.choiceArray)) {
                    return params.choices;
                }
                return params.choices.split(" ");
            }());
        }


        function correctHandler(hitTarget) {


            hitTarget.removeMe && hitTarget.removeMe();
            problem.choices.shift();
            sounds.play("correct");
            textHolder.appendWord(" " + hitTarget.text);
            blastCircle({
                layer: animLayer,
                x: hitTarget.x(),
                y: hitTarget.y(),
                radius: 70, // NEW TEST using 3 concentric circles instead of a star
                stroke: "yellow",
                numCircles: 3,
                blastInterval: 100,
            });


            const numberDummies = problem.choices.filter(function(thisChoice) {
                return thisChoice.dummy === true;
            }).length;


            // returning here if there are still valid choices left
            if (problem.choices.length !== numberDummies) {
                textHolder.appendEllipsis();
                return true;
            }


            // BEYOND THIS POINT, only the dummie choices remain, so removing and ending
            targets.removeRemaining(function() {


                nowBetweenProblems = true;


                remainingProblemsArray.splice(currentProblemIndex, 1);
                score.number_correct++;
                ufosFactory.flyAnimation("stop");


                // exiting here if this was the last problem
                if (!remainingProblemsArray.length) {
                    endSequence("allAnswered");
                    return;
                }


                // NEW TEST adding "autoAdvance" to automatically proceed to
                // the next problem (no "nextButton")
                if (myJSON.misc && myJSON.misc.autoAdvance) {
                    setTimeout(nextProblem, 1);
                    return;
                }


                const nextButton = new Konva.Text({
                    text: "Next",
                    fontSize: 36,
                    fill: "yellow",
                    x: stageWidth / 2,
                    y: stageHeight / 3,
                    opacity: 0
                });
                nextButton.offsetX(nextButton.width() / 2);
                nextButton.offsetY(nextButton.height() / 2);
                nextButton.onHit = nextButtonHandler;


                tools.keydownOnce([13], nextButtonHandler);


                function nextButtonHandler(bullet) {
                    nextButton.onHit = null;
                    sounds.play("correct");
                    blastCircle({
                        layer: touchLayer,
                        duration: 1.5,
                        x: nextButton.x(),
                        y: nextButton.y(),
                        stroke: "lawngreen",
                        strokeWidth: 3,
                        shape: "star",
                        innerRadius: 30,
                        outerRadius: 50
                    });
                    nextButton.destroy();
                    setTimeout(nextProblem, bullet ? 2000 : 0);
                }


                nextButton.on("click touchend", nextButtonHandler);
                targets.addTargets(nextButton);
                touchLayer.add(nextButton);
                nextButton.to({ duration: 0.6, opacity: 1 });
            });


            return true;
        }


        function wrongHandler(hitTarget) {


            shakeStage({ stage: stage, shakeAmplitude: 4 });
            hitTarget.badHit && hitTarget.badHit();
            score.number_mistakes += 1;
            sounds.play("wrong");
            targets.flipDirection();


            if (mistakesLine && score.number_mistakes > mistakesLine) {
                endSequence("tooManyMistakes");
            }
        }


        function checkForBulletHit(obj) {


            const bullet = obj.bullet;
            const x = bullet.x();
            const y = bullet.y();


            targets.getTargets().some(function(target) {


                const edge = getEdges(target);
                if (x < edge.left || x > edge.right || y < edge.top || y > edge.bottom) { return false; }


                // if we're here, it must be a hit
                obj.onHit && obj.onHit(bullet, target);
                target.onHit && target.onHit(bullet, target);
                bullet.flyAnim.stop();
                bullet.destroy();


                return true; // return true to exit the loop
            });
        }


        const problemNumber = (function() {


            const joiner = " of ";
            const text = new Konva.Text({
                fontSize: 16,
                fill: "yellow",
                fontFamily: "Arial",
                text: "0",
                listening: false
            });


            center(text);
            text.x(10).y(stageHeight - 5);
            backgroundLayer.add(text).batchDraw();


            function center(obj) {
                obj.offsetY(obj.height());
            }


            function increment(current, total) {
                text.text((current) + joiner + (total)); // parens necessary on iOS!
                center(text);
                text.getLayer().batchDraw();
            }


            return {
                increment,
            };
        }());


        const clock = (function() {


            const text = new Konva.Text({
                fontSize: 16,
                fill: "white",
                fontFamily: "Arial",
                text: "0m 0s",
                listening: false
            });


            function centerText(text) {
                text.offsetX(text.width());
                text.offsetY(text.height());
                text.x(stageWidth - 10);
                text.y(stageHeight - 5);
                text.cache();
                text.getLayer().batchDraw();
            }
            backgroundLayer.add(text).batchDraw();
            centerText(text);


            function update(seconds) {
                if (pauser.isPaused()) { return false; }
                let formattedTime = tools.secondsToHMS(seconds, {
                    hoursTag: "h ",
                    minutesTag: "m ",
                    secondsTag: "s",
                    useLeadingZeroes: false
                });
                text.text(formattedTime);
                centerText(text);
            }


            return {
                update,
            };
        }());


        const base = invaderBase({
            layer: animLayer,
            actionArea: actionArea,
            touchRect: touchRect,
            pauser: pauser,
            isMobile: isMobile,
            bulletFactory: bulletFactory,
            sounds: sounds
        });


        // needed because the
        animLayer.batchDraw();




        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * */




        assignment.getProblemData(function(d) {


            myJSON = d;
            timeLimit = myJSON.assignment.time_limit;
            recycle = myJSON.assignment.recycle;
            mistakesLine = myJSON.assignment.mistakes_limit;


            // instantiating the timer
            timer = new Timer({
                pauseStart: true,
                countdownFrom: timeLimit,
                warnAt: timeLimit,
                onWarn: function() {
                    //
                },
                eachSecond: function() {
                    clock.update(timer.time());
                },
                onFinish: function() {
                    endSequence(recycle ? "timeTrial" : "timeUp");
                }
            });


            // showing directions and various options for this particular assignment
            assignment.directions.show(myJSON.useAudio ? "invaders_spoken" : "invaders_written", {
                directions: myJSON.assignment.directions,
                mistakes: mistakesLine,
                numProblems: myJSON.problem.length,
                time: myJSON.assignment.time_limit,
                timeTrial: false
            });


            if (myJSON.useAudio) {
                audio = audioLoader({
                    audioFiles: myJSON.audioFiles, // required
                    wordsList: myJSON.problem.map(theCurrentProblem => {
                        let englishSentence = theCurrentProblem.find(item => tools.isEnglish(item));
                        return tools.removeExtraWhiteSpace(englishSentence);
                    }),
                    // onAllLoaded: prepareProblems,
                    preloadAudio: true, // was false
                    onReady: prepareProblems,
                    onPlay: function() {
                        playButton && playButton.nowPlaying();
                    },
                    onEnded: function() {
                        playButton && playButton.nowPaused();
                    },
                    onLoadError: function() {
                        console.log("Failed to load sounds!");
                    }
                });
            } else {
                playButton && playButton.remove();
                stage.batchDraw();
                prepareProblems();
            }
        });


        function prepareProblems() {
            allProblemsArray = myJSON.problem.concat();
            remainingProblemsArray = allProblemsArray.concat();
            ufosFactory = new UFOsFactory();
        }


        function nextProblem() {


            // making sure the problem isn't called twice in a row
            if (!nowBetweenProblems) { return false; }
            nowBetweenProblems = false;


            currentProblemIndex = tools.pickIntFrom(remainingProblemsArray);
            theCurrentProblem = remainingProblemsArray[currentProblemIndex];
            audio && audio.stopAll();
            playButton.nowPaused();
            base.isHittable = true; // set this to "false" after the problem has finished, to prevent stray bullet hits


            timer.start();
            score.startTimer();
            textHolder.clearText();


            // doing this here, manually, because we're not using an assignment.startButton
            assignment.gambariTimeStart();


            const japanese = theCurrentProblem[myJSON.indexOfJapanese];
            problemNumber.increment((score.number_correct + 1), allProblemsArray.length);
            japanese && textHolder.setJapanese(japanese);
            audio && audio.play(theCurrentProblem.find(item => tools.isEnglish(item)));
            problem = new Problem({
                choices: theCurrentProblem.find(item => tools.isJapanese(item)),
            });


            // NEW TEST replacing [some words] with a single ¥-symbol
            let sentence = theCurrentProblem[myJSON.indexOfSentakushi];
            sentence = tools.removeExtraWhiteSpace(sentence);
            sentence = sentence.replace("[", "¥ ").replace("]", "");


            ufosArray = ufosFactory.makeNew({ words: sentence });
            ufosFactory.flyAnimation("start");
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


                if (hasBeenCalled) { return; }


                hasBeenCalled = true;
                timer && timer.stop();
                score && score.stopTimer();
                assignment.gambariTimeStop();
                audio && audio.disable().stopAll();


                // sending off the results
                const results = {
                    time_taken: score.time_taken(),
                    number_problems: myJSON.problem.length,
                    number_mistakes: score.number_mistakes,
                    passed: passConditions[result]
                };


                // adding the 'endScreenHolder' div after a momentary pause
                // sending the results object, and a callback
                assignment.send_results(results, function() {
                    setTimeout(function() {


                        // passing in the object to put the assignment_results stuff into, and the data to display
                        const data = [
                            { label: "時間", value: score.time_taken() + " 秒" },
                            { label: "問題数", value: results.number_problems ? results.number_problems + " 問" : "-" },
                            { label: "正解", value: score.number_correct + " 問" },
                            { label: "間違い", value: score.number_mistakes + " 問" }
                        ];


                        assignment.showAssignmentResults({
                            container: $("#mainProblemsHolder"),
                            result: result,
                            data: data
                        });


                        // calculating the percent correct
                        let percentCorrect = results.number_problems / score.number_guesses;
                        percentCorrect = Math.min(percentCorrect, 1);
                        percentCorrect = Math.max(percentCorrect, 0);
                    }, 1000);
                });


                return true;
            };
        }());


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


        !isMobile && $("#sousa-houhou").show();


        // displaying the #shoot-button on mobile
        isMobile && $("#shoot-button").css("display", "block")
            .on("touchstart", base.fire.startShooting)
            .on("touchend", base.fire.stopShooting);


        isMobile && $("#pause-button").show();
    });