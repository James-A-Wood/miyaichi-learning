/* jshint expr: true */

define(
    [
        "assignment",
        "jquery",
        "tools",
        "helpers/wordPool",
        "helpers/shakeElement",
        "helpers/SoundEffects",
        // "helpers/Timer",
        "helpers/scorebox",
        "helpers/tangocho",
        "jqueryui",
        "howler",
    ],
    function (
        assignment,
        $,
        tools,
        myWordPool,
        shakeElement,
        SoundEffects,
        // Timer,
        myScorebox,
        tangocho
    ) {


        /*
         *
         *      myJSON.number_sentakushi - number of PAIRS to use per problem set
         *
         *      myJSON.number_problems - number of SETS to use (null === infinite)
         *
         *
         */




        $(function () {


            let scorebar,
                // timer,
                wordPool,
                mistakesLine,
                timeLimit,
                recycle,
                numberRounds,
                myJSON = {},
                numberPairsPerSet = 4,
                numberCompletedSets = 0,
                remainingPairs = 0,
                score = tools.score();


            const $cardDropMain = $("#cardDropMain");


            assignment.controlPanel.useBGM();
            const bgm = assignment.backgroundMusic;
            bgm.source("https://www.bensound.com/bensound-music/bensound-buddy.mp3");


            const cardsFrame = (function () {


                const totalFadeInTime = 500;
                $(window).on("resize", adjustCardSize);


                function reset() {
                    $cardDropMain.empty();
                }


                function show() {

                    let cardsArray = $cardDropMain.children().toArray(); // NOTE converting to standard array, not jQuery collection
                    const fadeInInterval = totalFadeInTime / cardsArray.length;

                    tools.shuffle(cardsArray).forEach(function (thisCard, index) {
                        setTimeout(() => $(thisCard).addClass("visible"), index * fadeInInterval);
                    });
                }


                function append($element) {
                    $cardDropMain.append($element);
                }


                function prepend($element) {
                    $cardDropMain.prepend($element);
                }


                function shake() {
                    shakeElement($cardDropMain, {
                        amplitude: 5,
                        axis: "y",
                    });
                }


                function isTooBig() {
                    const innerHeight = parseInt($cardDropMain.outerHeight());
                    const outerHeight = parseInt($cardDropMain.outerHeight());
                    return innerHeight > outerHeight;
                }


                function adjustCardSize() {


                    let counter = 0;


                    while (isTooBig() && counter < 20) {


                        // (1 of 2) shrinking padding
                        counter++;
                        const padding = parseInt($(".text-holder").css("padding")) - 1;
                        $(".text-holder").css({ padding: padding });


                        // (2 of 2) if padding is 0, then adjusting the width of each card
                        if (padding <= 0) {
                            const width = parseInt($(".card").css("min-width")) - 1;
                            $(".card").css({ minWidth: width + "%" });
                        }
                    }
                }


                return {
                    reset,
                    append,
                    show,
                    shake,
                    prepend,
                    adjustCardSize
                };
            }());


            const newCard = (function () {


                const $cardMaster = $(".card.my-template").detach().removeClass("my-template");


                return function (language, word, index, randomColor) {


                    const $card = $cardMaster.clone().addClass(language).data({ key: index });
                    const $textHolder = $card.find(".text-holder");


                    $textHolder.css({
                        color: language === "english" ? "white" : randomColor,
                        backgroundColor: language === "english" ? randomColor : "white",
                        borderColor: language === "english" ? "white" : randomColor,
                        transform: function () { // adding slight rotation, just for grins
                            const degrees = 5 - Math.random() * 10;
                            return "rotate(" + degrees + "deg)";
                        }
                    }).text(word);


                    return $card;
                };
            }());


            const soundEffects = new SoundEffects({
                container: $("#sound-effects-checkbox-stuff"),
                playThisOnCheckboxCheck: "tick",
                checkBoxTextAlign: "left",
                sounds: {
                    correctSound: "/sounds/card_drop/correctSound.mp3",
                    wrongSound: "/sounds/card_drop/wrongSound.mp3",
                    tick: "/sounds/tick.mp3"
                }
            });


            $("#number-problem").css({ width: $cardDropMain.width() });


            assignment.getProblemData(function (d) {


                myJSON = d;
                myJSON.problem = tools.objectToArray(myJSON.problem);
                timeLimit = myJSON.assignment.time_limit;
                mistakesLine = myJSON.assignment.mistakes_limit;


                recycle = false;
                if (myJSON.assignment.recycle || !myJSON.number_problems) {
                    myJSON.number_problems = null;
                    recycle = true;
                }


                if (myJSON.number_problems) {
                    numberRounds = myJSON.number_problems;
                }


                // making sure there aren't more sentakushi than problems
                myJSON.number_sentakushi = Math.min(myJSON.number_sentakushi, myJSON.problem.length);


                let numProblems = null;
                if (myJSON.number_problems && myJSON.number_sentakushi) {
                    numProblems = myJSON.number_problems * myJSON.number_sentakushi;
                }


                scorebar = assignment.scorebar.build({
                    numProblems: numProblems,
                    mistakesLine: mistakesLine,
                    holder: $("#mainProblemsHolder")
                });


                $("#user-info").appendTo("#cardDropMain").css({
                    position: "absolute",
                    right: 0,
                    top: 0
                });


                // timer = new Timer({
                //     pauseStart: true,
                //     countdownFrom: timeLimit,
                //     warnAt: timeLimit,
                //     onWarn: function () {
                //         //
                //     },
                //     eachSecond: function () {
                //         tools.secondsToHMS(timer.time(), {
                //             useHours: false,
                //             minutesTag: "m ",
                //             secondsTag: "s",
                //             useLeadingZeroes: false
                //         });
                //     },
                //     onFinish: function () {
                //         recycle ? endSequence("timeTrial") : endSequence("timeUp");
                //     }
                // });


                assignment.directions.show("cardDrop", {
                    directions: myJSON.assignment.directions,
                });


                numberPairsPerSet = myJSON.number_sentakushi || numberPairsPerSet;
                numberPairsPerSet = Math.min(numberPairsPerSet, myJSON.problem.length);


                assignment.fixedProblemHolder({
                    onSlideUp: function () {
                        $("#directions").hide();
                    },
                    onSlideDown: function () {
                        $("#directions").show();
                    }
                });


                wordPool = myWordPool({
                    baseArray: myJSON.problem,
                    shuffle: true
                });


                assignment.setRevolvingBackgroundImage($cardDropMain);


                assignment.startButton({
                    button: $("#start-button"),
                    buttonAlternate: $("html"),
                    callback: function () {
                        score.markTimeOfAnswer();
                        // timer.start();
                        score.startTimer();
                        nextProblem();
                        bgm.play();
                    }
                });
            });





            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */




            function nextProblem() {


                const randColor = tools.pickDarkColor();


                let englishArray = [];
                let japaneseArray = [];


                remainingPairs = numberPairsPerSet;


                cardsFrame.reset();


                wordPool.getArrayOf(numberPairsPerSet).forEach(function (thisPair, index) {


                    let englishWord = thisPair.find(item => tools.isEnglish(item));
                    englishWord = tools.getIdealAnswer(englishWord); // the "scrubbed" word, for display


                    const japaneseWord = thisPair.find(item => tools.isJapanese(item));


                    const $englishCard = newCard("english", englishWord, index, randColor);
                    const $japaneseCard = newCard("japanese", japaneseWord, index, randColor);


                    $englishCard.data({ englishWord: englishWord, japaneseWord: japaneseWord });
                    $japaneseCard.data({ englishWord: englishWord, japaneseWord: japaneseWord });


                    englishArray.push($englishCard);
                    japaneseArray.push($japaneseCard);
                });


                englishArray = tools.shuffle(englishArray);
                japaneseArray = tools.shuffle(japaneseArray);


                englishArray.forEach(function ($thisCard, index) {
                    const $engCard = $thisCard;
                    const $japCard = japaneseArray[index];
                    cardsFrame.prepend($engCard);
                    cardsFrame.append($japCard);
                });


                cardsFrame.adjustCardSize();


                if (myJSON.misc && myJSON.misc.fontSize) {
                    $(".text-holder").css({ fontSize: myJSON.misc.fontSize });
                }


                cardsFrame.show();


                $(".draggable").draggable({
                    stack: ".card",
                    containment: "#cardDropMain",
                    revert: function () {

                        // only reverting if the card has class dropped-on-invalid-target,
                        // which it only gets on an invalid drop
                        if ($(this).hasClass("dropped-on-invalid-target")) {
                            $(this).removeClass("dropped-on-invalid-target");
                            return true;
                        }

                        // otherwise not reverting - like, when it's not dropped on anything
                        return false;
                    },
                    revertDuration: 200
                });


                $(".droppable").droppable({
                    accept: ".draggable", // accepting any card with '.draggable' (which is all of them), even if it isn't correct
                    drop: function (event, droppedWord) { // checking if the card dropped matches


                        const droppedOnKey = $(this).data("key");
                        const draggedCardKey = $(droppedWord.draggable[0]).data("key");
                        const $topCard = $(droppedWord.draggable);
                        const $bottomCard = $(this);


                        droppedOnKey === draggedCardKey ? goodDrop($topCard, $bottomCard) : badDrop($topCard, $bottomCard, droppedWord);
                    }
                });
            }


            function badDrop($topCard, $bottomCard, droppedWord) {


                $(droppedWord.draggable[0]).addClass("dropped-on-invalid-target");
                cardsFrame.shake();


                score.number_mistakes++;
                scorebar.incrementWrong();
                soundEffects.play("wrongSound");


                const englishWord1 = $topCard.data("englishWord");
                const englishWord2 = $bottomCard.data("englishWord");
                const japaneseWord1 = $topCard.data("japaneseWord");
                const japaneseWord2 = $bottomCard.data("japaneseWord");


                if (myJSON.assignment.use_user_vocab) {
                    tangocho.add({ english: englishWord1, japanese: japaneseWord1 });
                    tangocho.add({ english: englishWord2, japanese: japaneseWord2 });
                }


                if (mistakesLine && score.number_mistakes >= mistakesLine) {
                    endSequence("tooManyMistakes");
                    return;
                }
            }


            function goodDrop($topCard, $bottomCard) {


                soundEffects.play("correctSound");
                scorebar.incrementCorrect();
                score.number_correct += 1;


                $topCard.droppable("disable").draggable("disable").addClass("fadedOut");
                $bottomCard.droppable("disable").draggable("disable").addClass("fadedOut");


                setTimeout(function () {
                    $topCard.css({ zIndex: -1 });
                    $bottomCard.css({ zIndex: -1 });
                }, 2000);


                // making the items numb to touch, so that the screen, which should be undraggable on mobile, isn't draggable where the card is
                tools.numbToTouch($bottomCard);
                tools.numbToTouch($topCard);


                remainingPairs -= 1;


                if (remainingPairs <= 0) {


                    numberCompletedSets += 1;


                    if (numberRounds && numberCompletedSets >= numberRounds) {
                        endSequence("allAnswered");
                        return;
                    }


                    setTimeout(nextProblem, 1000);
                }
            }


            const endSequence = (function () {


                let hasBeenCalled = false;
                const passConditions = {
                    tooManyMistakes: false,
                    timeUp: false,
                    allAnswered: true,
                    timeTrial: true
                };


                return function (result) {


                    if (hasBeenCalled) { return; }


                    hasBeenCalled = true;
                    // timer.stop();
                    score.stopTimer();
                    assignment.gambariTimeStop();
                    bgm.pause();


                    const results = {
                        time_taken: score.time_taken(),
                        number_problems: numberPairsPerSet * numberRounds,
                        number_mistakes: score.number_mistakes,
                        passed: passConditions[result],
                    };


                    assignment.send_results(results, function () {
                        setTimeout(function () {


                            const data = [
                                { label: "時間", value: score.time_taken() + " 秒" },
                                { label: "問題数", value: results.number_problems ? results.number_problems + " 問" : "-" },
                                { label: "正解", value: score.number_correct + " 問" },
                                { label: "間違い", value: score.number_mistakes }
                            ];


                            const wordsToReview = tools.showMistakenVocab(tangocho.getItems());
                            if (wordsToReview && myJSON.assignment.use_user_vocab) {
                                data.push({
                                    label: "復習しよう！",
                                    value: wordsToReview,
                                });
                            }


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
