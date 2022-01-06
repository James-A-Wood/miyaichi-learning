/* jshint expr: true */

define(
[
    "assignment",
    "jquery",
    "tools",
    "helpers/shakeElement",
    "helpers/SoundEffects",
    "helpers/Timer",
    "helpers/scorebox",
    "jqueryui",
    "bootstrap",
],
    function(
        assignment,
        $,
        tools,
        shakeElement,
        SoundEffects,
        Timer,
        myScorebox
    ) {


        $(function() {


            const score = tools.score();
            const $problemTemplate = $(".problem-holder.my-template").detach().removeClass("my-template");


            let myJSON,
                scorebox,
                timer,
                mistakesLine,
                timeLimit,
                recycle;


            assignment.fixedProblemHolder({
                onSlideUp: function() {
                    $("#directions").hide();
                },
                onSlideDown: function() {
                    $("#directions").show();
                }
            });


            const referee = (function() {


                let lastCheckedAnswer = null; // an array of words


                function answerHasNotChanged(currentAnswer) {
                    return tools.arraysAreIdentical(lastCheckedAnswer, currentAnswer);
                }


                function answerIsCorrect(a1, a2) {
                    return tools.arraysAreIdentical(a1, a2);
                }


                function recordCheckedAnswer(answer) {
                    lastCheckedAnswer = answer;
                    return this;
                }


                function numProblemsLeft() {
                    return $(".problem-holder").length;
                }


                function allFinished() {
                    return numProblemsLeft() === 0;
                }


                function nextProblem() {
                    recordCheckedAnswer(null);
                    checkButton.setMode(checkAnswer).hide();
                    allFinished() ? endSequence() : showNext();
                }


                function showNext() {
                    $(".problem-holder").eq(0).animate({
                        top: "-5px",
                        opacity: 0
                    }, 300, function() {
                        $(".problem-holder").eq(0).remove(); // removing the first (top) problem from the stack
                        $(".problem-holder").eq(0).show().css({ // ... and then showing the next
                            top: "5px",
                            opacity: 0
                        }).delay(100).animate({
                            top: "0px",
                            opacity: 1
                        }, 300, function() {
                            $(".sentakushis-holder").eq(0).addClass("active");
                        });
                    });
                }


                function buildNewProblem(problem, index) {


                    let english, japanese;


                    // if there is only one sentence, then setting it to English, and leaving Japanese empty;
                    // otherwise, setting Japanese to the [0] sentence (if present) and English to the [1] sentence
                    if (problem.length === 1) {
                        english = problem[0];
                        japanese = "";
                    } else {
                        english = problem[1];
                        japanese = problem[0] ? problem[0] : "";
                    }


                    const $newProblemHTML = $problemTemplate.clone().appendTo("#all-problems-holder");
                    const $englishHolder = $newProblemHTML.find(".english-sentence");


                    $newProblemHTML.find(".number-holder").text(index + 1);
                    $newProblemHTML.find(".japanese-sentence").text(japanese);
                    $newProblemHTML.find(".hint-button").click(hintHandler.showAnswer);


                    processSentence(english).forEach(thisPiece => {
                        typeof thisPiece === "string" ?
                            addString(thisPiece, $englishHolder) :
                            addSentakushi(thisPiece, $englishHolder);
                    });
                }


                // private
                function addString(thisPiece, $englishHolder) {
                    thisPiece.split(" ").forEach(thisWord => {
                        $(`<span class='word-holder'>${thisWord}</span>`).appendTo($englishHolder);
                    });
                }


                // private
                function addSentakushi(thisPiece, $englishHolder) {
                    const $sentakushisHolder = $("<span class='sentakushis-holder set-height'></span>").appendTo($englishHolder);
                    thisPiece.sentakushiArray.forEach(thisSentakushi => {
                        $sentakushisHolder.append(`<div class='sentakushi min-height'>${thisSentakushi}</div>`);
                    });
                    $sentakushisHolder.data({ answersArray: thisPiece.answersArray });
                }


                return {
                    buildNewProblem,
                    allFinished,
                    showNext,
                    nextProblem,
                    recordCheckedAnswer,
                    answerIsCorrect,
                    answerHasNotChanged,
                };
            }());


            const hintHandler = (function() {


                let hintButtonEnabled = true;
                const displayTime = 3000;
                const fadeOutTime = 3000;


                function removeOldHints() {
                    $(".hint-text").remove();
                }


                function showAnswer() {


                    if (!hintButtonEnabled) { return; }


                    hintButtonEnabled = false;


                    const $this = $(this);
                    const $active = $(".sentences-holder").find(".active");
                    const answersArray = $active.data("answersArray");


                    let answers = "";
                    let counter = 10; // seconds


                    answersArray.forEach(function(word) {
                        answers += (word + " ");
                    });
                    answers = answers.trim();


                    const interval = setInterval(countdown, 1000);
                    const defaultText = $this.eq(0).text();
                    const $answersSpan = $("<span/>").addClass("hint-text").text(answers).click(function() {
                        $(this).remove();
                    });


                    $(".active").append($answersSpan);
                    $(".hint-button").css({ opacity: 0.5 });
                    $answersSpan.delay(displayTime).fadeTo(fadeOutTime, 0);


                    countdown();


                    function countdown() {
                        counter--;
                        $(".hint-button").text(defaultText + " (" + counter + ")");
                        if (counter < 0) {
                            clearInterval(interval);
                            $(".hint-button").text(defaultText).css({ opacity: 1 });
                            hintButtonEnabled = true;
                        }
                    }
                }


                return {
                    removeOldHints,
                    showAnswer,
                };
            }());


            const clock = new Timer({
                container: $("#clock-holder"),
                pauseStart: true
            });


            const soundEffects = new SoundEffects({
                container: $("#sound-effects-checkbox-stuff"),
                playThisOnCheckboxCheck: "tick",
                checkBoxTextAlign: "left",
                sounds: {
                    tick: "/sounds/narabekae_phrase/tick.mp3",
                    wrong: "/sounds/wrongSound.mp3",
                    correct: "/sounds/narabekae_phrase/balloon.mp3",
                }
            });


            const checkButton = (function() {


                const $button = $("#check-button");
                const buttonFunction = checkAnswer; // toggle with "nextProblem";
                const buttonSleepDuration = 1000;


                let t1 = (new Date()).getTime();
                let isActive = false;
                let lastCheckedAnswer = null;


                tools.keyup([13, 32], click);


                function click() {
                    isActive && $button.click();
                }


                function deactivate() {
                    isActive = false;
                    $button.off("click");
                }


                function enoughTimeHasPassed(action) {


                    if (action === referee.nextProblem) { return true; } // no waiting for nextProblem


                    let t2 = (new Date()).getTime();
                    if (t2 - t1 > buttonSleepDuration) {
                        t1 = t2;
                        return true;
                    }


                    return false;
                }


                function setMode(action) {
                    $button.toggleClass("btn-success", action === referee.nextProblem)
                        .toggleClass("btn-primary", action === checkAnswer)
                        .text(action === referee.nextProblem ? "次の問題" : "チェック")
                        .off("click").on("click", function() {
                            if (isActive && enoughTimeHasPassed(action)) {
                                action();
                            }
                        });
                    return this;
                }


                function hide() {
                    isActive = false;
                    $button.addClass("faded");
                }


                function show() {
                    isActive = true;
                    $button.removeClass("faded");
                }


                return {
                    click,
                    deactivate,
                    setMode,
                    hide,
                    show
                };
            }());


            assignment.getProblemData(function(d) {


                myJSON = d;
                mistakesLine = myJSON.assignment.mistakes_limit;
                timeLimit = myJSON.assignment.time_limit;


                if (myJSON.assignment.recycle) {
                    myJSON.number_problems = null;
                    recycle = true;
                } else {
                    recycle = false;
                }


                if (myJSON.number_problems && myJSON.number_problems > 0) {
                    myJSON.problem = tools.whittleDownArray(myJSON.problem, myJSON.number_problems);
                }


                if (myJSON.assignment.shuffle) {
                    myJSON.problem = tools.shuffle(myJSON.problem);
                }


                scorebox = myScorebox({
                    correctCounter: {
                        numberSegments: recycle ? 0 : myJSON.problem.length,
                        recycle: recycle
                    },
                    wrongCounter: {
                        numberSegments: mistakesLine,
                        recycle: mistakesLine ? false : true
                    },
                    clock: {
                        duration: timeLimit ? (timeLimit * 1000) : (30 * 1000),
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


                myJSON.problem.forEach(referee.buildNewProblem);


                assignment.directions.show("cardDrop", {
                    directions: myJSON.assignment.directions,
                    mistakes: mistakesLine,
                    numProblems: recycle ? null : (myJSON.number_problems ? myJSON.number_problems : null),
                    time: timeLimit,
                    timeTrial: recycle ? true : false
                });


                checkButton.setMode(checkAnswer);


                $(".sentakushis-holder").eq(0).addClass("active");


                $(".sentakushis-holder").disableSelection().sortable({
                    forceHelperSize: true,
                    forcePlaceholderSize: true,
                    revert: 100,
                    grid: [8, 8],
                    items: ".sentakushi",
                    appendTo: "body", // necessary to prevent the helper from jumping sideways on mousedown
                    placeholder: "placeholder",
                    change: () => soundEffects.play("tick"),
                    start: function(event, ui) {


                        const $this = $(this);
                        $this.addClass("now-being-dragged");
                        clock.start();
                        checkButton.show();


                        if (!$this.hasClass("active")) {
                            $(".active").removeClass("active");
                            $(this).addClass("active");
                            checkButton.setMode(checkAnswer);
                        }


                        // manually setting the placeholder size
                        ui.placeholder.width(ui.helper.outerWidth(true));
                        ui.placeholder.height(ui.helper.outerHeight());
                    },
                    stop: () => $(this).removeClass("now-being-dragged"),
                });


                timer.start();
                score.startTimer();
                scorebox.clock.start();
                $(".problem-holder").eq(0).show().fadeTo(500, 1);
                assignment.gambariTimeStart();
            });


            function processSentence(sentence) {


                /*
                 *
                 *      Returns an array of elements, each of which is either
                 *      1) a string, or
                 *      2) an object, with properties:
                 *
                 *          object.sentakushiArray - a randomly mixed array of words, and
                 *          object.answersArray - the original array of the words in their correct order
                 *
                 *
                 */
                const numOpeningParens = sentence.match(/\[/g) ? sentence.match(/\[/g).length : 0;
                const numClosingParens = sentence.match(/\]/g) ? sentence.match(/\]/g).length : 0;


                if (numOpeningParens !== numClosingParens) {
                    console.log("Different number of opening and closing parens!");
                    return false;
                }


                // surrounding whole sentence with square brackets, if none are present
                if (numOpeningParens === 0) {
                    sentence = `[${sentence}]`;
                }


                let returnArray = [];
                const pieces = sentence.split("[");


                pieces.forEach(function(thisPiece) {


                    // adding the STRING to the returnArray if it contains no closing paren, meaning there are no sentakushi
                    if (thisPiece.indexOf("]") === -1) {
                        returnArray.push(thisPiece);
                        return;
                    }


                    // beyong this point, there is a closing paren - so it has sentakushi!
                    let sentakushiArray = thisPiece.split("]")[0].trim().split(" ");
                    const partAfterSentakushi = thisPiece.split("]")[1];
                    sentakushiArray = tools.trimAllElements(sentakushiArray, { removeUnderscores: true });
                    const answersArray = sentakushiArray.concat();
                    sentakushiArray = tools.shuffle(sentakushiArray, true);
                    returnArray.push({ sentakushiArray, answersArray, }, partAfterSentakushi);
                });


                return returnArray;
            }


            function checkAnswer() {


                const $active = $(".sentakushis-holder").eq(0);
                const answersArray = $active.data("answersArray");
                const currentWordsArray = $active.find(".sentakushi").get().map(word => $(word).text());


                if (referee.answerHasNotChanged(currentWordsArray)) { return; }


                referee.recordCheckedAnswer(currentWordsArray);


                if (referee.answerIsCorrect(currentWordsArray, answersArray)) {


                    hintHandler.removeOldHints();
                    $active.addClass("answered-correctly").removeClass("active").sortable("destroy");
                    !tools.isMobile() && soundEffects.play("correct");


                    const numHolders = $(".problem-holder").eq(0).find(".sentakushis-holder").length;
                    const numAnswered = $(".problem-holder").eq(0).find(".sentakushis-holder.answered-correctly").length;


                    if (numHolders === numAnswered) {
                        scorebox.correctCounter.increment();
                        score.number_correct++;
                        (score.number_correct === myJSON.problem.length) ? endSequence("allAnswered"): checkButton.setMode(referee.nextProblem);
                    } else {
                        $(".problem-holder").eq(0).find(".sentakushis-holder").not(".answered-correctly").eq(0).addClass("active");
                    }


                } else {
                    shakeElement($active, {
                        amplitude: 3,
                        duration: 750
                    });
                    soundEffects.play("wrong");
                    scorebox.wrongCounter.increment();
                    score.number_mistakes++;


                    if (mistakesLine && score.number_mistakes >= mistakesLine) {
                        endSequence("tooManyMistakes");
                        return;
                    }
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


                    if (hasBeenCalled) { return; }


                    checkButton.deactivate();
                    hasBeenCalled = true;
                    timer.stop();
                    scorebox.clock.stop();
                    score.stopTimer();
                    assignment.gambariTimeStop();


                    const results = {
                        time_taken: score.time_taken(),
                        number_problems: myJSON.problem.length,
                        number_mistakes: score.number_mistakes,
                        passed: passConditions[result]
                    };


                    assignment.send_results(results, function() {
                        setTimeout(function() {
                            const data = [
                                { label: "時間", value: score.time_taken() + " 秒" },
                                { label: "問題数", value: results.number_problems ? results.number_problems + " 問" : "-" },
                                { label: "正解", value: score.number_correct + " 問" },
                                { label: "間違い", value: score.number_mistakes }
                        ];
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
    }
);