/* jshint expr: true */



define(
    [
        "jquery",
        "assignment",
        "tools",
        "helpers/shakeElement",
        "helpers/processSentence",
        "helpers/adjustTextInputWidth",
        "helpers/AudioLoader",
        "helpers/scorebox",
        "helpers/SoundEffects",
        "helpers/Timer",
        "helpers/confetti",
    ],
    function(
        $,
        assignment,
        tools,
        shake,
        processSentence,
        adjustTextInputWidth,
        myAudio,
        myScorebox,
        SoundEffects,
        Timer,
        confetti
    ) {


        window.log = console.log;


        const soundEffects = new SoundEffects({
            container: $("#sounds-stuff"),
            playThisOnCheckboxCheck: "tick",
            checkBoxTextAlign: "left",
            sounds: {
                correct: "/sounds/fill_blanks/correctSound.mp3",
                tick: "/sounds/fill_blanks/tick.mp3",
                wrong: "/sounds/fill_blanks/wrongSound.mp3"
            }
        });


        let myJSON,
            timer,
            scorebox,
            mistakesLine,
            timeLimit,
            audio,
            useAudio;


        const score = tools.score(),
            $startButton = $("#start-button"),
            $playButton = $("#play-button"),
            textInputWidthAdjuster = adjustTextInputWidth(40, 10);


        const textHolder = TextHolder();


        assignment.fixedProblemHolder({
            onSlideUp: function() {
                $("#fillBlanksMain").addClass("no-border");
                $("#directions").hide();
            },
            onSlideDown: function() {
                $("#fillBlanksMain").removeClass("no-border");
                $("#directions").show();
            }
        });


        const nextButton = assignment.nextButton({
            button: $("#next-button"),
            buttonAlternate: $("#fillBlanksMain"),
            callback: newProblem
        });


        // when the page is clicked, putting focus on the first text input, unless
        // a text input already has the focus
        $("#text-holder").click(function() {
            if (!$(document.activeElement).hasClass("my-input")) {
                textHolder.focusFirst();
            }
        });


        const problemNumber = (function() {


            const $problemNumberHolder = $("#problem-number-holder");
            let number = 0;


            function increment() {
                number += 1;
                $problemNumberHolder.text(number + ".");
            }


            return { increment, };
        }());


        function createNewInput(obj) {


            if (!obj || !obj.form || !obj.answer || !obj.onCorrect || !obj.onWrong) {
                console.log("createNewInput got some bad parameters!");
                return false;
            }


            const $input = obj.form.find(".my-input"),
                answer = obj.answer,
                onCorrect = obj.onCorrect,
                onWrong = obj.onWrong,
                sentakushi = obj.sentakushi || [],
                inputAnsweredClass = "answered",
                blankWrongAnswerClass = "wrong-answer";


            if ($input.is("select")) {


                $input.append($("<option value='' class='remove-on-change' style='text-align: center;'>選択</option>"));
                sentakushi.forEach(function(item) {
                    const $option = $("<option>").val(item).text(item);
                    $input.append($option);
                });


                $input.on("focus blur", function() {
                    hint.hideButton();
                }).on("change", function() {
                    $input.closest("form").submit();
                    $input.css({ width: tools.getSelectOptionWidth($input) + 45 });
                });
            }


            if ($input.is("input")) {
                $input.on("keydown", function() {
                    textInputWidthAdjuster($(this));
                    $(this).removeClass(blankWrongAnswerClass);
                }).on("keyup", function() {
                    const trimmmedValue = $(this).val().trim();
                    $(this).val(trimmmedValue);
                }).on("focus", function() {
                    $input.addClass("focused");
                    hint.showButton();
                }).on("change", function() {
                    $input.val($input.val().trim());
                }).on("blur", function() {
                    $input.removeClass("focused").submit();
                    // hint.hideButton();
                });
            }


            $input.closest("form").submit(function(e) {
                e.preventDefault();
                tools.momentarilyDisable($input, function() {
                    if ($input.val() === answer) {

                        // NEW TEST replacing select box with span
                        $input.replaceWith($("<span>XXX</span>").html(answer).addClass(inputAnsweredClass));

                        onCorrect();
                    } else if ($input.val() !== "") {
                        $input.addClass(blankWrongAnswerClass);
                        onWrong();
                    }
                });
            });
        }


        assignment.getProblemData(function(d) {


            myJSON = d;
            timeLimit = myJSON.assignment.time_limit;
            mistakesLine = myJSON.assignment.mistakes_limit;


            if (myJSON.number_problems && myJSON.number_problems > 1) {
                tools.whittleDownArray(myJSON.problem, myJSON.number_problems);
            }


            useAudio = myJSON.useAudio;


            scorebox = myScorebox({
                correctCounter: {
                    numberSegments: myJSON.problem.length,
                    recycle: false,
                },
                wrongCounter: {
                    numberSegments: mistakesLine,
                    recycle: mistakesLine ? false : true,
                },
                clock: {
                    duration: timeLimit ? (timeLimit * 1000) : (30 * 1000),
                    labelText: timeLimit ? timeLimit : "0",
                    repeat: true,
                    dotMode: timeLimit ? false : true,
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
                    endSequence("timeUp");
                }
            });


            assignment.directions.show(useAudio ? "fill_blanks" : "fill_blanks_written", {
                directions: myJSON.assignment.directions,
                mistakes: mistakesLine,
                numProblems: myJSON.problem.length,
                time: timeLimit,
                timeTrial: false
            });


            if (myJSON.assignment.shuffle) {
                myJSON.problem = tools.shuffle(myJSON.problem);
            }


            if (useAudio) {
                assignment.controlPanel.useVoices();
                audio = myAudio({
                    audioFiles: myJSON.audioFiles, // format {"dog": "/path/to/file.mp3", "cat": "/path/to/file.mp3"}
                    playButton: $("#play-button"), // NEW TEST changed this, added hash mark & jQuery goodness
                    playButtonClassOnPlay: "playing",
                    playButtonClassOnPause: "", // erasing defaults
                    onPlay: textHolder.focusFirst,
                    onReady: wireUpStartButton,
                    onLoadError: function() {
                        log("Failed to load sounds!");
                    }
                });
            } else {
                $playButton.remove();
                wireUpStartButton();
            }


            // FINALLY fading in the #mainProblemsHolder
            $("#mainProblemsHolder").fadeTo(200, 1);
        });


        function wireUpStartButton() {
            $startButton.removeClass("hidden");
            assignment.startButton({
                button: $startButton,
                buttonAlternate: $("#fillBlanksMain"),
                callback: function() {
                    score.startTimer();
                    $("#controls-holder").show();
                    newProblem(); // used to be a setTimeout at 500ms
                }
            });
        }


        function newProblem() {


            // audio && audio.stop();
            confetti.stopAndRemove();


            if (!myJSON.problem.length) {
                endSequence("allAnswered");
                return;
            }


            textHolder.clear();
            problemNumber.increment();
            timer.start();
            scorebox.clock.start();


            const thisProblem = myJSON.problem.shift();


            let english = thisProblem.find(item => tools.isEnglish(item));
            const japanese = thisProblem.find(item => tools.isJapanese(item));


            english = tools.removeExtraWhiteSpace(english);


            if (audio) {
                audio.stop();
                audio.play(english);
                $playButton.off("click").click(function() {
                    audio.stop();
                    audio.play(english);
                });
            } else {
                $("#japanese-holder").append(japanese);
            }


            const processedSentence = processSentence(english);


            processedSentence.pieces.forEach(item => {


                if (typeof item === "string") {
                    textHolder.addWord(item);
                    return;
                }


                /*
                 *
                 *      Beyond this point it's an object, so creating a blank, or a select box!
                 *
                 */


                const $form = textHolder.addForm(item.sentakushi.length),
                    $hintSpan = $form.find(".hint-holder");


                hint.registerHint($hintSpan, item.correctAnswer);


                createNewInput({
                    form: $form,
                    sentakushi: item.sentakushi,
                    answer: item.correctAnswer,
                    onCorrect: function() {
                        correctAnswerHandler($form);
                    },
                    onWrong: function() {
                        wrongAnswerHandler($form.find(".my-input"));
                    }
                });
            });


            textHolder.activate();
        }


        const hint = (function() {


            const $hintButton = $("#hint-button"),
                timeToShowHint = 2000,
                originalText = $hintButton.text(),
                hintButtonSleepTime = 11,
                isHiddenClass = "is-hidden";


            let timerInterval = null,
                hintDisabled = false,
                hintHolders = [];


            $hintButton.click(function() {


                if (hintDisabled) { return; }
                hintDisabled = true;


                show();


                // counting down to removing the disabled class from the button
                let counter = hintButtonSleepTime;
                timerInterval = setInterval(tick, 1000);
                tick();


                function tick() {
                    counter--;
                    $hintButton.text("( " + counter + " )");
                    if (counter === 0) {
                        clearInterval(timerInterval);
                        hintDisabled = false;
                        $hintButton.text(originalText);
                    }
                }
            });


            function registerHint($span, answer) {
                hintHolders.push({ $span, answer, });
            }


            function clearHints() {
                hintHolders.forEach(thisHint => thisHint.$span.text(""));
                hintHolders.length = 0;
            }


            function reset() {
                clearHints();
                clearInterval(timerInterval);
                $hintButton.text(originalText);
                hintDisabled = false;
            }


            function show() {
                hintHolders.forEach(function(thisHint) {
                    const $hintSpan = thisHint.$span;
                    if (!$hintSpan.closest("form").find("input").hasClass("active")) {
                        return false;
                    }
                    $hintSpan.text(thisHint.answer);
                    const myTimeout = setTimeout(function() {
                        $hintSpan.fadeTo(2000, 0, function() {
                            $hintSpan.text("").css({ opacity: 1 });
                        });
                    }, timeToShowHint);
                    $hintSpan.off("click").on("click", function() {
                        clearTimeout(myTimeout);
                        $hintSpan.text("").css({ opacity: 1 });
                    });
                });
                textHolder.focusFirst();
            }


            function hideButton() {
                $hintButton.addClass(isHiddenClass);
            }


            function showButton() {
                $hintButton.removeClass(isHiddenClass);
            }


            return {
                show,
                registerHint,
                clearHints,
                reset,
                hideButton,
                showButton
            };
        }());


        function correctAnswerHandler($form) {


            confetti.makeNew({
                parent: $form,
                numSparks: 10,
                duration: 0.5,
                scatterWidth: window.innerWidth / 6,
                scatterHeight: window.innerHeight / 4,
                pieceWidth: 10,
                pieceHeight: 10,
            });


            // if there are still active (==unanswered) boxes in THIS PARTICULAR PROBLEM, then exiting here
            if (textHolder.numBlanksActive() > 0) {
                textHolder.focusFirst();
                return;
            }


            /* Beyond this point, all blanks for this problem have been answered! */


            // disabling the button and replacing the play-button with a check
            scorebox.correctCounter.increment();
            score.number_correct++;
            if (soundEffects) { soundEffects.play("correct"); }
            if (nextButton) { nextButton.show(); }
            if (hint) { hint.clearHints(); }


            return true;
        }


        const wrongAnswerHandler = (function() {


            let previousAnswer = "";


            return function($currentInput) {


                if ($currentInput.val() === "" || $currentInput.val() === previousAnswer) { return false; }


                previousAnswer = $currentInput.val();


                scorebox.wrongCounter.increment();
                score.number_mistakes++;
                if (soundEffects) { soundEffects.play("wrong"); }


                shake($currentInput, {
                    duration: 250,
                    amplitude: 3
                });


                if (mistakesLine && score.number_mistakes >= mistakesLine) {
                    endSequence("tooManyMistakes");
                }


                return true;
            };
        }());


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
                            { label: "間違い", value: score.number_mistakes + " 問" }
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


        function TextHolder() {


            const $wordsHolder = $("#words-holder");
            const $japanseHolder = $("#japanese-holder");
            const $inputFormMaster = $wordsHolder.find(".text-input-form.my-template").detach().removeClass("my-template");


            function addWord(word) {
                const $span = $("<span class='word'>").text(word + " ");
                $wordsHolder.append($span);
            }


            function addForm(numSentakushi) {
                const $form = $inputFormMaster.clone().appendTo($wordsHolder);
                $form.find(numSentakushi > 1 ? "input" : "select").remove(); // removing the unused element
                if ($form.prev().hasClass("word")) {
                    $form.prev().text($form.prev().text().trim());
                }
                return $form;
            }


            function clear() {
                $wordsHolder.empty();
                $japanseHolder.empty();
            }


            function markAnswered() {
                $(this).addClass("answered");
            }


            function numBlanksActive() {
                return $wordsHolder.find(".my-input.active").length;
            }


            function focusFirst() {
                const $next = $wordsHolder.find(".my-input.active").first();
                $next.getInputType() !== "select" && $next.focus();
                return this;
            }


            function activate() {
                $wordsHolder.find(".my-input").attr({ disabled: false });
                focusFirst();
            }


            function getElement() {
                return $wordsHolder.find(".my-input.active").first();
            }


            return {
                addWord,
                addForm,
                clear,
                activate,
                markAnswered,
                focusFirst,
                numBlanksActive,
                getElement,
            };
        }


    });