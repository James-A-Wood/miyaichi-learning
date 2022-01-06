/* jshint expr: true */

define(
    [
        "assignment",
        "jquery",
        "tools",
        "helpers/shakeElement",
        "helpers/SoundEffects",
        "helpers/Timer",
        "helpers/misspellings",
        "helpers/confetti",
        // "jqueryui",
        // "howler",
    ],
    function(
        assignment,
        $,
        tools,
        shakeElement,
        SoundEffects,
        Timer,
        misspellings,
        confetti
    ) {


        $(function() {


            assignment.controlPanel.useBGM();
            assignment.backgroundMusic.source("https://www.bensound.com/bensound-music/bensound-buddy.mp3");


            let timer,
                mistakesLine,
                timeLimit,
                myJSON = {},
                mistakesLimit;


            const score = tools.score();


            const soundEffects = new SoundEffects({
                container: $("#sound-effects-checkbox-stuff"),
                playThisOnCheckboxCheck: "tick",
                checkBoxTextAlign: "left",
                sounds: {
                    correctSound: "/sounds/eitango_marathon/correctSound.mp3",
                    wrongSound: "/sounds/eitango_marathon/wrongSound.mp3",
                    tick: "/sounds/tick.mp3"
                }
            });


            const statsBar = (function() {


                const mistakes = new MistakesDisplay();
                const numLeftDisplay = new ProblemNumberDisplay();
                const timerDisplay = new TimerDisplay();


                function setProgressBar(percent) {
                    $("#progress-bar").css("width", percent * 100 + "%");
                    return this;
                }


                return {
                    mistakes,
                    numLeftDisplay,
                    timerDisplay,
                    setProgressBar,
                };
            }());




            function MistakesDisplay() {


                const $display = $("#num-mistakes-display").find(".holder");


                let mistakesLimit = null;


                function refresh() {
                    let text = score.number_mistakes;
                    if (mistakesLimit) text += " / " + mistakesLimit;
                    $display.text(text);
                    return this;
                }


                function setMistakesLimit(number) {
                    mistakesLimit = number;
                    refresh();
                    return this;
                }


                refresh();


                return {
                    refresh,
                    setMistakesLimit,
                };
            }


            function TimerDisplay() {


                const $display = $("#new-timer-display");
                const $digitsHolder = $display.find(".holder");
                const prefix = $display.text();
                const that = this;


                function show(seconds) {
                    $digitsHolder.text(tools.secondsToHMS(seconds, {
                        useHours: false,
                        minutesTag: ":",
                        secondsTag: "",
                        useLeadingZeroes: true,
                        prefix: prefix,
                    }));
                    return that;
                }


                function addClass(klass) {
                    toggleClass(klass, true);
                    return that;
                }


                function removeClass(klass) {
                    toggleClass(klass, false);
                    return that;
                }


                // private
                function toggleClass(klass, value) {
                    $display.toggleClass(klass, !!(value));
                    return that;
                }


                return {
                    show,
                    addClass,
                    removeClass,
                };
            }


            const table = (function() {


                const answeredClass = "answered",
                    correctAnswerClass = "correct-answer",
                    wrongAnswerClass = "wrong-answer",
                    wildCard = "*",
                    blankSpace = "( ____ )";

                let answerSheet = {},
                    rightAnswers = {},
                    wrongAnswers = {},
                    allRows = [],
                    checkInterval = 2000;


                function numberRows() {
                    return allRows.length;
                }


                function numberUnansweredRows() {
                    return unansweredRows().length;
                }


                // private
                function unansweredRows() {
                    return allRows.filter($row => !$row.hasClass(answeredClass));
                }


                function build(myJSON) {


                    const $revealedAnswerHolderTemplate = tools.makeTemplate(".revealed-answer-holder"),
                        $rowMaster = tools.makeTemplate("#marathon-table .problem-row"),
                        doShowHints = myJSON.misc.doShowHints,
                        doInsertMisspelled = myJSON.misc.insertMisspelled,
                        problems = myJSON.problem;


                    problems.forEach(function(problem, index) {


                        const $row = $rowMaster.clone().appendTo("#marathon-table");
                        const problemNumber = index + 1;
                        const $answerInput = $row.find(".answer-input");
                        const $checkButton = $row.find(".check-button");


                        // making sure the question is Japanese and the answer is English
                        const indexOfCandidates = tools.isJapanese(problem[0]) ? 1 : 0,
                            indexOfProblem = tools.isJapanese(problem[0]) ? 0 : 1;


                        const candidateAnswers = tools.getCandidateAnswers(problem[indexOfCandidates]);
                        const question = problem[indexOfProblem].replace(wildCard, blankSpace);
                        const idealAnswer = candidateAnswers[0];


                        allRows.push($row);


                        if (doInsertMisspelled) {
                            const misspelledWord = misspellings.getOneFor(idealAnswer);
                            $answerInput.val(misspelledWord);
                        }


                        if (answerSheet.hasOwnProperty(question)) {
                            log(`key ${question} already exists!`);
                            return false;
                        }


                        $answerInput.on("keydown", function(e) {
                            assignment.gambariTimeStart();
                            timer.start();
                            if (e.which === 13) { // Enter -> check answer
                                $answerInput.val() ? checkAnswer($row) : focus("nextAll");
                            } else if (e.which === 27) { // Esc -> reset
                                $answerInput.val("");
                                $checkButton.removeClass("btn-warning").addClass("unclicked btn-success");
                                $checkButton.text("Check");
                            }
                        });


                        $answerInput.blur(function() {
                            $(this).val($(this).val().trim());
                            statsBar.numLeftDisplay.update();
                        }).focus(function() {
                            $(".has-focus").removeClass("has-focus");
                            $row.addClass("has-focus");
                        });


                        $row.find(".number-holder").text(problemNumber + ".");
                        $row.find(".problem-holder").text(question);
                        doShowHints && $answerInput.prop("placeholder", tools.getFirstRealLetter(idealAnswer));


                        $row.question = question;
                        $row.idealAnswer = idealAnswer;
                        $row.candidateAnswers = candidateAnswers;


                        $checkButton.on(tools.clickOrTouch, function() {
                            $answerInput.focus();
                            checkAnswer($row);
                        });


                        $row.on("paste", function(e) {
                            e.preventDefault();
                            alert("Don't paste the answers!");
                        });


                        $row.markAsChecked = function(isCorrect, question, userAnswer) {


                            focus("nextAll");


                            $row.addClass(answeredClass);
                            $row.addClass(isCorrect ? correctAnswerClass : wrongAnswerClass);
                            $row.find(".answer-input").prop("disabled", true);
                            $row.find(".check-button").remove();


                            const $holder = $revealedAnswerHolderTemplate.clone();
                            $holder.find(".user-answer-holder").text(tools.getIdealAnswer(userAnswer)); // necessary?
                            $holder.find(".correct-answer-holder").text(isCorrect ? userAnswer : $row.idealAnswer);
                            $answerInput.replaceWith($holder);
                            !isCorrect && shakeElement($holder);


                            isCorrect && confetti.makeNew({
                                parent: $holder.find(".user-answer-holder"),
                                numSparks: 10,
                                duration: 0.5,
                                scatterWidth: window.innerWidth / 6,
                                scatterHeight: window.innerHeight / 4,
                                pieceWidth: 10,
                                pieceHeight: 10,
                            });
                        };


                        answerSheet[question] = idealAnswer;
                        answerSheet[idealAnswer] = question;
                    });


                    // arrows keys to navigate up and down
                    tools.keydown([38, 40], function(e) {
                        const prevOrNext = (e.which === 38) ? "prevAll" : "nextAll";
                        focus(prevOrNext);
                    });
                }


                function focus(prevOrNext = "nextAll") {
                    const $currentFocus = $(".answer-input:focus") || focusFirst();
                    $currentFocus.closest(".problem-row")[prevOrNext](":not(.answered):first").find(".answer-input").focus();
                }


                function checkAnswer($row, obj = {}) {


                    obj = $.extend({
                        playSounds: true,
                    }, obj);


                    const $input = $row.find(".answer-input");
                    const userAnswer = $row.find(".answer-input").val().trim();


                    if (!userAnswer) {
                        $input.focus();
                        return false;
                    }


                    const $button = $row.find(".check-button");
                    const question = $row.question;
                    const isCorrect = $row.candidateAnswers.some(candidateAnswer => (scrubText(userAnswer) === scrubText(candidateAnswer)));


                    if ($button.hasClass("unclicked")) {
                        $button.removeClass("unclicked btn-success").addClass("btn-warning"); // klugey
                        $button.text("Really check?");
                        return false;
                    }


                    isCorrect ? score.number_correct++ : score.number_mistakes++;
                    !isCorrect && statsBar.mistakes.refresh();
                    (isCorrect ? rightAnswers : wrongAnswers)[question] = $row.idealAnswer;
                    obj.playSounds && soundEffects.play(isCorrect ? "correctSound" : "wrongSound");


                    $row.markAsChecked(isCorrect, question, userAnswer);


                    statsBar.setProgressBar(score.getNumberAnswered() / myJSON.problem.length);


                    // COOL! scrolling an element to the middle of the page
                    if (obj.scrollAutomatically) {
                        tools.scrollToMiddle($row);
                    }


                    statsBar.numLeftDisplay.update();


                    // checking for finish
                    if (numberUnansweredRows() === 0) {
                        timer.stop();
                        endSequence(didPass() ? "allAnswered" : "tooManyMistakes");
                    }
                }


                function didPass() {
                    if (!mistakesLimit) { return true; }
                    return Object.keys(wrongAnswers).length <= mistakesLimit;
                }


                function allActiveRows() {
                    return allRows.filter(function($row) {
                        return !($row.hasClass(".answered"));
                    });
                }


                function focusFirst() {
                    const $inputToFocus = allActiveRows()[0].find(".answer-input");
                    $inputToFocus.focus();
                    return $inputToFocus;
                }


                function getMistakes() {
                    return wrongAnswers;
                }


                function scrubText(text) {
                    text = tools.removeExtraWhiteSpace(text);
                    const scrubbedText = text.replace(/[^a-z0-9\s']/g, "").trim();
                    return scrubbedText;
                }


                return {
                    build,
                    numberRows,
                    numberUnansweredRows,
                    focusFirst,
                    getMistakes,
                };
            }());


            function ProblemNumberDisplay() {


                const $display = $("#num-left-display").find(".holder");


                function update() {
                    $display.text(table.numberUnansweredRows());
                }


                return {
                    update,
                };
            }


            // showing different chuui messages depending on the type of assignment
            function ChuuiJikou(obj = {}) {


                const $holder = obj.holder || $("#chuui-jikou-holder");
                const messages = {
                    disqualifyOnPageBlur: "このページから離れると<span class='emphasized'>リロードされます</span>。注意してください。",
                };


                function addMessage(message, position = "append") {
                    $holder.find("#messages-holder")[position]($(`<p>●　${message}</p>`));
                }


                function showMessages(myJSON) {


                    addMessage(`全部で <span class="emphasized">${table.numberRows()}問</span> あります。`);


                    mistakesLimit && addMessage(`合格ラインは <span class="emphasized">${table.numberRows() - mistakesLimit}問 </span>です。`);


                    Object.keys(myJSON.misc).forEach(function(key) {
                        !!myJSON.misc[key] && messages[key] && addMessage(messages[key]);
                    });


                    if (myJSON.assignment.time_limit) {
                        const time = tools.secondsToHMS(myJSON.assignment.time_limit, {
                            minutesTag: "m ",
                            secondsTag: "s ",
                        });
                        addMessage(`時間制限は <span class="emphasized">${time}</span> です。`);
                    }


                    addMessage("Do your best!");
                }


                function hideMe() {
                    $holder.slideUp();
                }


                return {
                    showMessages,
                    hideMe,
                };
            }


            // retrieving the vocabulary items and storing them in JSON
            assignment.getProblemData(function(d) {


                myJSON = d;
                timeLimit = myJSON.assignment.time_limit;
                tools.whittleDownArray(myJSON.problem, myJSON.number_problems);
                myJSON.problem = tools.shuffle(myJSON.problem);
                table.build(myJSON);


                if (myJSON.assignment.mistakes_limit) {
                    mistakesLimit = myJSON.assignment.mistakes_limit;
                    statsBar.mistakes.setMistakesLimit(mistakesLimit);
                }


                assignment.directions.show("eitango_marathon", {
                    directions: myJSON.assignment.directions,
                });


                const chuuiJikou = ChuuiJikou();
                chuuiJikou.showMessages(myJSON);


                table.focusFirst();
                score.startTimer();
                start(myJSON);
            });


            function start(myJSON) {


                // NEW TEST disabling this during development
                if (myJSON.misc.disqualifyOnPageBlur) {
                    window.onblur = function() {
                        location.reload();
                    };
                }


                statsBar.numLeftDisplay.update();


                // moving the "gambari-time" to inside the user-info thing
                $("#user-info").appendTo("#marathon-main").css({
                    position: "absolute",
                    right: 0,
                    top: 0
                });


                timer = new Timer({
                    pauseStart: true,
                    countdownFrom: timeLimit,
                    warnAt: timeLimit,
                    onStart: () => statsBar.timerDisplay.addClass("has-started"),
                    eachSecond: time => statsBar.timerDisplay.show(time),
                    onFinish: () => endSequence("timeUp"),
                    onInstantiation: () => statsBar.timerDisplay.show(timeLimit),
                    onStopped: () => statsBar.timerDisplay.removeClass("has-started"),
                });
            }








            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */







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
                    timer.stop();
                    score.stopTimer();
                    assignment.gambariTimeStop();


                    const results = {
                        time_taken: score.time_taken(),
                        passed: passConditions[result],
                        number_problems: myJSON.problem.length,
                        number_mistakes: myJSON.problem.length - score.number_correct,
                        number_correct: score.number_correct,
                    };


                    assignment.send_results(results, function() {
                        setTimeout(function() {


                            const timeInMinutes = tools.secondsToHMS(results.time_taken, {
                                minutesTag: "m ",
                                secondsTag: "s",
                            });


                            const user = tools.userInfo() || {};


                            const mistakesString = (function() {


                                const mistakes = table.getMistakes();
                                let string = "";


                                if (Object.keys(mistakes).length) {
                                    for (let key in mistakes) {
                                        // string += `<span style='padding-right: 15px;'>${mistakes[key]} (${key})</span>`;
                                        string += `<span style='padding-right: 15px;'>${mistakes[key]}, </span>`; // English only, no Japanese
                                    }
                                } else {
                                    string = "No mistakes!";
                                }

                                return string;
                            }());


                            const data = [
                                { label: "時間", value: timeInMinutes, },
                                { label: "問題数", value: results.number_problems ? results.number_problems + " 問" : "-", },
                                { label: "正解", value: `${results.number_correct} 問`, },
                                { label: "間違い", value: `${results.number_mistakes} 問`, },
                                { label: "Review!", value: mistakesString, rowClass: "padding-top", },
                            ];


                            // adding info specific to logged-in users
                            user.kyoushitsu_id && data.unshift({ label: "コース", value: user.kyoushitsu_id || "-", });
                            user.nen && data.unshift({ label: "学年・組・番", value: `${user.nen} - ${user.kumi} - ${user.ban}`, });
                            user.username && data.unshift({ label: "ユーザー名", value: user.username || "-", });
                            user.lastname && data.unshift({ label: "氏名", value: `${user.lastname} ${user.firstname}` });


                            // adding mistaken vocabulary items to the display
                            // const wordsToReview = tools.showMistakenVocab(tangocho.getItems());
                            if (myJSON.assignment.use_user_vocab && wordsToReview) {
                                data.push({
                                    label: "復習しよう！",
                                    value: wordsToReview
                                });
                            }


                            // passing in the object to put the assignment_results stuff into, and the data to display
                            assignment.showAssignmentResults({
                                container: $("#mainProblemsHolder"),
                                result: result,
                                data: data,
                                showPrintButton: true, // showing the print button
                            });
                        }, 1000);
                    });
                };
            }());
        });
    });