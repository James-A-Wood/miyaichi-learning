/* jshint expr: true */

/*
 *
 *
 *
 *      True-False is automatically detected based on the choices;
 *      or, add JSON {"trueFalse": true} to the "misc" thing
 *
 *
 *      True-False choices default to "正しい" and "正しくない";
 *      or, specify {"terms": [trueTerm, falseTerm]} in the JSON
 *
 *
 *      To mix choices from all problems, not just the current problem,
 *      either make sure there's only one choice for each problem,
 *      or add {"globalSentakushi":true} to the JSON
 *
 *
 *
 *
 */


define(
    [
        "assignment",
        "jquery",
        "tools",
        "helpers/problemsAndChoicesList",
        "helpers/AudioLoader",
        "helpers/SoundEffects",
        "helpers/Timer",
        "helpers/scorebox",
        "helpers/tangocho",
    ],
    function(
        assignment,
        $,
        tools,
        sentencesList,
        AudioLoader,
        SoundEffects,
        Timer,
        myScorebox,
        tangocho
    ) {


        let audio,
            timer,
            myJSON,
            recycle,
            scorebox,
            timeLimit,
            mistakesLine,
            currentProblem = "",
            problems = {},
            score = tools.score(),
            useUserVocab = false,
            problemHasBeenAnswered = false;


        assignment.fixedProblemHolder();
        assignment.controlPanel.useVoices();
        score.hintButtonUsed = 0;


        function ButtonPrototype() {
            this.mapKeyToMethod = function(obj) {
                tools.keydown(obj.keys, obj.method);
            };
        }


        function PlayAudioButton(obj = {}) {


            const $playButton = obj.playButton || $("#playButton");


            $playButton.click(function() {
                currentProblem && audio.play(currentProblem.question);
            });


            function click() {
                $playButton.click();
            }


            function nowPlaying() {
                $playButton.addClass("nowPlaying");
            }


            function stoppedPlaying() {
                $playButton.removeClass("nowPlaying");
            }


            this.nowPlaying = nowPlaying;
            this.stoppedPlaying = stoppedPlaying;
            this.click = click;
        }
        PlayAudioButton.prototype = new ButtonPrototype();


        function NextButton($nextButton) {


            const checkAnswerText = $nextButton.text() || "解答する";
            const nextProblemText = "次へ";


            function enable() {
                $nextButton.prop("disabled", false);
            }


            function disable() {
                $nextButton.prop("disabled", true);
            }


            function click() {
                $nextButton.click();
            }


            function setNextProblemMode(showOrHide) {
                enable();
                $nextButton.text(nextProblemText);
                $nextButton.off("click").on("click", nextProblem);
                smileyFace(showOrHide);
            }


            function setCheckAnswerMode() {
                disable();
                $nextButton.text(checkAnswerText);
                $nextButton.off("click").on("click", checkAnswer);
                smileyFace(false);
            }


            function smileyFace(showIt) {
                $("#smiley").css({ visibility: showIt ? "visible" : "hidden" });
            }


            this.setNextProblemMode = setNextProblemMode;
            this.setCheckAnswerMode = setCheckAnswerMode;
            this.enable = enable;
            this.disable = disable;
            this.click = click;
        }
        NextButton.prototype = new ButtonPrototype();


        function HintButton() {


            const $hintButton = $("#hintButton");


            let numTimesUsed = 0;
            let hasBeenUsed = false;


            $hintButton.click(hintButtonClickHandler);


            disable();


            function disable() {
                $hintButton.attr("disabled", true);
            }


            function enable() {
                $hintButton.attr("disabled", false);
            }


            function click() {
                $hintButton.click();
            }


            function reset() {
                hasBeenUsed = false;
                answerHolder.clear();
                $hintButton.attr("disabled", false);
            }


            function hintButtonClickHandler() {
                if (!hasBeenUsed) {
                    hasBeenUsed = true;
                    score.hintButtonUsed += 1;
                    numTimesUsed += 1;
                    disable();
                    $("#hint-button-times-used").text("x " + numTimesUsed);
                    answerHolder.showHint();
                }
            }


            this.reset = reset;
            this.disable = disable;
            this.enable = enable;
            this.click = click;
        }
        HintButton.prototype = new ButtonPrototype();


        const nextButton = new NextButton($("#nextButton"));
        const playButton = new PlayAudioButton();
        const hintButton = new HintButton();
        const choices = new Choices();
        const answerHolder = new AnswerHolder();


        function AnswerHolder() {


            const $answerHolderFrame = $("#answer-holder-frame");
            const $answerHolder = $("#answerHolder");
            const $answerHolderLabel = $("#answer-holder-label");
            const $smiley = $("#smiley");
            const answerLabelText = "答え";
            const hintLabelText = "ヒント";


            function showAnswer(isRight) {
                clear();
                $answerHolder.html(currentProblem.question);
                $answerHolderFrame.addClass(isRight ? "rightAnswer" : "wrongAnswer");
                isRight && $smiley.show();
            }


            function showHint() {
                clear();
                $answerHolderFrame.addClass("hintMode");
                $answerHolderLabel.text(hintLabelText);
                $answerHolder.html(currentProblem.question);
            }


            function clear() {
                $answerHolderFrame.removeClass("hintMode rightAnswer wrongAnswer");
                $answerHolderLabel.text(answerLabelText);
                $answerHolder.empty();
                $smiley.hide();
            }


            this.showAnswer = showAnswer;
            this.showHint = showHint;
            this.clear = clear;
        }


        function Choices() {


            const $choicesHolder = $("#choices-holder");
            const $choiceMaster = $choicesHolder.find(".radio-label.my-template").detach().removeClass("my-template");
            // const $problemHolderMaster = $choicesHolder.find("#problem-holder").detach().removeClass("my-template");


            let $correctChoice;


            // keys 1~10 trigger choices, from top to bottom
            tools.keydown([49, 50, 51, 52, 53, 54, 55, 56, 57, 58], function(e) {
                const code = e.keyCode;
                $(".hidden-radio").eq(code - 49).click();
            });


            // up arrow sets focus to the previous radio, or to the last (bottom) one
            tools.keydown(38, function() {
                selectedChoice() ? selectedChoice().prev().click() : $(".hidden-radio").last().click();
            });


            // down arrow selects the next choice, or the first (top) one
            tools.keydown(40, function() {
                selectedChoice() ? selectedChoice().next().click() : $(".hidden-radio").first().click();
            });


            function getCorrectChoice() {
                return $correctChoice;
            }


            function disable() {
                $(".hidden-radio").prop({ disabled: "true" });
            }


            function enable() {
                $(".hidden-radio").prop({ disabled: "false" });
            }


            function noAnswerSelected() {
                return $(".hidden-radio:checked").length ? false : true;
            }


            function highlightCorrectChoice() {
                $correctChoice.addClass("answeredRight answered");
                fadeWrongChoices();
            }


            function selectedChoice() {
                if ($(".hidden-radio:checked").length) {
                    return $(".hidden-radio:checked").closest("label");
                }
                return false;
            }


            function isCorrect() {
                if (selectedChoice().is($correctChoice)) {
                    return true;
                }
                return false;
            }


            function fadeWrongChoices() {
                $choicesHolder.find("label").not($correctChoice).addClass("faded");
            }


            function markSelectionAsIncorrect() {
                selectedChoice().addClass("answeredWrong answered");
            }


            function display() {


                $choicesHolder.hide().empty().removeClass("answered");


                currentProblem.choices.forEach(function(thisSentence, index) {


                    const $choice = $choiceMaster.clone().appendTo($choicesHolder);
                    $choice.find(".label-text").append(thisSentence);
                    $choice.find("input").click(function() {
                        nextButton.enable();
                    }).on("change", () => {
                        $(".radio-label").removeClass("selected");
                        $choice.addClass("selected");
                    });


                    if (currentProblem.indexOfCorrectAnswer === index) {
                        $correctChoice = $choice;
                    }
                });


                $choicesHolder.fadeIn("slow");
            }


            function clear() {
                $choicesHolder.empty();
            }


            this.getCorrectChoice = getCorrectChoice;
            this.isCorrect = isCorrect;
            this.display = display;
            this.selectedChoice = selectedChoice;
            this.highlightCorrectChoice = highlightCorrectChoice;
            this.markSelectionAsIncorrect = markSelectionAsIncorrect;
            this.clear = clear;
            this.noAnswerSelected = noAnswerSelected;
            this.disable = disable;
            this.enable = enable;
        }


        const soundEffects = new SoundEffects({
            checkbox: $("#sound-effects-checkbox"),
            sounds: {
                correct: "/sounds/sentence_choosing/correctSound.mp3",
                wrong: "/sounds/sentence_choosing/wrongSound.mp3",
                tick: "/sounds/tick.mp3"
            },
            playThisOnCheckboxCheck: "tick",
        });


        assignment.getProblemData(function(d) {


            myJSON = d;


            assignment.showImage({
                images: d.images,
                holder: $("#image-holder"),
                onShow: function() {
                    $("body").addClass("with-image");
                }
            });


            timeLimit = myJSON.assignment.time_limit;
            recycle = myJSON.assignment.recycle;
            mistakesLine = myJSON.assignment.mistakes_limit;
            useUserVocab = !!parseInt(myJSON.assignment.use_user_vocab); // because it might be string "0", which evaluates to TRUE


            // removing extra problems
            if (myJSON.number_problems && myJSON.number_problems !== "0") {
                myJSON.problem = tools.whittleDownArray(myJSON.problem, myJSON.number_problems);
            }


            // putting the words list in the problems variable
            problems = sentencesList({
                problems: myJSON.problem,
                numberSentakushi: parseInt(myJSON.number_sentakushi) || 3,
                recycleProblems: recycle ? true : false,
                misc: myJSON.misc,
            });


            assignment.directions.show(problems.isTrueFalse() ? "trueFalse" : "chooseMeaning", {
                directions: myJSON.assignment.directions,
                mistakes: mistakesLine,
                numProblems: recycle ? null : myJSON.problem.length,
                time: timeLimit,
                timeTrial: recycle ? true : false
            });


            scorebox = myScorebox({
                correctCounter: {
                    numberSegments: myJSON.problem.length,
                    recycle: recycle ? true : false
                },
                wrongCounter: {
                    numberSegments: mistakesLine,
                    recycle: mistakesLine ? false : true,
                    fill: "deeppink"
                },
                clock: {
                    duration: timeLimit ? (timeLimit * 1000) : (60 * 1000),
                    labelText: timeLimit || "0",
                    repeat: true,
                    dotMode: timeLimit ? false : true
                }
            });


            audio = AudioLoader({
                audioFiles: myJSON.audioFiles, // required
                onPlay: playButton.nowPlaying,
                onEnded: playButton.stoppedPlaying,
                preloadAudio: false,
                onReady: prepareStage,
                onLoadError: function(e) {
                    //
                }
            });
        });


        function prepareStage() {


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
                    recycle ? endSequence("timeTrial") : endSequence("timeUp");
                }
            });


            assignment.startButton({
                button: $("#start-button"),
                buttonAlternate: $("html"),
                callback: function() {


                    score.startTimer();
                    nextProblem();


                    // adding keydown listeners HERE so they don't collide with the startButton keydown listener
                    playButton.mapKeyToMethod({ keys: 32, method: playButton.click });
                    nextButton.mapKeyToMethod({ keys: [39, 13], method: nextButton.click });
                    hintButton.mapKeyToMethod({ keys: 72, method: hintButton.click });
                }
            });


            // fading in the #mainProblemsHolder
            $("#mainProblemsHolder").fadeTo(200, 1);
        }


        function nextProblem() {


            problemHasBeenAnswered = false;


            audio.stopAll();
            hintButton.reset();
            answerHolder.clear();
            currentProblem = problems.pickRandomProblem();
            timer.start();
            scorebox.clock.start();
            nextButton.setCheckAnswerMode();
            hintButton.enable();
            choices.display();


            if (myJSON.misc.useMisspelled) {
                $("#problem-holder").prependTo($("#choices-holder")).text(currentProblem.correctAnswer);
            }


            setTimeout(function() {
                audio.play(currentProblem.question);
            }, 500);
        }


        function checkAnswer() {


            if (choices.noAnswerSelected()) return;
            if (problemHasBeenAnswered) return;


            problemHasBeenAnswered = true;
            choices.disable();
            hintButton.disable();
            audio.stopAll();


            choices.isCorrect() ? correctAnswerHandler() : wrongAnswerHandler();
        }


        function correctAnswerHandler() {


            scorebox.correctCounter.increment().showNumber();
            score.number_correct += 1;
            soundEffects.play("correct");
            answerHolder.showAnswer(true); // true == yeah, it's right
            choices.highlightCorrectChoice();
            problems.removeCurrentProblem();


            if (problems.getNumberRemaining() > 0 || recycle) {
                nextButton.setNextProblemMode(true); // "true" means "show smiley"
                return;
            }


            endSequence("allAnswered");
        }


        function wrongAnswerHandler() {


            scorebox.wrongCounter.increment().showNumber();
            soundEffects.play("wrong");
            score.number_mistakes += 1;
            nextButton.disable();
            choices.markSelectionAsIncorrect();


            if (useUserVocab) {


                const item1 = currentProblem.question;
                const item2 = currentProblem.correctAnswer;


                let e1 = (tools.isEnglish(item1)) ? item1 : item2;
                let j1 = (tools.isJapanese(item1)) ? item1 : item2;


                tangocho.add({ english: e1, japanese: j1 });
            }


            // highlighting the correct choice, after a pause
            setTimeout(function() {
                choices.highlightCorrectChoice();
                answerHolder.showAnswer(false); // false == wrongAnswer


                if (mistakesLine && score.number_mistakes >= mistakesLine) {
                    endSequence("tooManyMistakes");
                    return;
                }


                setTimeout(function() {
                    nextButton.setNextProblemMode(false); // "false" means "no smiley"
                }, 2000);
            }, 1000);
        }


        const endSequence = (function() {


            let hasFired = false;


            const passConditions = {
                tooManyMistakes: false,
                timeUp: false,
                allAnswered: true,
                timeTrial: true
            };


            return function(result) { // "tooManyMistakes", "timeUp", "timeTrial", or "allAnswered"


                if (hasFired) return;


                hasFired = true;
                timer && timer.stop();
                scorebox.clock && scorebox.clock.finish();
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
                            { label: "時間", value: results.time_taken + " 秒" },
                            { label: "問題数", value: results.number_problems + " 問" },
                            { label: "間違い", value: score.number_mistakes }
                        ];


                        let wordsToReview = tools.showMistakenVocab(tangocho.getItems());
                        if (wordsToReview && useUserVocab) {
                            data.push({ label: "復習しよう", value: wordsToReview });
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
    }
);