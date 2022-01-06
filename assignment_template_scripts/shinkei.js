/* jshint expr: true */

define(
    [
        "assignment",
        "jquery",
        "tools",
        "helpers/SoundEffects",
        "helpers/Timer",
        "helpers/scorebox",
        "helpers/tangocho"
    ],
    function(
        assignment,
        $,
        tools,
        SoundEffects,
        Timer,
        myScorebox,
        tangocho
    ) {


        $(function() {


            let myJSON,
                timer,
                scorebox,
                mistakesLine,
                timeLimit,
                recycle,
                numberPairs,
                englishWords = [],
                japaneseWords = [],
                japaneseCards = [],
                englishCards = [];


            const score = tools.score(),
                $cardsFrame = $("#cards-frame"),
                $cardMaster = $(".card.my-template").detach().removeClass("my-template"),
                bgm = assignment.backgroundMusic,
                // bgm = assignment.backgroundMusic({
                //     mp3Src: "https://www.bensound.com/bensound-music/bensound-onceagain.mp3",
                //     localStorageKey: "shinkei_bgm"
                // }),
                soundEffects = new SoundEffects({
                    checkbox: $("#sound-effects-checkbox"),
                    sounds: {
                        flippedSound: "/sounds/shinkei/flipped.mp3",
                        matchedSound: "/sounds/shinkei/matched.mp3",
                        tick: "/sounds/tick.mp3",
                        shutterClose: "/sounds/shinkei/flipped.mp3",
                    },
                    playThisOnCheckboxCheck: "tick",
                });


            assignment.controlPanel.useBGM();
            bgm.source("https://www.bensound.com/bensound-music/bensound-dreams.mp3");


            tools.setMobileScreenWidth(320);


            const deck = (function() {


                const closeInterval = 100;


                function addWordToCard($card) {
                    $card.addClass("open").find(".card-text").text($card.data("text"));
                }


                function isValidSelection($card) {
                    if (numCardsOpen() >= 2) { closeCards(); }
                    if ($card.hasClass("answered") || deck.cardsAreSameLanguage($card)) { return false; }
                    return true;
                }


                function closeCards() {
                    $(".card.open").removeClass("open mismatched").find(".card-text").html("");
                }


                function cardsAreSameLanguage($card) {
                    if ($(".card.open").length < 1) { return false; }
                    const card1Language = $(".card.open").eq(0).data("language");
                    const card2Language = $card.data("language");
                    return card1Language === card2Language;
                }


                function numCardsOpen() {
                    return $(".card.open").length;
                }


                function newCard(language, thisWord, index) {
                    const $cell = $cardMaster.clone();
                    $cell.addClass(language).data({
                        language: language,
                        text: thisWord,
                        english: englishWords[index],
                        japanese: japaneseWords[index],
                        key: index
                    }).find(".card-text").text(thisWord);


                    $(window).on("resize", function() {
                        tools.shrinkToFit($cell.find(".card-text"), $cell);
                    });


                    return $cell;
                }


                function openAll() {
                    $(".card").addClass("open");
                    return this;
                }


                function adjustTextSize() {
                    $(".card").each(function() {
                        tools.shrinkToFit($(this).find(".card-text"), $(this));
                    });
                    return this;
                }


                function closeAll(cellClickHandler) {
                    const flipInterval = setInterval(function() {
                        if ($(".card.open").length) {
                            $(".card.open").eq(0).removeClass("open");
                            soundEffects.play("shutterClose");
                        } else {
                            clearInterval(flipInterval);
                            $(".card-text").empty();
                            $(".card").on(tools.clickOrTouch, cellClickHandler);
                        }
                    }, closeInterval);
                    return this;
                }


                return {
                    newCard,
                    adjustTextSize,
                    openAll,
                    closeAll,
                    numCardsOpen,
                    cardsAreSameLanguage,
                    isValidSelection,
                    addWordToCard,
                };
            }());


            assignment.getProblemData(function(returnedData) {


                myJSON = returnedData;
                myJSON.problem = tools.objectToArray(myJSON.problem);
                timeLimit = myJSON.assignment.time_limit;
                recycle = myJSON.assignment.recycle;
                mistakesLine = myJSON.assignment.mistakes_limit;


                numberPairs = myJSON.problem.length;
                if (myJSON.number_problems) {
                    numberPairs = Math.min(myJSON.number_problems, myJSON.problem.length);
                }


                myJSON.problem = tools.whittleDownArray(myJSON.problem, numberPairs);


                myJSON.problem.forEach(function(wordPair) {
                    englishWords.push(wordPair[0]);
                    japaneseWords.push(wordPair[1]);
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


                assignment.directions.show("shinkei", {
                    directions: myJSON.assignment.directions,
                    mistakes: mistakesLine,
                    numProblems: recycle ? null : numberPairs,
                    time: timeLimit,
                    timeTrial: recycle ? true : false
                });


                scorebox = myScorebox({
                    correctCounter: {
                        doUse: false, // not showing the correctCounter 'cause it's obvious 'cause it's しんけい衰弱
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


                japaneseWords.forEach(function(thisWord, index) {
                    const card = deck.newCard("japanese", thisWord, index);
                    japaneseCards.push(card);
                });


                englishWords.forEach(function(thisWord, index) {
                    const card = deck.newCard("english", thisWord, index);
                    englishCards.push(card);
                });


                japaneseCards = tools.shuffle(japaneseCards);
                englishCards = tools.shuffle(englishCards);


                japaneseCards.forEach((_, index) => {
                    $cardsFrame.append(japaneseCards[index]);
                    $cardsFrame.append(englishCards[index]);
                });


                deck.adjustTextSize();


                setTimeout(function() {
                    deck.openAll();
                    assignment.startButton({
                        button: $("#start-button"), // actually, this doesn't exist - just here 'cause assignment wants it
                        buttonAlternate: $cardsFrame,
                        callback: function() {
                            timer.start();
                            score.startTimer();
                            scorebox.clock.start();
                            deck.closeAll(cellClickHandler);
                        }
                    });
                }, 500);


                function cellClickHandler() {


                    if (!deck.isValidSelection($(this))) { return; }


                    const thisCellsWord = $(this).data("text");
                    deck.addWordToCard($(this));
                    soundEffects.play("flippedSound");


                    if (deck.numCardsOpen() === 2) {


                        const card1 = $(".card.open")[0];
                        const card2 = $(".card.open")[1];
                        const key1 = $(card1).data("key");
                        const key2 = $(card2).data("key");


                        (key1 === key2) ? correctHandler(): wrongHandler(card1, card2);
                    }
                }
            });


            function correctHandler() {


                $(".open").addClass("answered").removeClass("english open japanese mismatch");
                soundEffects.play("matchedSound");
                scorebox.correctCounter && scorebox.correctCounter.increment();


                if ($(".answered").length === numberPairs * 2) {
                    endSequence("allAnswered");
                }
            }


            function wrongHandler(card1, card2) {


                score.number_mistakes += 1;
                scorebox.wrongCounter.increment();


                // adding mistaken words to the mistakenVocabList
                const english1 = $(card1).data("english");
                const english2 = $(card2).data("english");
                const japanese1 = $(card1).data("japanese");
                const japanese2 = $(card2).data("japanese");


                if (!myJSON.assignment.user_user_vocab) {
                    tangocho.add({ english: english1, japanese: japanese1 });
                    tangocho.add({ english: english2, japanese: japanese2 });
                }


                $(".open").addClass("mismatched");


                if (mistakesLine && score.number_mistakes >= mistakesLine) {
                    endSequence("tooManyMistakes");
                    return;
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
                    scorebox.clock && scorebox.clock.stop();
                    score.stopTimer();
                    assignment.gambariTimeStop();
                    bgm.pause();


                    const results = {
                        time_taken: score.time_taken(),
                        number_problems: numberPairs,
                        number_mistakes: score.number_mistakes,
                        passed: passConditions[result]
                    };


                    assignment.send_results(results, function() {
                        setTimeout(function() {


                            const data = [
                                { label: "時間", value: results.time_taken + " 秒" },
                                { label: "問題数", value: results.number_problems ? results.number_problems + " 問" : "-" },
                                { label: "間違い", value: results.number_mistakes + " 問" }
                            ];


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
                            percentCorrect = Math.min(percentCorrect, 1); // between 0 and 1
                            percentCorrect = Math.max(percentCorrect, 0);

                        }, 1000);
                    });


                    return true;
                };
            }());
        });
    }
);