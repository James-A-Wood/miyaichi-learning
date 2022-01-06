/* jshint expr: true */


define(
        [
            "assignment",
            "jquery",
            "tools",
            "helpers/wordPool",
            "helpers/problemsAndChoicesList",
            "helpers/SoundEffects",
            "helpers/Timer",
            "helpers/AudioLoader",
            "helpers/scorebox",
            "Konva",
            // "konva/BallShooter",
            "konva/shakeStage",
        ],
    function(
        assignment,
        $,
        tools,
        myWordPool,
        myVocabList,
        SoundEffects,
        Timer,
        audioLoader,
        myScorebox,
        Konva,
        shakeStage
    ) { //BallShooter,



        /*
        (function(obj = {}) {


            let myJSON, wordPool;


            const stage = new Konva.Stage({
                container: "scrabble-main",
                width: $("#scrabble-main").width(),
                height: $("#scrabble-main").height(),
            });
            const layer = new Konva.Layer().moveTo(stage);


            const home = {
                x: stage.width() / 2,
                y: stage.height() * 0.75,
            };


            const ballShooter = BallShooter({
                layer: layer,
                home: home,
                ballSpeed: 750,
                useShootTrail: true,
                spawnOnInsantiation: true,
                shootSound: "/sounds/shoot.mp3",
            });


            const flock = new Flock();


            function Flock(obj = {}) {


                const settings = $.extend({
                    numberFlyingWords: 3,
                    fill: "blue",
                    standardVelocity: 4, // seconds to cross stage
                }, obj);


                let direction = 1;
                let currentFlock = [];


                function newFlyingWord(text) {


                    direction *= -1;


                    const word = new Konva.Text({
                        text: text,
                        fontSize: 24,
                        fontFamily: "Arial",
                        fill: settings.fill,
                    }).moveTo(layer);


                    word.x(direction === 1 ? word.x() - word.width() : stage.width());
                    word.direction = direction;
                    animateWord(word);


                    return word;
                }


                function animateWord(word) {


                    word.y(Math.random() * stage.height() * 0.6);
                    word.endY = Math.random() * stage.height() * 0.6;


                    word.to({
                        duration: (settings.standardVelocity * 0.75) + (Math.random() * settings.standardVelocity * 0.5),
                        y: word.endY,
                        x: word.direction === 1 ? stage.width() + word.width() : -word.width(),
                        onFinish: function() {
                            word.direction *= -1;
                            // animateWord(word);
                        }
                    });
                }


                function newFlock(obj) {
                    const flockSettings = $.extend({
                        clearFlock: true,
                    });
                    if (flockSettings.clearFlock) { currentFlock.length = 0; }
                    for (let i = 0; i < settings.numberFlyingWords; i++) {
                        const array = wordPool.getNextWord();
                        const word = newFlyingWord(array[0]);
                        currentFlock.push(word);
                        word.answer = array[1];
                    }
                    return currentFlock;
                }


                return {
                    newFlock,
                };
            }


            assignment.getProblemData(function(d) {
                myJSON = d;
                wordPool = myWordPool({
                    baseArray: myJSON.problem,
                    shuffle: true
                });
                const targets = flock.newFlock(layer);
                ballShooter.changeSettings({ targets: targets, });
            });


            layer.draw();
        }());
        return false;
        */


        const $wordHolder = $("#word-holder");
        const score = tools.score();
        const model = {
            draggedObjectX: 0,
            draggedObjectY: 0 // this may be changed down below, if MP3s are kept separately
        };
        const $tilesHolderMaster = $("#tiles-holder").detach();


        let myJSON,
            timeLimit,
            recycle,
            mistakesLine,
            scorebox,
            timer,
            vocabList,
            numProblems,
            thisProblem = {},
            audio;


        // assignment.controlPanel.useBGM();
        // assignment.backgroundMusic.source("https://www.bensound.com/royalty-free-music/track/dreams-chill-out");


        assignment.controlPanel.useBGM();
        const bgm = assignment.backgroundMusic;
        bgm.source("https://www.bensound.com/bensound-music/bensound-dreams.mp3");
        // bgm.source("https://www.bensound.com/bensound-music/bensound-dreams.mp3");


        const playButton = (function() {


            const playingClass = "now-playing";
            const $playButton = $("#play-button");


            $(window).on("keydown", function(e) {
                if (e.which !== 32) { return; }
                e.preventDefault();
                audio.play(thisProblem.englishWord);
            });


            $playButton.on("click", function() {
                audio.play(thisProblem.englishWord);
            });


            function nowPlaying() {
                $playButton.addClass(playingClass);
            }


            function stoppedPlaying() {
                $playButton.removeClass(playingClass);
            }


            return {
                nowPlaying,
                stoppedPlaying,
            };
        }());


        const sounds = new SoundEffects({
            container: $("#sounds-stuff"),
            checkBoxTextAlign: "left",
            sounds: {
                correct: "/sounds/scrabble/correctSound.mp3",
                wrong: "/sounds/scrabble/wrongSound.mp3",
                problemFinish: "/sounds/scrabble/problemFinish.mp3"
            },
            playThisOnCheckboxCheck: "correct"
        });


        // returns a Scrabble tile for each letter, and adds it to its parent
        function newTile(object) {


            const $tile = $("<div class='tile'>" + object.letter + "</div>").appendTo(object.parent);
            const randRotation = 10 - Math.floor(Math.random() * 20);


            $tile.draggable({
                containment: $("#scrabble-main"),
                stack: ".tile",
            }).css({
                webkitTransform: "rotate(" + randRotation + "deg)",
                msTransform: "rotate(" + randRotation + "deg)",
                left: 10 - Math.random() * 20,
                top: 10 - Math.random() * 20
            });


            return $tile;
        }


        tools.numbToTouch([$("#choices-holder"), $("#drag-target")]);


        const nextButton = assignment.nextButton({
            button: $("#next-button"),
            callback: nextProblem,
            buttonAlternate: $("#scrabble-main")
        });


        const wordHolder = {
            show: function(word) {
                $wordHolder.text(word);
            },
            clear: function() {
                $wordHolder.empty();
            }
        };


        assignment.getProblemData(function(data) {


            myJSON = data;
            myJSON.problem = tools.objectToArray(myJSON.problem);
            timeLimit = myJSON.assignment.time_limit;
            recycle = myJSON.assignment.recycle;
            mistakesLine = myJSON.assignment.mistakes_limit;


            // whittling down extra problems
            if (myJSON.number_problems && myJSON.number_problems < myJSON.problem.length) {
                myJSON.number_problems && tools.whittleDownArray(myJSON.problem, myJSON.number_problems);
            }


            numProblems = myJSON.problem.length;


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


            assignment.directions.show("scrabble", {
                directions: myJSON.assignment.directions,
                mistakes: mistakesLine,
                numProblems: recycle ? null : myJSON.problem.length,
                time: timeLimit,
                timeTrial: recycle ? true : false
            });


            vocabList = myVocabList({
                problems: myJSON.problem,
                number_problems: myJSON.problem.length,
                numberSentakushi: myJSON.number_sentakushi || 3,
                recycleProblems: recycle ? true : false // optionally recycling words, so they never run outs
            });


            $("#numberProblemsBody").text(myJSON.problem.length + " 問");


            assignment.fixedProblemHolder({
                onSlideUp: function() {
                    $("#directions-holder").hide();
                },
                onSlideDown: function() {
                    $("#directions-holder").hide();
                }
            });


            audio = audioLoader({
                audioFiles: myJSON.audioFiles,
                wordsList: vocabList.getRemainingWords(), // REQUIRED,
                getWordToPlay: function() { // (optional) function to retrieve which word to play next, so we don't have to spoon-feed the word in
                    return vocabList.getTargetEnglish();
                },
                onPlay: function() {
                    playButton.nowPlaying();
                    bgm.temporarilyReduceVolume();
                },
                preloadAudio: true,
                onAllLoaded: function() {
                    // nothing to report...
                },
                onReady: function() {
                    assignment.startButton({
                        button: $("#start-button"),
                        buttonAlternate: $("#scrabble-main"),
                        callback: function() {
                            timer.start();
                            score.startTimer();
                            scorebox.clock.start();
                            setTimeout(function() {
                                nextProblem();
                            }, 200);
                        }
                    });
                },
                onEnded: function() {
                    playButton.stoppedPlaying();
                    bgm.restoreVolume();
                },
                playButton: "playIcon" // passing in the button on which to show "play" and "pause" symbols
            });
        });





        /*  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  */





        function nextProblem() {


            const $tilesHolder = $tilesHolderMaster.clone();
            $("#choices-holder").empty().append($tilesHolder);
            $("#drag-target").empty().removeClass("finished").addClass("dragMessage");


            // choosing random problem from the myJSON.problem array
            thisProblem.number = Math.floor(Math.random() * myJSON.problem.length);
            thisProblem.japaneseWord = myJSON.problem[thisProblem.number][1];
            thisProblem.englishWord = myJSON.problem[thisProblem.number][0].split("¥")[0].trim();
            thisProblem.remainingLetters = thisProblem.englishWord.split("");


            setTimeout(function() {
                audio.play(thisProblem.englishWord);
            }, 500);


            // if there's a ¥-sign, meaning there are unused (trash) letters, then including them in the 'trashLetters' array
            const word = myJSON.problem[thisProblem.number][0];
            thisProblem.trashLetters = (word.indexOf("¥") !== -1) ? (word.split("¥")[1].trim().split("")) : [];
            thisProblem.allLetters = thisProblem.remainingLetters.concat(thisProblem.trashLetters);


            let randomLettersArray = thisProblem.allLetters.concat();


            thisProblem.remainingLetters.forEach(function(thisLetter) {
                $("<div class='space'>?</div>").data("answer", thisLetter).appendTo("#drag-target");
            });


            wordHolder.show(thisProblem.japaneseWord);


            // placing all the letters in the floatingDivs - and making corresponding spaces (NEW TEST)
            randomLettersArray = tools.shuffle(randomLettersArray, true); // NEW TEST added the 'true' so the [0] element will always be moved
            while (randomLettersArray.length > 0) {
                newTile({
                    letter: randomLettersArray.pop(),
                    parent: $tilesHolder
                });
            }


            // inserting a line break if there are more than 4 letters, so that the tiles form two lines
            if ($(".tile").length > 4) {
                let index = Math.ceil($(".tile").length / 2);
                $(".tile").eq(index).before("<br>");
            }


            // increasing margin between .space divs if there are less than 6
            if ($(".space").length < 6) {
                $(".space").css({
                    marginRight: "10px",
                    marginLeft: "10px"
                });
            }


            // marking the X and Y coordinates at beginning of drag, so we can spring back if necessary
            $(".tile").on("mousedown", function() {


                // saving the starting css top & left positions
                model.draggedObjectX = $(this).css("left");
                model.draggedObjectY = $(this).css("top");


                // forcing those values to be in pixels if they're 'auto' (which they are, by default, on first drag)
                if (model.draggedObjectX === "auto") {
                    model.draggedObjectX = "0px";
                }
                if (model.draggedObjectY === "auto") {
                    model.draggedObjectY = "0px";
                }
            });


            $(".space").droppable({
                accept: ".tile",
                tolerance: "intersect",
                drop: checkAnswer
            });


            function checkAnswer(event, droppedTile) {


                const draggedText = $(droppedTile.draggable).text();
                const correctText = $(event.target).data("answer");


                (draggedText === correctText) ? correctHandler(event, droppedTile, correctText): wrongHandler(droppedTile);
            }
        }


        function correctHandler(event, droppedTile, correctText) {


            // turning off droppability for this target
            $(event.target).droppable({ disabled: true }).addClass("tile").empty().text(correctText).css({
                color: "white",
                boxShadow: "none",
                border: "1px solid white",
                borderTopColor: "#999",
                borderLeftColor: "#999"
            }).append("<div class='glow-dot'></div>");


            // disabling the dropped word so it can't be dragged, and is invisible
            $(droppedTile.draggable).draggable({ disabled: true }).css({ visibility: "hidden" });
            thisProblem.remainingLetters.splice(0, 1);


            // playing the correctSound (or, if all done, the problemFinish sound)
            if (thisProblem.remainingLetters.length > 0) {
                sounds.play("correct");
                return;
            }


            // if the current problem is all finished...
            sounds.play("problemFinish");
            scorebox.correctCounter.increment();
            myJSON.problem.splice(thisProblem.number, 1);
            wordHolder.clear();
            nextButton.show();


            // momentarily coloring the drag-target
            $("#drag-target").removeClass("notFinished").addClass("finished");


            // removing any tiles (which at this point are still only hidden, not removed)
            $(".tile").not(".space").remove();


            // if it's the very last problem...
            if (myJSON.problem.length <= 0) {
                endSequence("allAnswered");
                return;
            }
        }


        function wrongHandler(droppedTile) {


            score.number_mistakes++;
            scorebox.wrongCounter.increment();
            sounds.play("wrong");


            // spring back
            $(droppedTile.draggable).animate({
                top: model.draggedObjectY,
                left: model.draggedObjectX
            });


            // exiting here if there are too many mistakes
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
                audio.disable().stopAll();


                // if all problems have been done...
                const results = {
                    time_taken: score.time_taken(),
                    number_problems: numProblems,
                    number_mistakes: score.number_mistakes,
                    passed: passConditions[result]
                };


                assignment.send_results(results, backFromSendResults);


                function backFromSendResults() {
                    setTimeout(function() {


                        const data = [
                            { label: "時間", value: results.time_taken + " 秒" },
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
                }


                // turning off the mousedown listener (necessary?)
                $(".tile").off("mousedown");
            };
        }());
    });