/* jshint expr: true */

define(
    [
        "assignment",
        "jquery",
        "Konva",
        "tools",
        "konva/WordBlock",
        "konva/slingshotBall",
        "helpers/Timer",
        "helpers/scorebox",
    ],
    function(
        assignment,
        $,
        Konva,
        tools,
        WordBlockFactory,
        slingshotBall,
        Timer,
        myScorebox
    ) {


        const score = tools.score(),
            goalPostSpread = $("#slingshotMain").width() / 10,
            blockDistanceFromTop = 60,
            bgm = assignment.backgroundMusic;


        let numberOfProblems,
            timer,
            audio,
            scorebox,
            mistakesLine,
            timeLimit,
            recycle,
            myJSON,
            wordBlocksArray = [],
            problemNumber = 0,
            sentences = [],
            answers = [];


        assignment.fixedProblemHolder();
        assignment.controlPanel.useBGM();
        bgm.source("https://www.bensound.com/bensound-music/bensound-tenderness.mp3");


        // adjusting the #slingshotMain height for mobile
        if (window.innerWidth < 600) {
            $("#slingshotMain").css({ height: window.innerHeight * 0.5 });
        }

        const stage = new Konva.Stage({
            container: "slingshotMain",
            width: $("#slingshotMain").width(),
            height: $("#slingshotMain").height()
        });
        const staticLayer = new Konva.Layer({ id: "staticLayer" });
        const animLayer = new Konva.Layer({ id: "animLayer" });
        stage.add(staticLayer, animLayer);


        const ball = slingshotBall({
            stage: stage,
            radius: 10,
            layer: null,
            sounds: true,
            hitSoundSource: "/sounds/slingshot/hit.mp3",
            shootSoundSource: "/sounds/slingshot/shoot.mp3",
            ballHome: {
                x: stage.width() / 2,
                y: stage.height() * 0.7
            },
            rubberbandColor: "#666",
            rubberbandWidth: 1.5,
            speed: 15,
            goalPostRadius: tools.isMobile() ? 3 : 4,
            goalPostSpread: tools.isMobile() ? stage.width() / 4 : stage.width() / 8,
            goalPostColor: "navy",
            onHit: checkAnswer,
            onShoot: function() {
                //
            },
            blastCircleShape: "star",
            blastCircleOuterRadius: 50,
            blastCircleInnerRadius: 30,
            blastCircleStroke: "red",
            blastCircleStrokeWidth: 3,
            blastCircleFill: "transparent",
            // bounceOffStageEdge: true
        });


        const ballHome = {
            x: stage.width() / 2,
            y: stage.height() - goalPostSpread - 25
        };


        const wordBlock = (function() {

            // wordBlockFactory as a local variable
            let wordBlockFactory = WordBlockFactory({
                parentLayer: staticLayer,
                stroke: "transparent",
                textSize: stage.width() / 35,
                textFill: "white",
                rotate: null,
                paddingY: 3,
                cornerRadius: 6,
            });

            return function(word, color, isNextButton) {

                // an instance of the wordBlockFactory, instantiated (once!) above
                const group = wordBlockFactory({
                    fill: color,
                    text: word,
                    paddingX: isNextButton ? 45 : 15,
                    name: "wordBlock",
                    rotate: null,
                    id: isNextButton ? "nextButton" : null
                });
                group.setOpacity(isNextButton ? 1 : 0);
                group.text = word;
                group.listening(isNextButton ? true : false);

                // causes the wordBlock, which has been hit, either to disappear or spring back to it starting position
                group.knockAway = function(correctHit) {

                    // doing nothing if the ball is not in its original position
                    if (this.x() !== this.originalX && this.id() !== "nextButton") { return; }

                    const yDiff = (this.y() - ballHome.y) / 4 * ball.impactForce;

                    group.to({
                        opacity: (correctHit ? 0 : 1), // fading to 0 if it's a correct word, else springing back
                        duration: (correctHit ? 0.5 : 0.3),
                        easing: (correctHit ? Konva.Easings.StrongEaseOut : Konva.Easings.EaseOut),
                        x: (function() {
                            if (ball.hitFromDirection === "right") {
                                return group.x() + yDiff / 6;
                            } else if (ball.hitFromDirection === "left") {
                                return group.x() - yDiff / 6;
                            }
                            return group.x();
                        }()),
                        y: (function() {
                            if (ball.hitFromDirection === "top") {
                                return group.y() - yDiff / 6;
                            } else if (ball.hitFromDirection === "bottom") {
                                return group.y() + yDiff / 6;
                            }
                            return group.y();
                        }()),
                        onFinish: function() {
                            if (correctHit) {
                                group.remove();
                                return;
                            }
                            const backTween = new Konva.Tween({
                                node: group,
                                y: group.originalY,
                                x: group.originalX,
                                opacity: 1,
                                duration: (correctHit ? 0.5 : 0.3),
                                easing: (correctHit ? Konva.Easings.StrongEaseIn : Konva.Easings.EaseIn)
                            }).play();
                        }
                    });
                };

                return group;
            };
        }());


        const textHolder = (function() {


            const $textHolder = $("#textHolder");
            const $englishHolder = $("#englishTextHolder");
            const $japaneseHolder = $("#japaneseTextHolder");
            const standardFontSize = $("#textHolder").css("font-size");
            const blankText = " .....";


            // adjusting font size so the whole sentence fits on one line
            function addJapanese(japanese) {
                $japaneseHolder.empty().css({ fontSize: standardFontSize }).append("「" + japanese + "」");
            }


            function initializeEnglish(english) {
                // adding text once, adjusting the font-size, then removing the text...
                $englishHolder.empty().css({ fontSize: standardFontSize }).append(english);
                $englishHolder.empty().append(blankText);
            }


            function initialize(japanese, english) {
                $textHolder.removeClass("answered").css({ opacity: 0 });
                addJapanese(japanese);
                initializeEnglish(english);
                $textHolder.animate({ opacity: 1 }, 500);
            }


            function markAnswered() {
                $textHolder.addClass("answered");
            }


            // private function
            function appendEnglishWord(newWord, isTheLastWord) {
                let thingText = $englishHolder.text().split(blankText)[0];
                $englishHolder.text(thingText + " " + newWord + (isTheLastWord ? "" : blankText));
            }


            return {
                appendEnglishWord,
                initialize,
                markAnswered,
            };
        }());


        // retrieving the data before kicking off the cycle
        assignment.getProblemData(function(data) {

            myJSON = data;

            // setting whether to bounce off the stage edges, depending on what's in myJSON.misc
            // default is no ricocheting (sky backgrounnd)
            ball.bounceOffStageEdge(myJSON.misc.bounceOffStageEdge);
            $("body").addClass(myJSON.misc.bounceOffStageEdge ? "wood-background" : "sky-background");
            tools.addFixedProblemHolder && tools.addFixedProblemHolder();
            timeLimit = myJSON.assignment.time_limit;
            recycle = !!myJSON.assignment.recycle;
            mistakesLine = myJSON.assignment.mistakes_limit;

            // whittling down extra problems
            if (myJSON.number_problems && parseInt(myJSON.number_problems) !== 0) {
                myJSON.number_problems = parseInt(myJSON.number_problems);
                if (myJSON.number_problems < myJSON.problem.length) {
                    tools.whittleDownArray(myJSON.problem, myJSON.number_problems);
                }
            }

            scorebox = myScorebox({
                correctCounter: {
                    numberSegments: myJSON.problem.length,
                    recycle: recycle ? true : false
                },
                wrongCounter: {
                    numberSegments: mistakesLine,
                    recycle: mistakesLine ? false : true
                },
                clock: {
                    duration: timeLimit ? (timeLimit * 1000) : (60 * 1000),
                    labelText: timeLimit ? timeLimit : "0",
                    repeat: true,
                    dotMode: timeLimit ? false : true
                }
            });

            timer = new Timer({
                pauseStart: true,
                countdownFrom: timeLimit,
                warnAt: timeLimit,
                onWarn: function() {
                    //
                },
                eachSecond: function() {
                    let time = tools.secondsToHMS(timer.time(), {
                        useHours: false,
                        minutesTag: "m ",
                        secondsTag: "s",
                        useLeadingZeroes: false
                    });
                    scorebox.clock.label(time);
                },
                onFinish: function() {
                    endSequence(recycle ? "timeTrial" : "timeUp");
                }
            });

            nextProblem(myJSON.problem);
        });

        function nextProblem(problemSet) {


            timer.start();
            scorebox.clock.start();
            score.startTimer();
            problemNumber++;
            answers.length = 0; // emptying the array by setting its length to 0!


            // doing this here, manually, because we're not using an assignment.startButton
            assignment.gambariTimeStart();


            // setting the problems, if passed in as a parameter (from ajax)
            if (problemSet) {
                sentences = problemSet;
                numberOfProblems = sentences.length;
            }


            const sentence = sentences.shift();


            const english = sentence.find(s => tools.isEnglish(s));
            const japanese = sentence.find(s => tools.isJapanese(s));
            textHolder.initialize(japanese, english);


            // breaking the sentence into separate words, and arranging them on the layer
            const words = tools.trimAllElements(english, { removeUnderscores: true });
            const color = tools.pickDarkColor();
            words.forEach(function(thisWord) {
                answers.push(thisWord);
                const word = wordBlock(thisWord, color);
                wordBlocksArray.push(word);
                staticLayer.add(word);
            });


            ball.targets(wordBlocksArray);
            spaceEvenly(wordBlocksArray).inside(stage);
            staticLayer.draw().find(".wordBlock").each(dropBlock);
        }


        function spaceEvenly(array) {

            return {
                inside: function(container) {


                    const spaceBetweenItems = (function() {
                        let combinedWidth = 0;
                        array.map(function(item) {
                            combinedWidth += (typeof item.width === "function") ? item.width() : item.width;
                        });
                        return (container.width() - combinedWidth) / (array.length + 1);
                    }());


                    let arrangedWordsArray = [];
                    let whittleArray = array.slice(); // copying the array


                    while (whittleArray.length > 0) {


                        const block = tools.pickOneFrom(whittleArray, true); // true = removing the element
                        if (arrangedWordsArray.length === 0) {
                            block.x(spaceBetweenItems + block.offsetX());
                        } else {


                            // if there IS a previous word, then positioning this word AFTER it (leaving an appropriate space)
                            let lastWord = arrangedWordsArray[arrangedWordsArray.length - 1];
                            let newX = lastWord.x() + lastWord.offsetX() + spaceBetweenItems + block.offsetX();
                            block.x(newX);
                        }


                        arrangedWordsArray.push(block);
                        block.y(blockDistanceFromTop);


                        // keeping track of their original positions
                        block.originalX = block.x();
                        block.originalY = block.y();
                    }
                }
            };
        }


        function dropBlock(thisBlock, index) {


            // fading in the blocks
            const dropDistance = 20;
            const dropDuration = 0.5;


            setTimeout(function() {
                thisBlock.y(thisBlock.y() - dropDistance);
                thisBlock.to({
                    duration: dropDuration,
                    y: thisBlock.y() + dropDistance,
                    opacity: 1,
                    easing: Konva.Easings.EaseOut
                });
            }, index * 100);
        }


        function checkAnswer(targetHit) { // called from slingshotBall.js (the ball class)


            // if the correct word was hit...
            if (targetHit.text === answers[0]) {
                answers.shift(); // removing the first element of the answers array
                wordBlocksArray.shift(); // removing the wordBlock that was hit from the wordBlocksArray
                targetHit.knockAway(true); // 'true' means 'yes, remove the wordBlock'
                wordBlocksArray.length === 0 ? correctHandler(targetHit) : textHolder.appendEnglishWord(targetHit.text);
                return true;
                // if it's the nextButton
            } else if (targetHit.id() === "nextButton") {


                targetHit.knockAway(true);
                wordBlocksArray.shift();
                nextProblem();


                return true;


                // finally, if it's a wrong hit...
            } else {
                wrongHandler(targetHit);
            }
        }


        function correctHandler(targetHit) {


            scorebox.correctCounter.increment();
            textHolder.appendEnglishWord(targetHit.text, true); // 'true' means it's NOT the last word of the sentence, so add parens after it
            score.number_correct++;


            // if all problems have also been finished...
            if (sentences.length === 0) {
                textHolder.markAnswered();
                endSequence("allAnswered");
                return false;
            } else if (staticLayer.find(".nextButton").length === 0) {


                textHolder.markAnswered();
                let nextButton = wordBlock("Next", "darkgreen", true);
                nextButton.x(stage.width() / 2);
                nextButton.y(stage.height() / 3);
                staticLayer.listening(true);
                staticLayer.add(nextButton).draw();
                wordBlocksArray.push(nextButton);


                // lightening the text
                staticLayer.find(".problemText").opacity(0);
                staticLayer.draw();


                // making the nextButton respond to clicks and touches, as well as being shot
                nextButton.on(tools.clickOrTouch, function() {
                    nextButton.off(tools.clickOrTouch).remove();
                    staticLayer.listening(false);
                    staticLayer.draw();
                    wordBlocksArray.splice(0, 1);
                    nextProblem();
                });
            }
        }


        function wrongHandler(targetHit) {


            scorebox.wrongCounter.increment();
            targetHit.knockAway(false); // 'false' means 'jostle the block, but return it to its place'
            score.number_mistakes++;


            if (mistakesLine && score.number_mistakes >= mistakesLine) { endSequence("tooManyMistakes"); }


            return false;
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
                scorebox && scorebox.clock && scorebox.clock.stop();
                score.stopTimer();
                assignment.gambariTimeStop();
                audio && audio.disable().stopAll();


                // sending off the results
                const results = {
                    time_taken: score.time_taken,
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
                            { label: "時間", value: score.time_taken + " 秒" },
                            { label: "問題数", value: myJSON.number_problems },
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


                        // keeping it between 0 and 1
                        percentCorrect = Math.min(percentCorrect, 1);
                        percentCorrect = Math.max(percentCorrect, 0);
                    }, 1000);
                });


                return true;
            };
        }());
    });