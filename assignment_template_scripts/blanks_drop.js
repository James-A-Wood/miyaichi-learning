/* jshint expr: true */


/*
 *
 *      Formats:
 *
 *      1)  Choosing spelling:      犬 = [dog, dahg, dooog]                 // all on one line, in word1!
 *
 *      2)  English alone:          Can you do it?  -Yes, I [can, do, am].  // one line, in word1!
 *
 *      3)  Japanese & English:     その通りです！                             // two lines, in word1 ...
 *                                  That’s [right, left, light]!            //  ... and word2!
 *
 *      -------------------------------------
 *
 *
 *      Shuffle problems: {"shuffleProblems": true}
 *
 *      Random block colors: {"randomBlockColors": true}
 *
 *
 */


define(
    [
        "assignment",
        "jquery",
        "tools",
        "helpers/processSentence",
        "helpers/SoundEffects",
        "helpers/shakeElement",
        "helpers/scorebox",
        "helpers/Timer",
        "howler",
        "jqueryui"
    ],
    function(
        assignment,
        $,
        tools,
        processSentence,
        SoundEffects,
        shake,
        myScorebox,
        Timer
    ) {


        $(function() {


            let myJSON,
                scorebox,
                timer,
                problem,
                recycle,
                timeLimit,
                mistakesLine;


            const $stuffHolder = $("#stuff-holder"),
                $choiceSpanMaster = $(".choice-span.my-template").detach().removeClass("my-template"),
                $nextButtonMaster = $("#next-button").detach().removeClass("my-template"),
                $problemTableMaster = $("#templates-holder").find(".problem-table").removeClass("my-template").detach(),
                bgm = assignment.backgroundMusic;


            const score = tools.score({
                number_guesses: 0
            });


            assignment.controlPanel.useBGM();
            bgm.source("https://www.bensound.com/bensound-music/bensound-summer.mp3");


            const soundEffects = new SoundEffects({
                container: $("#sounds-stuff"),
                playThisOnCheckboxCheck: "tick",
                checkBoxTextAlign: "left",
                sounds: {
                    correctSound: "/sounds/blanks_drop/correctSound.mp3",
                    wrongSound: "/sounds/blanks_drop/wrongSound.mp3",
                    tick: "/sounds/tick.mp3"
                }
            });


            assignment.fixedProblemHolder({
                remove: true
            });


            assignment.getProblemData(function(d) {


                myJSON = d;
                timeLimit = myJSON.assignment.time_limit;
                recycle = myJSON.assignment.recycle;
                mistakesLine = myJSON.assignment.mistakes_limit;


                if (myJSON.number_problems) {
                    myJSON.number_problems = parseInt(myJSON.number_problems);
                    if (myJSON.number_problems < myJSON.problem.length) {
                        tools.whittleDownArray(myJSON.problem, myJSON.number_problems);
                    }
                }


                if (myJSON.assignment.shuffle) {
                    myJSON.problem = tools.shuffle(myJSON.problem);
                }


                /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
                 *
                 *
                 *       Massaging the data for misspellings where the data is English -> Japanese
                 *
                 *       E.g., ["apple", "りんご"] --> ["りんご = [apple]", null]
                 *
                 *
                 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
                if (myJSON.misc.useMisspelled) {


                    // handling word with slashes (multiple possible answers) here
                    myJSON.problem = myJSON.problem.map(item => [
                        item[0].split("/")[0].trim(),
                        item[1].split("/")[0].trim(),
                    ]);


                    // if (tools.isEnglish(myJSON.problem[0][0]) && tools.isJapanese(myJSON.problem[0][1])) {
                    //     myJSON.problem = myJSON.problem.map(element => [
                    //         `${element[1]} = [${element[0]}]`,
                    //         null,
                    //     ]);
                    // }
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


                assignment.directions.show("blanks_drop", {
                    directions: myJSON.assignment.directions,
                    mistakes: mistakesLine,
                    numProblems: recycle ? null : myJSON.problem.length,
                    time: timeLimit,
                    timeTrial: recycle ? true : false
                });


                timer.start();
                assignment.gambariTimeStart();
                score.startTimer();
                scorebox.clock.start();


                problem = new Problem(myJSON.problem, recycle);
                problem.makeNew();
            });


            function Problem(array, recycle) {


                const baseArray = array.concat(),
                    minTimeBetweenPressed = 1000;


                let whittleArray = baseArray.concat(), // copying THAT so we can whittle it down
                    t1 = (new Date()).getTime(),
                    keyPressedThisProblem = false,
                    isBetweenProblems = true;


                // selecting by number keys, 1~10
                // Ignoring key pressed more less one second after the last one
                // Also ignoring key presses that correspond to .choice-spans that don't exist
                tools.keydown(tools.range(49, 57), function(e) { // was: tools.keydown([49, 50, 51, 52, 53, 54, 55, 56, 57]
                    if (isBetweenProblems) { return false; }
                    let t2 = (new Date()).getTime();
                    if (t2 - t1 < minTimeBetweenPressed && keyPressedThisProblem) { return false; }
                    keyPressedThisProblem = true;
                    t1 = t2;
                    const $thisChoice = $(".choice-span").not(".choice-span-disabled").eq(e.keyCode - 49);
                    $thisChoice.length && checkAnswer($thisChoice, $(".problem-table"));
                });


                this.getIsBetweenProblems = function() {
                    return isBetweenProblems;
                };


                this.setBetweenProblems = function(value) {
                    isBetweenProblems = value;
                };


                this.makeNew = function() {


                    if (!isBetweenProblems) { return false; }


                    if (recycle && whittleArray.length <= 0) {
                        whittleArray = baseArray.concat();
                    }


                    if (whittleArray.length <= 0) {
                        endSequence("allAnswered");
                        return;
                    }


                    const $problemTable = $problemTableMaster.clone().appendTo($stuffHolder);


                    let japaneseProblem,
                        englishRaw,
                        thisProblem = whittleArray.shift();


                    keyPressedThisProblem = false;
                    isBetweenProblems = false;


                    // removing any empty strings
                    thisProblem = thisProblem.filter(function(element) {
                        if (element !== "") { return element; }
                    });


                    englishRaw = thisProblem.find(item => tools.isEnglish(item));
                    japaneseProblem = thisProblem.find(item => tools.isJapanese(item));


                    // NEW TEST - stripping underscores
                    englishRaw = englishRaw.replace(/_/g, " ");


                    let processedEnglish = processSentence(englishRaw, {
                        useMisspelled: myJSON.misc.useMisspelled,
                        numberSentakushi: myJSON.number_sentakushi || 3,
                    });


                    if (japaneseProblem) {
                        $problemTable.find(".japanese-span").text(japaneseProblem);
                    } else {
                        $problemTable.find(".japanese-holder").remove();
                    }


                    // NOTE this is more complicated than it needs to be
                    const choiceSpanElements = buildSentakushis(processedEnglish.sentakushi);
                    $(".drop-target").width(tools.getAverageWidth(choiceSpanElements));
                    $(".before-sentakushi").text(processedEnglish.stuffBeforeSentakushi);
                    $(".after-sentakushi").text(processedEnglish.stuffAfterSentakushi);


                    $problemTable.find(".drop-target").droppable({
                        accept: ".choice-span",
                        tolerance: "touch",
                        drop: function(event, ui) {
                            const $parent = $(".problem-table");
                            checkAnswer($(ui.draggable), $parent);
                        }
                    });


                    function buildSentakushis(element) {


                        const $choicesHolder = $problemTable.find(".choices-holder");


                        let choiceSpans = [];


                        element.sentakushi.forEach(function(choice, choiceIndex) {
                            const $choiceSpan = $choiceSpanMaster.clone().appendTo($choicesHolder);
                            choiceSpans.push($choiceSpan);
                            $choiceSpan.find(".choice-span-text").text(choice);
                            $choiceSpan.draggable({
                                revert: true,
                                revertDuration: 200,
                                stack: ".choice-span",
                                start: function(event, ui) {
                                    scorebox.clock.start();
                                    const originalWidth = $(ui.helper).css("width");
                                    $problemTable.find(".drop-target").css("width", originalWidth);
                                },
                            }).data("isCorrect", choiceIndex === element.correctAnswerIndex).css({
                                transform: `rotate(${5 - Math.random() * 10}deg)`,
                            });
                        });


                        return choiceSpans;
                    }
                };
            }


            function checkAnswer($draggedWord, $parent) {


                if (problem.getIsBetweenProblems() === true) { return; }


                score.number_guesses++;
                const correctAnswer = $draggedWord.text();
                const isCorrect = $draggedWord.data("isCorrect");
                isCorrect ? correctHandler($parent, correctAnswer, $draggedWord) : mistakeHandler($parent);
            }


            function correctHandler($parent, correctAnswer, $draggedWord) {


                const $nextButton = $nextButtonMaster.clone().appendTo($stuffHolder);


                problem.setBetweenProblems(true);
                score.number_correct++;
                soundEffects.play("correctSound");
                scorebox.correctCounter.increment();
                $parent.addClass("problem-correctly-answered").find(".drop-target").replaceWith(`<div class='correctly-answered'> ${correctAnswer} </div>`);
                $stuffHolder.off("click", clickForNext).on("click", clickForNext);
                tools.keydownOnce([13, 39], clickForNext);
                $parent.find(".choice-span").draggable("destroy").addClass("choice-span-disabled");
                $draggedWord.css({ opacity: 0 });


                function clickForNext() {
                    $nextButton.remove();
                    $stuffHolder.off("click", clickForNext);
                    $parent.fadeTo(400, 0, () => {
                        $parent.remove();
                        problem.makeNew();
                    });
                }
            }


            function mistakeHandler($parent) {


                shake($parent);
                soundEffects.play("wrongSound");
                score.number_mistakes++;
                scorebox.wrongCounter.increment();


                // exiting here if there are too many mistakes
                if (mistakesLine && score.number_mistakes >= mistakesLine) {
                    endSequence("tooManyMistakes");
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


                    hasBeenCalled = true;
                    timer && timer.stop();
                    scorebox && scorebox.clock && scorebox.clock.stop();
                    score.stopTimer();
                    assignment.gambariTimeStop();


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


                        // keeping it between 0 and 1
                        percentCorrect = Math.min(percentCorrect, 1);
                        percentCorrect = Math.max(percentCorrect, 0);
                    });


                    return true;
                };
            }());
        }());
    }
);