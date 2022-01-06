/* jshint expr: true */

define(
    [
        "jquery",
        "assignment",
        "tools",
        "helpers/problemsAndChoicesList",
        "helpers/AudioLoader",
        "helpers/SoundEffects",
        "helpers/Timer",
        "helpers/scorebox",
        "helpers/shakeElement",
        "helpers/tangocho",
        "TweenMax",
        "TweenMax_CSSPlugin",
        "TweenMax_EasePack",
    ],
    function(
        $,
        assignment,
        tools,
        myVocabList,
        AudioLoader,
        SoundEffects,
        Timer,
        myScorebox,
        shakeElement,
        tangocho,
        TweenMax
    ) {


        let mistakesLine,
            timeLimit,
            recycle,
            audio,
            timer,
            myJSON,
            scorebox,
            problemNowActive = false,
            vocabList = {},
            sentencesMode = false,
            autoShowHint = false,
            autoAdvance = false,
            score = tools.score({
                number_guesses: 0
            });

        const $startButton = $("#start-button"),
            $playButton = $("#play-button");


        const newChoice = (function() {


            const $choiceMaster = $(".choice-holder.my-template").detach().removeClass("my-template");
            const revertDuration = 100;
            const dragStartClass = "now-dragging mousedown";
            const dragStopClass = "now-dragging mousedown";


            return function(problem, japaneseWord, englishWord, index, isSentencesMode) {


                englishWord = tools.getIdealAnswer(englishWord);


                const $choiceHolder = $choiceMaster.clone().draggable({
                    revert: true,
                    revertDuration: revertDuration,
                    stack: ".choice-holder",
                    axis: "y",
                    containment: "#choices-bounds",
                    start: function() {
                        $(this).addClass(dragStartClass);
                    },
                    stop: function() {
                        $(this).removeClass(dragStopClass);
                    }
                }).addClass(isSentencesMode ? "align-left" : "").css({
                    height: (90 / problem.choices.length) + "%"
                }).data({
                    japanese: japaneseWord,
                    english: englishWord,
                    isCorrect: index === problem.indexOfCorrectAnswer,
                });


                $choiceHolder.find(".text-holder").text(japaneseWord);


                return $choiceHolder;
            };
        }());


        const dropZone = (function() {


            const $textHolder = $("#drop-here-message");
            const $dropZone = $("#drop-zone");
            const textHolderFontSize = $textHolder.css("fontSize");
            const originalText = $textHolder.text();
            const height = parseInt($("#choices-bounds").height() / 4);


            let nextButtonIsActive = false;


            $dropZone.click(function() {
                $playButton.click();
            }).droppable({
                accept: ".active-choice",
                drop: function(event, ui) {
                    checkAnswer($(ui.draggable));
                }
            }).css({ height: height * 0.9 });


            function showHint() {
                const hintText = tools.getIdealAnswer(vocabList.getTargetEnglish());
                $textHolder.text(hintText).addClass("hint-showing");
                tools.shrinkToFit($textHolder, $dropZone);
            }


            function restore() {
                nextButtonIsActive = false;
                $dropZone.removeClass("next-button-mode");
                $dropZone.off("click").on("click", function() {
                    $playButton.click();
                });
                $textHolder.text(originalText).removeClass("hint-showing");
                $textHolder.css({
                    fontSize: textHolderFontSize
                });
            }


            function setHeight() {
                restore();
                $dropZone.css({ height: $(".choice-holder").height() });
            }


            function nextButtonMode(d) {
                d = d || {};
                nextButtonIsActive = true;
                setTimeout(function() {
                    $dropZone.addClass("next-button-mode");
                    $dropZone.off("click").on("click", nextProblem);
                }, d.delay);
            }


            function isNextButtonMode() {
                return nextButtonIsActive;
            }


            return {
                showHint,
                restore,
                nextButtonMode,
                isNextButtonMode,
                setHeight
            };
        }());


        const sounds = new SoundEffects({
            sounds: {
                correct: "/sounds/vocabulary/tick.mp3",
                wrong: "/sounds/vocabulary/wrongSound.mp3",
                tick: "/sounds/vocabulary/tick.mp3"
            },
            playThisOnCheckboxCheck: "tick"
        });


        const hintButton = (function() {


            const $hintButton = $("#hint-button");
            const originalText = $hintButton.text();


            let isDisabled = false;
            let numTimesUsed = 0;


            autoShowHint && $hintButton.remove();


            $hintButton.click(hintButtonHandler);


            function hintButtonHandler() {
                if (problemNowActive && !isDisabled) {
                    numTimesUsed++;
                    dropZone.showHint();
                    $hintButton.addClass("hint-showing");
                }
            }


            function enable() {
                if (autoShowHint) { return null; }
                $hintButton.text(originalText).removeClass("hint-showing");
                dropZone.restore();
                isDisabled = false;
            }


            function getNumTimesUsed() {
                return numTimesUsed;
            }


            return {
                enable,
                getNumTimesUsed,
                trigger: hintButtonHandler
            };
        }());


        function wireUpStartButton() {
            assignment.startButton({
                button: $startButton,
                buttonText: "スタート",
                buttonAlternate: $("#frame"),
                callback: function() {
                    timer.start();
                    score.startTimer();
                    scorebox.clock.start();
                    wireUpKeyboard(); // doing this here, so it doesn't collide with the startButton
                    setTimeout(function() {
                        nextProblem();
                    }, 200);
                }
            });
            $("body").addClass("all-audio-loaded");
        }


        assignment.getProblemData(function(d) {


            myJSON = d;
            myJSON.number_sentakushi = myJSON.number_sentakushi || 3;
            timeLimit = myJSON.assignment.time_limit;
            recycle = myJSON.assignment.recycle;
            mistakesLine = myJSON.assignment.mistakes_limit;
            assignment.controlPanel.useVoices();
            wireUpStartButton();


            // myJSON.problem = myJSON.problem.map(pair => {
            //     return pair.map(item => {
            //         return tools.isEnglish(item) ? tools.getIdealAnswer(item) : item;
            //     });
            // });


            assignment.removeProblemsWithoutAudio(myJSON);


            if (myJSON.number_problems) {
                myJSON.number_problems = parseInt(myJSON.number_problems);
                if (myJSON.number_problems < myJSON.problem.length) {
                    tools.whittleDownArray(myJSON.problem, myJSON.number_problems);
                }
            }


            const numProblems = myJSON.problem.length;


            scorebox = myScorebox({
                correctCounter: {
                    numberSegments: myJSON.problem.length,
                    recycle: recycle ? true : false,
                    fill: "blue"
                },
                wrongCounter: {
                    numberSegments: mistakesLine,
                    recycle: mistakesLine ? false : true,
                    fill: "red"
                },
                clock: {
                    duration: timeLimit ? (timeLimit * 1000) : 60 * 1000,
                    labelText: timeLimit ? timeLimit : "0",
                    repeat: true,
                    dotMode: timeLimit ? false : true,
                    labelFill: "darkorange",
                    backgroundColor: "darkorange"
                }
            });


            timer = new Timer({
                pauseStart: true,
                countdownFrom: timeLimit,
                // onWarn: function() {
                //     //
                // },
                eachSecond: function() {
                    const time = tools.secondsToHMS(timer.time(), {
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


            assignment.directions.show("vocabulary", {
                directions: myJSON.assignment.directions,
                mistakes: mistakesLine,
                numProblems: recycle ? null : numProblems,
                time: timeLimit,
                timeTrial: recycle ? true : false
            });


            vocabList = myVocabList({
                problems: myJSON.problem,
                number_problems: numProblems,
                audioFiles: myJSON.audioFiles,
                numberSentakushi: myJSON.number_sentakushi || 3,
                recycleProblems: recycle ? true : false // optionally recycling words, so they never run out
            });


            sentencesMode = myJSON.misc.hasOwnProperty("sentencesMode") ?
                myJSON.misc.sentencesMode :
                vocabList.isSentences;


            // setting autoAdvance to "true" for vocabulary and "false" for sentencesMode,
            // or whatever is in myJSON.misc.autoAdvance
            if (myJSON.misc.hasOwnProperty("autoAdvance")) {
                autoAdvance = myJSON.misc.autoAdvance;
            } else {
                autoAdvance = sentencesMode ? false : true;
            }


            // setting autoAdvance to "true" for vocabulary and "false" for sentencesMode,
            // or whatever is in myJSON.misc.autoAdvance
            if (myJSON.misc.autoShowHint) {
                autoShowHint = myJSON.misc.autoShowHint;
            }


            audio = AudioLoader({
                audioFiles: myJSON.audioFiles, // NOTE not all of these words may be loaded; only the ones that are in getRemainingWords, below
                wordsList: vocabList.getRemainingWords(),
                playButton: "playIcon", // passing in the button on which to show "play" and "pause" symbols
                onReady: wireUpStartButton, // when all have loaded (if preloading) or immediately
                getWordToPlay: function() { // (optional) function to retrieve which word to play next, so we don't have to spoon-feed the word in
                    return vocabList.getTargetEnglish();
                },
                onPlay: function() {
                    $(".play-button-icon").addClass("now-playing");
                    problemNowActive = true;
                },
                onEnded: function() {
                    $(".play-button-icon").removeClass("now-playing");
                },
            });


            assignment.fixedProblemHolder({
                onSlideUp: function() {
                    $("#directions").hide();
                },
                onSlideDown: function() {
                    $("#directions").show();
                }
            });
        });


        function nextProblem() {


            $(".carriage.old").remove();
            const $carriageOld = $("<div class='carriage old'></div>").appendTo("#choices-holder");
            $(".choice-holder").removeClass("active-choice").appendTo($carriageOld);
            const problem = vocabList.pickRandomProblem();


            hintButton.enable();


            TweenMax.to($carriageOld, 0.75, {
                left: "110%",
                onComplete: function() {
                    $carriageOld.remove();
                }
            });


            $(".carriage.new").remove();
            const $carriageNew = $("<div class='carriage new'/>").appendTo("#choices-holder");


            problem.choices.forEach(function(choice, index) {


                const japaneseWord = choice;
                const englishWord = vocabList.getEnglishFor(choice);
                const $choiceHolder = newChoice(problem, japaneseWord, englishWord, index, sentencesMode);


                $carriageNew.append($choiceHolder);


                TweenMax.to($carriageNew, 0.75, {
                    left: "0%"
                });
            });


            dropZone.setHeight();


            autoShowHint && dropZone.showHint();


            setTimeout(function() {
                problemNowActive = true;
                audio.play();
            }, 500);
        }


        function checkAnswer($droppedObject) {
            if (!problemNowActive) return false;
            score.number_guesses++;
            const divider = sentencesMode ? "<br>" : " = ";
            const $textHolder = $droppedObject.find(".text-holder");
            $textHolder.html($droppedObject.data("japanese") + divider + $droppedObject.data("english"));
            tools.shrinkToFit($textHolder, $droppedObject);
            $droppedObject.data("isCorrect") ? rightAnswerHandler($droppedObject) : wrongAnswerHandler($droppedObject);
        }


        function rightAnswerHandler($droppedObject) {


            scorebox.correctCounter.increment();
            score.number_correct++;
            audio.stopAll();
            problemNowActive = false;
            sounds.play("correct");
            $droppedObject.addClass("answered-correct");
            vocabList.removeCurrentProblem();
            $(".choice-holder").draggable("disable");


            if (vocabList.getNumberRemaining() <= 0) {
                endSequence("allAnswered");
                return;
            }


            if (!autoAdvance) {
                dropZone.nextButtonMode({ delay: 0 });
            } else {
                setTimeout(nextProblem, 500);
            }
        }


        function wrongAnswerHandler($droppedObject) {


            sounds.play("wrong");
            shakeElement($("#choices-bounds"));
            score.number_mistakes += 1;
            scorebox.wrongCounter.increment();


            // sending mistaken vocabulary items to the user's tangocho
            const englishWord1 = tools.getIdealAnswer($droppedObject.data("english"));
            const japaneseWord1 = $droppedObject.data("japanese");
            const englishWord2 = tools.getIdealAnswer(vocabList.getTargetEnglish()); // can't use englishWord1, 'cause the real English may not be suitable for dsiplaying
            const japaneseWord2 = vocabList.getJapaneseFor(vocabList.getTargetEnglish());
            if (myJSON.assignment.use_user_vocab) {
                tangocho.add({ english: englishWord1, japanese: japaneseWord1 });
                tangocho.add({ english: englishWord2, japanese: japaneseWord2 });
            }


            $droppedObject.addClass("answered-wrong");


            if (mistakesLine && score.number_mistakes >= mistakesLine) {
                endSequence("tooManyMistakes");
                return;
            }
        }



        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */



        const endSequence = (function() {


            let hasBeenCalled = false;


            const passConditions = {
                tooManyMistakes: false,
                timeUp: false,
                allAnswered: true,
                timeTrial: true
            };


            return function(result) {


                if (hasBeenCalled) return;


                hasBeenCalled = true;
                timer && timer.stop();
                scorebox.clock && scorebox.clock.stop();
                score.stopTimer();
                assignment.gambariTimeStop();
                audio.disable().stopAll();
                tools.clearKeyEvents;


                const results = {
                    time_taken: score.time_taken(),
                    number_problems: vocabList.numberOfProblems,
                    number_mistakes: score.number_mistakes,
                    passed: passConditions[result]
                };


                assignment.send_results(results, function() {
                    setTimeout(function() {


                        // passing in the object to put the assignment_results stuff into, and the data to display
                        const data = [
                            { label: "時間", value: results.time_taken + " 秒" },
                            { label: "問題数", value: results.number_problems ? results.number_problems + " 問" : "-" },
                            { label: "正解", value: score.number_correct + " 問" },
                            { label: "間違い", value: score.number_mistakes + " 問" }
                        ];


                        // adding mistaken vocabulary items to be displayed on the assignmentResults
                        const wordsToReview = tools.showMistakenVocab(tangocho.getItems());
                        if (wordsToReview && myJSON.assignment.use_user_vocab) {
                            data.push({
                                label: "復習しよう！",
                                value: wordsToReview
                            });
                        }


                        assignment.showAssignmentResults({
                            container: $("#mainProblemsHolder"),
                            result: result,
                            data: data
                        });


                        let percentCorrect = results.number_problems / score.number_guesses;
                        percentCorrect = Math.min(percentCorrect, 1);
                        percentCorrect = Math.max(percentCorrect, 0);

                    }, 1000);
                });


                return true;
            };
        }());


        $playButton.click(function() {
            problemNowActive && audio.play();
        });


        function wireUpKeyboard() {


            // keys 1 ~ 6 trigger "checkAnswer" on the appropriate .choice-holder
            tools.keydown([49, 50, 51, 52, 53, 54], (function() {


                // using this so the key can only be pressed once every 500ms,
                // to avoid accidental consecutive key presses
                const minTimeBetweenKeyPresses = 500;


                let lastTimePressed = (new Date()).getTime();


                return function(e) {


                    const $choice = $(".active-choice").eq(e.keyCode - 49);


                    if ($choice.length < 1) { return; }


                    // calculating whether enough time has passed since the last key press
                    const currentTime = (new Date()).getTime();
                    const milisecondsPassed = currentTime - lastTimePressed;
                    const enoughTimeHasPassed = (milisecondsPassed > minTimeBetweenKeyPresses);


                    if (enoughTimeHasPassed) {
                        lastTimePressed = currentTime;
                        checkAnswer($choice);
                    }
                };
            }()));


            tools.keydown(72, hintButton.trigger); // "H"


            tools.keydown(32, function() {
                $playButton.click();
            });


            tools.keydown(13, function() {
                if (dropZone.isNextButtonMode()) {
                    $("#next-button").click();
                    return;
                }
            });
        }
    }
);