/* jshint expr: true */

define(
    [
        "assignment",
        "jquery",
        "tools",
        "helpers/wordPool",
        "helpers/shakeElement",
        "helpers/SoundEffects",
        "helpers/Timer",
        "helpers/scorebox",
        "helpers/tangocho",
        "helpers/misspellings",
        "helpers/confetti",
        "jqueryui",
        "howler",
    ],
    function(
        assignment,
        $,
        tools,
        myWordPool,
        shakeElement,
        SoundEffects,
        Timer,
        myScorebox,
        tangocho,
        misspellingsGenerator,
        confetti
    ) {


        $(function() {


            const score = tools.score();


            let scorebox,
                timer,
                wordPool,
                mistakesLine,
                timeLimit,
                myJSON = {},
                bgm = assignment.backgroundMusic,
                problemSolved = false;


            assignment.controlPanel.useBGM();
            bgm.source("https://www.bensound.com/bensound-music/bensound-thejazzpiano.mp3");


            const problemDisplay = (function() {


                const $display = $("#problem-display");


                return {
                    clear: function() {
                        $display.empty();
                        return this;
                    },
                    fill: function(text) {
                        $display.html(text);
                        return this;
                    },
                    getText: function() {
                        return $display.html().toLowerCase();
                    },
                };
            }());


            const submitButton = (function() {


                const $button = $("#submit-button");
                const checkModeText = "Check";
                const nextModeText = "Next";


                return {
                    checkMode: function() {
                        $button.text(checkModeText).removeClass("btn-success").addClass("btn-primary");
                        return this;
                    },
                    nextMode: function() {
                        $button.text(nextModeText).removeClass("btn-primary").addClass("btn-success");
                        return this;
                    },
                    focus: function() {
                        $button.focus();
                        return this;
                    },
                    disable: function() {
                        $button.prop("disabled", true);
                        return this;
                    },
                    enable: function() {
                        $button.prop("disabled", false);
                        return this;
                    },
                };
            }());


            const answerForm = (function() {


                const $input = $("#answer-input");
                const $form = $("#answer-input-stuff");
                const inputMinimumWidth = 200;
                const wrongAnswerClass = "wrong-answer";


                $("#submit-button, #problem-frame").click(function() {
                    $input.focus();
                });


                $form.on("submit", function(e) {
                    $input.val(scrubText($input.val()));
                    if ($input.val() === "") { return false; }
                    e.preventDefault();
                    referee.checkAnswer();
                });


                $input.on("keydown", e => {
                    referee.startTimers();
                    markWrongAnswer(false); // erasing the "wrong-answer" formatting
                }).on("keyup", e => {
                    // NEW TEST erasing this line because it screws with text input on iOS
                    // $input.val(scrubText($input.val())); // getting rid of troublesome symbols, like
                    $input.val() ? submitButton.enable() : submitButton.disable();
                });


                function scrubText(text) {
                    return text.replace(/[^a-z0-9\s'-]/gi, "").trim(); // removing extra symbols, including punctuation
                }


                function markWrongAnswer(trueOrFalse) {
                    $input.toggleClass(wrongAnswerClass, trueOrFalse);
                }


                return {
                    markWrongAnswer,
                    clear: function clear() {
                        $input.val("");
                        return this;
                    },
                    getValue: function() {
                        return $input.val();
                    },
                    shake: function() {
                        shakeElement($form);
                        return this;
                    },
                    activate: function() {
                        $input.prop("disabled", false).focus();
                        return this;
                    },
                    deactivate: function() {
                        submitButton.focus();
                        $input.prop("disabled", true);
                        return this;
                    },
                    showFirstLetter: function() {
                        const placeholderString = tools.removeParenthetical(referee.getIdealAnswer()).trim().charAt(0);
                        $input.prop("placeholder", placeholderString);
                        return this;
                    },
                    fill: function(correctAnswer) {
                        const misspelledWord = misspellingsGenerator.getOneFor(correctAnswer);
                        $input.val(misspelledWord);
                    },
                };
            }());


            const hints = (function() {


                const $button = $("#hint-button"),
                    $hintDisplay = $("#hint-holder"),
                    buttonBaseText = $button.text(),
                    displayDuration = 2 * 1000, // two seconds
                    hintFadeOutSeconds = 2 * 1000, // two seconds
                    hintButtonSleepIncrement = 3; // 3 seconds


                let tickInterval,
                    hintDisplayTimeout = null,
                    buttonIsDisabled = false,
                    hintButtonSleepSeconds = 10,
                    hintButtonIsSleeping = false,
                    numTimesUsed = 0;


                $button.click(showHint);


                function showHint() {
                    if (hintButtonIsSleeping || buttonIsDisabled) return false;
                    hintButtonSleep();
                    $hintDisplay.text(referee.getIdealAnswer());
                    displayTimeout = setTimeout(function() {
                        $hintDisplay.fadeOut(hintFadeOutSeconds, clearHint);
                    }, displayDuration);
                }


                function hintButtonSleep() {
                    $button.addClass("disabled");
                    hintButtonIsSleeping = true;
                    let secondsRemaining = hintButtonSleepSeconds;
                    tickInterval = setInterval(hintTicker, 1000); // imprecise but sufficient
                    hintTicker();

                    function hintTicker() {
                        secondsRemaining--;
                        $button.text(buttonBaseText + " (" + secondsRemaining + ")");
                        secondsRemaining < 0 && hintButtonReset();
                    }
                }


                function hintButtonReset() {
                    clearInterval(tickInterval);
                    buttonIsDisabled = false;
                    hintButtonSleepSeconds += hintButtonSleepIncrement;
                    tickInterval = null;
                    hintButtonIsSleeping = false;
                    $button.text(buttonBaseText).removeClass("disabled");
                    $button.removeClass("disabled");
                }


                function clearHint() {
                    $hintDisplay.empty().show();
                    clearTimeout(hintDisplayTimeout);
                    return this;
                }


                return {
                    showHint,
                    clearHint,
                    disable: function() {
                        buttonIsDisabled = true;
                        $button.addClass("disabled");
                        return this;
                    },
                    enable: function() {
                        hintButtonReset();
                        return this;
                    },
                };
            }());


            const problemNumber = (function() {
                const $problemNumberHolder = $("#problem-number-holder");
                let number = 0;
                return {
                    increment: function() {
                        $problemNumberHolder.text(++number + " / " + myJSON.problem.length);
                    },
                };
            }());


            const soundEffects = new SoundEffects({
                container: $("#sound-effects-checkbox-stuff"),
                playThisOnCheckboxCheck: "tick",
                checkBoxTextAlign: "left",
                sounds: {
                    // correctSound: "/sounds/word_spelling/correctSound.mp3",
                    correctSound: "/sounds/question-correct.mp3",
                    wrongSound: "/sounds/word_spelling/wrongSound.mp3",
                    tick: "/sounds/tick.mp3"
                }
            });


            const referee = (function() {


                const problemAnsweredClass = "problem-answered";


                let lastAnswer = "",
                    candidateAnswers = null;


                function checkForFinish() {
                    if (score.number_correct >= myJSON.problem.length) {
                        endSequence("allAnswered");
                        return true;
                    } else if (mistakesLine && score.number_mistakes >= mistakesLine) {
                        endSequence("tooManyMistakes");
                        return true;
                    } else if (timeLimit && timer.time > timeLimit) {
                        endSequence("timeElapsed");
                        return true;
                    }

                    return false;
                }


                function isValidAnswer(string) {
                    string = string.replace(/[^a-z0-9\s'-]/gi, ""); // NEW TEST added a hyphen to the list
                    return candidateAnswers.indexOf(string) !== -1;
                }


                function correctAnswerHandler() {


                    if (problemSolved) {
                        confetti.stopAndRemove();
                        newRound();
                        return;
                    }


                    confetti.makeNew({
                        parent: $("#submit-button"),
                    });


                    problemSolved = true;
                    $("body").addClass(problemAnsweredClass);
                    $("#answer-input-holder").css("opacity", 0).animate({ opacity: 1 }, 400);
                    soundEffects.play("correctSound");
                    answerForm.deactivate();
                    submitButton.nextMode();
                    scorebox.correctCounter.increment();
                    score.number_correct++;
                    return;
                }


                function wrongAnswerHandler() {
                    scorebox.wrongCounter.increment();
                    score.number_mistakes++;
                    answerForm.shake().markWrongAnswer(true);
                    lastAnswer = answerForm.getValue();
                    soundEffects.play("wrongSound");
                    checkForFinish();
                }


                return {
                    checkForFinish,
                    checkAnswer: function() {
                        if (answerForm.getValue() === lastAnswer) return false; // doing nothing if the answer hasn't changed since the last time
                        const userAnswer = answerForm.getValue();
                        isValidAnswer(userAnswer) ? correctAnswerHandler() : wrongAnswerHandler();
                    },
                    markNewProblem: function() {
                        $("body").removeClass(problemAnsweredClass);
                    },
                    setAnswer: function(string) {
                        candidateAnswers = tools.getCandidateAnswers(string);
                        return this;
                    },
                    startTimers: function() {
                        submitButton.enable();
                        scorebox.clock.start();
                        timer.start();
                        assignment.gambariTimeStart();
                    },
                    getIdealAnswer: function() {
                        return candidateAnswers[0];
                    },
                };
            }());


            assignment.getProblemData(function(d) {


                myJSON = d;
                // myJSON.problem = tools.objectToArray(myJSON.problem); // not necessary?
                timeLimit = myJSON.assignment.time_limit;
                mistakesLine = myJSON.assignment.mistakes_limit;


                if (myJSON.number_problems) {
                    tools.whittleDownArray(myJSON.problem, myJSON.number_problems);
                }


                assignment.directions.show("word_spelling", {
                    directions: myJSON.assignment.directions,
                });


                // moving the "gambari-time" to inside the user-info thing
                $("#user-info").appendTo("#word-spelling-main").css({
                    position: "absolute",
                    right: 0,
                    top: 0
                });


                scorebox = myScorebox({
                    correctCounter: {
                        numberSegments: myJSON.problem.length,
                        recycle: false
                    },
                    wrongCounter: {
                        numberSegments: mistakesLine,
                        recycle: mistakesLine ? false : true
                    },
                    clock: {
                        duration: timeLimit ? (timeLimit * 1000) : (60 * 1000),
                        labelText: timeLimit ? timeLimit : 0,
                        repeat: true,
                        dotMode: timeLimit ? false : true
                    }
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
                        let time = tools.secondsToHMS(timer.time(), {
                            useHours: false,
                            minutesTag: "m ",
                            secondsTag: "s",
                            useLeadingZeroes: false
                        });
                        scorebox.clock.label(time);
                        referee.checkForFinish();
                    },
                    onFinish: function() {
                        endSequence("timeUp");
                    }
                });


                // showing directions for this particular assignment
                assignment.directions.show("wordSpelling", {
                    directions: myJSON.assignment.directions,
                });


                // optionally, setting the problemDisplay to position: fixed on mobile
                assignment.fixedProblemHolder({
                    onSlideUp: function() {
                        $("#directions").hide();
                    },
                    onSlideDown: function() {
                        $("#directions").show();
                    }
                });


                wordPool = myWordPool({
                    baseArray: myJSON.problem,
                    shuffle: true
                });


                newRound();
            });




            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */




            function newRound() {


                if (referee.checkForFinish()) { return false; }


                score.startTimer();
                problemSolved = false;
                referee.markNewProblem();
                submitButton.checkMode();
                if (!myJSON.misc.insertMisspelled) {
                    submitButton.disable();
                }
                problemNumber.increment();
                hints.clearHint();

                $("body").addClass("problem-has-loaded");


                const nextProblem = wordPool.getNextWord();


                // detecting which is English and which Japanese, and always
                // making the problem Japanese-to-English
                const japaneseFirst = tools.isJapanese(nextProblem[0]);
                const problem = nextProblem[japaneseFirst ? 0 : 1];
                let answer = nextProblem[japaneseFirst ? 1 : 0];
                answer = tools.removeExtraWhiteSpace(answer);


                referee.setAnswer(tools.scrubString(answer));


                answerForm.activate().clear();
                myJSON.misc.doShowHints && answerForm.showFirstLetter();
                myJSON.misc.insertMisspelled && answerForm.fill(referee.getIdealAnswer());
                problemDisplay.clear().fill(problem);
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
                    timer.stop();
                    scorebox.clock.stop();
                    score.stopTimer();
                    assignment.gambariTimeStop();
                    bgm.pause();
                    hints.disable();


                    const results = {
                        time_taken: score.time_taken(),
                        number_problems: myJSON.problem.length,
                        number_mistakes: score.number_mistakes,
                        passed: passConditions[result]
                    };


                    // sending the results object, and also a reference to the function to call when returned from the
                    assignment.send_results(results, function() {
                        setTimeout(function() {


                            // using an array of objects, so we can control the order of the rows
                            const data = [
                                { label: "時間", value: results.time_taken + " 秒" },
                                { label: "問題数", value: results.number_problems ? results.number_problems + " 問" : "-" },
                                { label: "正解", value: score.number_correct + " 問" },
                                { label: "間違い", value: score.number_mistakes }
                            ];


                            // adding mistaken vocabulary items to the display
                            const wordsToReview = tools.showMistakenVocab(tangocho.getItems());
                            if (wordsToReview && myJSON.assignment.use_user_vocab) {
                                data.push({
                                    label: "復習しよう！",
                                    value: wordsToReview
                                });
                            }


                            // passing in the object to put the assignment_results stuff into, and the data to display
                            assignment.showAssignmentResults({
                                container: $("#mainProblemsHolder"),
                                result: result,
                                data: data
                            });
                        }, 1000);
                    });
                };
            }());
        });
    });