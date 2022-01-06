/* jshint expr: true */


define(
    [
        "assignment",
        "jquery",
        "tools",
        "helpers/wordPool",
        "helpers/shakeElement",
        "helpers/SoundEffects",
        "helpers/scorebox",
        "helpers/tangocho",
        "helpers/Timer",
        "jqueryui",
    ],
    function(
        assignment,
        $,
        tools,
        myWordPool,
        shakeElement,
        SoundEffects,
        myScorebox,
        tangocho,
        Timer
    ) {


        $(function() {


            assignment.fixedProblemHolder({
                onSlideUp: function() {
                    $("#directions").hide();
                },
                onSlideDown: function() {
                    $("#directions").show();
                }
            });


            assignment.controlPanel.useBGM();
            assignment.backgroundMusic.source("https://www.bensound.com/bensound-music/bensound-littleidea.mp3");


            const soundEffects = new SoundEffects({
                container: $("#sound-effects-checkbox-stuff"),
                playThisOnCheckboxCheck: "tick",
                checkBoxTextAlign: "left",
                sounds: {
                    tick: "/sounds/card_slider/tick.mp3",
                    wrongSound: "/sounds/card_slider/wrongSound.mp3",
                    stack: "/sounds/card_slider/stack.mp3",
                    disappear: "/sounds/card_slider/disappear.mp3"
                }
            });


            let wordPool, timeLimit, mistakesLine, recycle, myJSON,
                timer, numCardsPerProblem, scorebox;


            const cardDropMainTopBottomBuffer = 60;
            const score = tools.score();


            score.total_number_pairs = 0;
            score.total_number_guesses = 0;
            score.number_mistakes = 0;
            score.number_correct = 0;


            const background = (function() {


                let backgrounds = [
                        "radial-gradient(#fff 0%, #fff 50%, #eef 100%)",
                        "radial-gradient(#fff 0%, #fff 50%, #eff 100%)",
                        "radial-gradient(#fff 0%, #fff 50%, #ffe 100%)",
                        "radial-gradient(#fff 0%, #fff 50%, #fef 100%)"
                    ];


                let currentPattern = 0;


                return {
                    rotate: function() {
                        $("#cardDropFrame").css({ background: backgrounds[currentPattern] });
                        currentPattern++;
                        if (currentPattern >= backgrounds.length) {
                            currentPattern = 0;
                        }
                    }
                };
            }());


            assignment.getProblemData(function(returnedData) {


                myJSON = returnedData;


                numCardsPerProblem = myJSON.number_sentakushi ? Math.min(myJSON.number_sentakushi, 6) : 5;
                timeLimit = myJSON.assignment.time_limit;
                mistakesLine = myJSON.assignment.mistakes_limit;
                score.total_number_pairs = (myJSON.number_problems || 4) * numCardsPerProblem || 20;
                wordPool = myWordPool({
                    baseArray: myJSON.problem,
                    shuffle: true,
                });


                let numProblems = null;
                if (myJSON.number_problems && myJSON.number_sentakushi) {
                    numProblems = myJSON.number_problems * myJSON.number_sentakushi;
                }


                $("#cardDropFrame").fadeTo("fast", 1);


                if (myJSON.assignment.recycle || !myJSON.number_problems) {
                    myJSON.number_problems = null;
                    recycle = true;
                } else {
                    recycle = false;
                }


                timer = new Timer({
                    pauseStart: true,
                    countdownFrom: timeLimit,
                    warnAt: timeLimit,
                    onWarn: function() {
                        //
                    },
                    eachSecond: function() {
                        var time = tools.secondsToHMS(timer.time(), {
                            useHours: false,
                            minutesTag: "m ",
                            secondsTag: "s",
                            useLeadingZeroes: false
                        });
                        scorebox.clock.label(time);
                    },
                    // eachSecond: function() {
                    //     scorebox.clock.label(timer.time());
                    // },
                    onFinish: function() {
                        recycle ? endSequence("timeTrial") : endSequence("timeUp");
                    },
                });


                assignment.directions.show("card_slider", {
                    directions: myJSON.assignment.directions,
                    mistakes: mistakesLine,
                    numProblems: recycle ? null : numProblems,
                    time: timeLimit,
                    timeTrial: recycle ? true : false
                });


                scorebox = myScorebox({
                    correctCounter: {
                        numberSegments: recycle ? 1 : (score.total_number_pairs ? score.total_number_pairs : 1),
                        recycle: recycle ? true : false
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


                newProblem();


                assignment.startButton({
                    button: $("#start-button"),
                    callback: function() {
                        score.startTimer();
                        fadeInCards();
                    },
                    buttonAlternate: $("html")
                });
            });


            function newProblem() {


                background.rotate();
                const pairs = wordPool.getArrayOf(numCardsPerProblem);
                let japaneseCards = [],
                    englishCards = [];
                $("#cards-holder").empty();


                pairs.forEach(function(pair, index) {


                    let englishWord = pair.find(w => tools.isEnglish(w)); // the first English text, from the left
                    englishWord = tools.getIdealAnswer(englishWord);


                    const japaneseWord = pair.find(w => tools.isJapanese(w));
                    const $japSpan = $("<span class='word-holder'/>").text(japaneseWord);
                    const $engSpan = $("<span class='word-holder'/>").text(englishWord);


                    const $japCard = $("<div class='japanese card'/>").append($japSpan).data({
                        answer: index,
                        english: englishWord,
                        japanese: japaneseWord,
                        language: "japanese"
                    });


                    const $engCard = $("<div class='english card'/>").append($engSpan).data({
                        answer: index,
                        english: englishWord,
                        japanese: japaneseWord,
                        language: "english"
                    });


                    const $dragThing = $("<span class='drag-thing glyphicon glyphicon-align-justify' />");
                    $japCard.append($dragThing.clone());
                    $engCard.append($dragThing.clone());


                    japaneseCards.push($japCard);
                    englishCards.push($engCard);
                });


                japaneseCards = tools.shuffle(japaneseCards);
                englishCards = tools.shuffle(englishCards);


                // *APPENDING* the Japanesse, so they go on the bottom...
                japaneseCards.forEach(function($card) {
                    $("#cards-holder").append($card);
                });


                // *PREPENDING* the English cards, so they go on top!
                englishCards.forEach(function($card) {
                    $("#cards-holder").prepend($card);
                });


                // fading in the cards, if the start-button has been removed
                if (!$("#start-button").length) {
                    fadeInCards();
                }


                // setting the height of the #cardDropMain
                $("#cardDropMain").css({
                    height: $("#cards-holder").height() + cardDropMainTopBottomBuffer,
                    position: "relative"
                });


                $(".card").draggable({
                    revert: true,
                    revertDuration: 100,
                    axis: "y",
                    stack: ".card",
                    containment: "parent",
                    start: function() {
                        $("body").addClass("now-dragging");
                        timer.start();
                        scorebox.clock.start();
                    },
                    stop: function() {
                        $("body").removeClass("now-dragging");
                    }
                });


                $(".card").droppable({
                    accept: $(".card"),
                    hoverClass: "now-droppable",
                    over: function() {
                        soundEffects.play("tick");
                    },
                    drop: function(event, ui) {

                        var $dragged = $(ui.draggable);
                        var $droppedOn = $(this);

                        checkAnswer($dragged, $droppedOn);
                    }
                });
            }


            function fadeInCards(callback) {


                const dropInterval = 100;
                const totalNumberItems = numCardsPerProblem * 2;


                for (let i = 0; i < totalNumberItems; i++) {
                    fadeInCard(i);
                }


                function fadeInCard(i) {


                    setTimeout(function() {


                        $(".card").eq(totalNumberItems - i - 1).addClass("visible");


                        setTimeout(function() {
                            soundEffects.play("stack");
                            if (i === totalNumberItems - 1 && callback && typeof callback === "function") {
                                callback();
                            }
                        }, 1000);
                    }, dropInterval * i);
                }
            }


            function checkAnswer($dragged, $droppedOn) {


                if ($dragged.data("language") === $droppedOn.data("language")) {
                    return;
                }


                const card1Answer = $dragged.data("answer"); // "answer" is a NUMBER
                const card2Answer = $droppedOn.data("answer");


                score.total_number_guesses += 1;


                (card1Answer === card2Answer) ? goodDrop($dragged, $droppedOn): badDrop($dragged, $droppedOn);
            }


            function goodDrop($dragged, $droppedOn) {


                score.number_correct++;
                scorebox.correctCounter.increment();
                soundEffects.play("disappear");


                // stopping the cards from trying to spring back while they're being deleted
                $dragged.draggable("option", "revert", false);
                $droppedOn.draggable("option", "revert", false);


                // adding classes to fade maintain the spans' "translateX", and to "scale" them out
                $dragged.addClass("draggedSlideOff").addClass("left");
                $droppedOn.addClass("draggedSlideOff").addClass("right");


                // gracefully erasing the cards
                [$dragged, $droppedOn].forEach(function($thisWord) {


                    // sliding up the word and removing it
                    $thisWord.delay(100).slideUp(200, function() { // delaying slightly to give time for the spans to shrink away


                        $thisWord.remove();


                        // moving on to the next problem if there are no more .cards left
                        if ($(".card").length <= 0) {


                            if (recycle) {
                                newProblem();
                                return;
                            }


                            // moving on to endSequence
                            if (score.number_correct >= score.total_number_pairs) {
                                endSequence("allAnswered");
                            } else {
                                newProblem();
                            }
                        }
                    });
                });
            }


            function badDrop($dragged, $droppedOn) {


                score.number_mistakes += 1;
                scorebox.wrongCounter.increment();
                soundEffects.play("wrongSound");
                shakeElement($("#cards-holder"), {
                    amplitude: 4,
                    period: 50
                });


                if (myJSON.assignment.use_user_vocab) {


                    const englishWord1 = $dragged.data("english");
                    const japaneseWord1 = $dragged.data("japanese");
                    const englishWord2 = $droppedOn.data("english");
                    const japaneseWord2 = $droppedOn.data("japanese");


                    tangocho.add({ english: englishWord1, japanese: japaneseWord1 });
                    tangocho.add({ english: englishWord2, japanese: japaneseWord2 });
                }


                if (mistakesLine && score.number_mistakes >= mistakesLine) {
                    endSequence("tooManyMistakes");
                }
            }


            const endSequence = (function() {


                let hasFired = false;
                const passConditions = {
                    tooManyMistakes: false,
                    timeUp: false,
                    allAnswered: true,
                    timeTrial: true
                };


                return function(result) {


                    if (hasFired) { return; }


                    hasFired = true;
                    timer.stop();
                    scorebox.clock.stop();
                    score.stopTimer();
                    assignment.gambariTimeStop();


                    const results = {
                        time_taken: score.time_taken(),
                        number_problems: score.total_number_pairs,
                        number_mistakes: score.number_mistakes,
                        passed: passConditions[result]
                    };


                    // adding the 'endScreenHolder' div after a momentary pause
                    // sending the results object, and also a reference to the function to call when returned from the
                    assignment.send_results(results, backFromSendResults);

                    function backFromSendResults() {


                        // adding the 'assignment_results' div after a slight pause
                        setTimeout(function() {


                            const data = [
                                { label: "時間", value: score.time_taken() + " 秒" },
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
                    }


                    return true;
                };
            }());
        });
    }
);