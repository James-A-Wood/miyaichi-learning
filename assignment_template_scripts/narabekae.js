/* jshint expr: true */

define(
    [
        "assignment",
        "jquery",
        "tools",
        "helpers/shakeElement",
        "helpers/AudioLoader",
        "helpers/Timer",
        "helpers/SoundEffects",
        "helpers/scorebox",
        "konva/circleCounter",
        "jqueryui",
        "bootstrap",
    ],
    function(
        assignment,
        $,
        tools,
        shake,
        myAudio,
        Timer,
        SoundEffects,
        myScorebox
    ) {


        const $playButton = $("#play-button");
        const $nextButton = $("#next-button");
        const $narabekaeMain = $("#narabekaeMain");
        const $wordsHolder = $("#words-holder");
        const $japaneseHolder = $("#japaneseHolder");
        const $dragMessage = $("#dragMessage.my-template").detach().removeClass("my-template");
        const score = tools.score();


        let myJSON, timer, audio, scorebox, mistakesLine, timeLimit, recycle, useAudio,
            draggedObjectX, draggedObjectY, theCurrentProblem, allProblemsArray = [],
            allWordsArray = [],
            remainingProblemsArray = [],
            remainingWordsArray = [],
            showJapanese = true,
            isBetweenProblems = true;


        const nextButton = assignment.nextButton({
            button: $nextButton,
            callback: nextProblem,
            buttonAlternate: $("#dragTarget")
        });


        const dragTarget = (function() {


            const $dragTarget = $("#dragTarget");


            function restart() {
                $dragTarget.removeClass("finished").droppable({
                    accept: ".floatingWord",
                    tolerance: "touch",
                    drop: checkAnswer
                });
            }


            function finished() {
                $dragTarget.addClass("finished");
            }


            return {
                restart,
                finished,
            };
        }());


        const choicesHolder = (function() {


            const $choicesHolder = $("#choicesHolder");


            function numbify() {
                tools.numbToTouch($choicesHolder);
            }


            // NECESSARY to trigger page redraw, in order to repeat the animation.
            function setWidth() {
                $choicesHolder.width($choicesHolder.width);
            }


            function empty() {
                $choicesHolder.empty();
            }


            function addWord($word) {
                $choicesHolder.append($word);
            }


            return {
                numbify,
                setWidth,
                empty,
                addWord
            };
        }());


        const sounds = new SoundEffects({
            container: $("#sounds-stuff"),
            checkBoxTextAlign: "left",
            sounds: {
                wrong: "/sounds/narabekae/wrongSound.mp3",
                correct: "/sounds/narabekae/correctSound.mp3",
                problemFinish: "/sounds/narabekae/problemFinish.mp3",
                tick: "/sounds/tick.mp3"
            },
            playThisOnCheckboxCheck: "tick"
        });


        // getting the problemData and processing it
        assignment.getProblemData(function(d) {


            /*
             *
             *      Each problem is an array like this:
             *
             *      [
             *          "This is the English audio.",
             *          "This_is_the_sentakushi_block.",
             *          "これは日本語の意味。"
             *      ]
             *
             *
             *
             */


            myJSON = d;
            timeLimit = myJSON.assignment.time_limit;
            mistakesLine = myJSON.assignment.mistakes_limit;
            const $startButton = $("#start-button");
            useAudio = myJSON.useAudio;


            // whittling down extra problems
            if (myJSON.number_problems) {
                tools.whittleDownArray(myJSON.problem, myJSON.number_problems);
            }


            // instantiating the scorebox - cool!
            scorebox = myScorebox({
                correctCounter: {
                    numberSegments: myJSON.problem.length,
                    recycle: myJSON.assignment.recycle ? true : false
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
                },
                onFinish: function() {
                    endSequence(recycle ? "timeTrial" : "timeUp");
                }
            });


            assignment.directions.show(useAudio ? "narabekae_spoken" : "narabekae_written", {
                directions: myJSON.assignment.directions,
                mistakes: mistakesLine,
                numProblems: myJSON.problem.length,
                time: timeLimit,
                timeTrial: recycle ? true : false
            });


            allProblemsArray = myJSON.problem.concat();
            remainingProblemsArray = allProblemsArray.concat();


            $("#mainProblemsHolder").fadeTo(200, 1);


            if (!useAudio) {
                audio = null;
                $playButton.remove();
                $startButton.removeClass("hidden");
                assignment.startButton({
                    button: $startButton,
                    buttonAlternate: $("html"),
                    callback: nextProblem
                });
            } else {
                audio = myAudio({
                    audioFiles: myJSON.audioFiles, // required
                    playButton: $("#play-button"), // the id, without hash mark
                    playButtonClassOnPlay: "now-playing",
                    playButtonClassOnPause: "", // erasing defaults
                    onReady: function() {
                        $startButton.removeClass("hidden");
                        assignment.startButton({
                            button: $startButton,
                            buttonAlternate: $("html"),
                            callback: nextProblem
                        });
                    },
                    onLoadError: function() {
                        log("Failed to load sounds!");
                    }
                });
            }
        });


        function nextProblem() {


            tools.keydown(13, function() { // Enter key
                $nextButton.length && $nextButton.click();
            });


            tools.keydown(32, function() { // space bar
                if ($nextButton.length) {
                    $nextButton.click();
                    return;
                }
                $playButton && $playButton.click();
            });


            theCurrentProblem = tools.pickOneFrom(remainingProblemsArray, true); // true => remove the element
            timer.start();
            scorebox.clock.start();
            score.startTimer();
            choicesHolder.numbify();
            isBetweenProblems = false;
            $wordsHolder.empty().append($dragMessage.clone());
            $japaneseHolder.removeClass("answered").empty();
            $nextButton.remove();
            choicesHolder.setWidth();


            if (myJSON.misc.hasOwnProperty("showJapanese")) {
                showJapanese = myJSON.misc.showJapanese;
            }


            const japanese = theCurrentProblem.find(item => tools.isJapanese(item));
            !useAudio && japanese && $japaneseHolder.text(`"${japanese}"`);


            const flock = assignment.processSentenceForNarabekae(theCurrentProblem[myJSON.indexOfSentakushi]);
            remainingWordsArray = flock.real;
            allWordsArray = flock.all;
            const randomWordsArray = tools.shuffle(allWordsArray.concat());


            choicesHolder.empty();


            randomWordsArray.forEach((word, counter) => {


                const randRotation = 16 - tools.pickIntFrom(30);
                const $floatingWord = $("<span class='floatingWord' />").css({
                    "-webkit-transform": `rotate(${randRotation}deg)`,
                    "-ms-transform": `rotate(${randRotation}deg)`,
                    "transform": `rotate(${randRotation}deg)`,
                    "color": tools.pickDarkColor(), // NEW TEST random color!
                }).text(word);


                choicesHolder.addWord($floatingWord);
                dropObject($floatingWord, counter++);
            });


            function dropObject($word, counter) {


                const dropDelay = 500 + (counter * 75);
                const dropDuration = 1000;


                setTimeout(function() {


                    const height = $word.outerHeight(true);
                    $word.css({ top: -height * 3 }).animate({
                        top: 0,
                        opacity: 1
                    }, dropDuration, "easeOutBounce", function() {
                        if (counter === allWordsArray.length - 1) {
                            $playButton.click();
                        }
                    });
                }, dropDelay);
            }


            // hovering over floating word turns cursor into grabby hand thing
            $(".floatingWord").on("mouseover", function() {
                $(this).addClass("word-hovered");
            }).on("mouseout", function() {
                $(this).removeClass("word-hovered");
            }).on("mousedown", function() {


                draggedObjectX = $(this).css("left");
                draggedObjectY = $(this).css("top");


                // forcing those values to be in pixels if they're 'auto' (which they are, by default, on first drag)
                if (draggedObjectX === "auto") {
                    draggedObjectX = "0px";
                }
                if (draggedObjectY === "auto") {
                    draggedObjectY = "0px";
                }
            }).draggable({
                containment: $narabekaeMain, //was window
                stack: ".floatingWord" // keeps the z-index so the dragged word is always on top
            });

            dragTarget.restart();
        }



        function checkAnswer(event, droppedWord) {


            $("#dragMessage").remove();


            const $draggedWord = $(droppedWord.draggable);
            let draggedText = $draggedWord.text();
            let correctText = remainingWordsArray[0];


            draggedText = draggedText.replace(/\_/g, " ");
            correctText = correctText.replace(/\_/g, " ");


            (draggedText === correctText) ? correctHandler(droppedWord): wrongHandler(droppedWord);
        }


        function correctHandler(droppedWord) {


            $("#dragTarget").addClass("notFinished");
            sounds.play("correct");


            let text = $wordsHolder.text().replace("...", "");
            $wordsHolder.text(text);
            $wordsHolder.append("<span class='answered-word-holder'>" + remainingWordsArray[0] + "</span> ");
            $(droppedWord.draggable).css({ visibility: "hidden" });
            remainingWordsArray.splice(0, 1);


            if (remainingWordsArray.length > 0) {
                $wordsHolder.append(" ... ");
                return;
            }


            /*  Beyond this point, this problem is finished!  */


            score.number_correct++;
            isBetweenProblems = true;
            scorebox.correctCounter.increment();


            $(".floatingWord").remove();
            $japaneseHolder.addClass("answered");


            if (!remainingProblemsArray.length) {
                endSequence("allAnswered");
                return;
            }


            choicesHolder.empty();
            dragTarget.finished();
            sounds.play("problemFinish");
            nextButton.show(500);
        }


        function wrongHandler(droppedWord) {


            sounds.play("wrong");
            score.number_mistakes += 1;
            scorebox.wrongCounter.increment();
            shake($narabekaeMain);


            if (mistakesLine && score.number_mistakes > mistakesLine) {
                endSequence("tooManyMistakes");
            }


            $(droppedWord.draggable).animate({
                top: draggedObjectY,
                left: draggedObjectX
            }, 100);
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
                audio && audio.disable().stopAll();


                const results = {
                    time_taken: score.time_taken(),
                    number_problems: myJSON.problem.length,
                    number_mistakes: score.number_mistakes,
                    passed: passConditions[result]
                };


                assignment.send_results(results, function() {
                    setTimeout(function() {


                        const data = [
                            { label: "時間", value: results.time_taken + " 秒" },
                            { label: "問題数", value: results.number_problems ? results.number_problems + " 問" : "-" },
                            { label: "正解", value: score.number_correct + " 問" },
                            { label: "間違い", value: results.number_mistakes + " 問" },
                        ];


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
            if (!isBetweenProblems) {
                audio && audio.play(theCurrentProblem.find(item => tools.isEnglish(item)));
            } else {
                $nextButton.click();
            }
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