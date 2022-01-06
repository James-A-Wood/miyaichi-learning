/* jshint expr: true */

define(
        [
            "assignment",
            "jquery",
            "tools",
            "helpers/SoundEffects",
            "helpers/tiltSimulatesArrowKeys",
            "konva/pacManFactory",
            "konva/blastCircle",
            "konva/WordBlock",
            "konva/shakeStage",
            "Konva",
        ],
    function(
        assignment,
        $,
        tools,
        SoundEffects,
        tiltSimulatesArrowKeys,
        pacManFactory,
        blastCircle,
        WordBlockFactory,
        shakeStage,
        Konva) {


        const $playButton = $("#playButton"),
            $pacManHolder = $("#pacManHolder"),
            $pacManBackgroundHolder = $("#pacManHolder");

        let myJSON = {},
            audio = {},
            soundEffects,
            score = tools.score(),
            problems = { remainingProblems: "", numberOfProblems: "", },
            stage,
            stageWidth,
            stageHeight,
            backgroundLayer,
            targetsLayer,
            pacManLayer,
            boundariesLayer,
            answersLayer,
            background,
            textHolder,
            boundaries,
            choicesHolder,
            WordBlockMaker;


        const SpeedUpLogo = WordBlockFactory({
            text: "Speed up!",
            fill: "transparent",
            stroke: "transparent",
            textFill: "yellow",
            textSize: tools.isMobile() ? 12 : 18,
            paddingX: 0,
            paddingY: 0,
            name: "wordBlock"
        });


        // enabling device tilting to simulate arrow key presses
        tools.isMobile() && $pacManHolder.css({ margin: "0px auto" });


        tools.isNotMobile() ? setup() : assignment.mobileChuui({
            warningsLast: [
                {
                    paragraphs: ["さあ、Do your best!"],
                    img: "/images/mobile-usage-icons/pacman.png",
                    buttonText: "Start!",
                    onClick: setup,
                },
            ],
        });


        function Background(stageWidth, stageHeight) {


            const refreshDuration = 1; // 1 second
            const backgroundRect = new Konva.Rect({
                x: 0,
                y: 0,
                fillRadialGradientStartPoint: { x: stageWidth / 2, y: stageHeight / 2 },
                fillRadialGradientStartRadius: 0,
                fillRadialGradientEndPoint: { x: stageWidth / 2, y: stageHeight / 2 },
                fillRadialGradientEndRadius: Math.max(stageWidth / 2, stageHeight / 2),
                fillRadialGradientColorStops: [0, "white", 0.5, "white", 1, "white", ],
                width: stageWidth,
                height: stageHeight,
            });
            backgroundLayer.add(backgroundRect).draw();


            function refresh(opt = {}) {
                backgroundRect.to({
                    fillRadialGradientColorStops: [
                        0, opt.fill || tools.pickDarkColor(),
                        0.5, opt.fill || tools.pickDarkColor(),
                        1, opt.fill || tools.pickDarkColor(),
                    ],
                    duration: refreshDuration,
                    onFinish: function() {
                        opt.onFinish && opt.onFinish();
                    },
                });
            }


            function fadeToWhite() {
                refresh({
                    fill: "white",
                    onFinish: refresh,
                });
            }


            return { refresh, };
        }


        function TextHolder() {


            const japaneseFill = tools.pickLightColor();
            const englishFill = tools.pickLightColor();
            const buffer = 5;
            const fontSize = stage.width() < 400 ? 14 : 24;
            const ellipsis = " ...";


            let japText,
                engText,
                totalHeight,
                englishSentence = "",
                englishWordsArray = [];


            function getHeight() {
                return engText.x() + engText.height();
            }


            function clearText(duration) {
                duration = duration ? duration : 0;
                answersLayer.getChildren().each(function(child) {
                    child.to({
                        duration: 0.5,
                        opacity: 0,
                        onFinish: function() {
                            child && child.destroy();
                        }
                    });
                });
                englishSentence = "";
            }


            function appendEllipsis() {
                appendNextWord(ellipsis);
            }


            function setEnglish(array) {
                englishWordsArray.length = 0;
                englishWordsArray = array;
            }


            function setJapanese(text) {
                clearText();
                japText = new Konva.Text({
                    width: stage.width() * 0.9,
                    x: stage.width() * 0.05,
                    y: buffer,
                    text: text,
                    align: "center",
                    fontSize: fontSize,
                    fill: japaneseFill
                });
                answersLayer.add(japText).draw();
            }


            function appendNextWord(word) {
                englishSentence = englishSentence.replace(ellipsis, "");
                word = word || englishWordsArray.shift() + " ";
                englishSentence += word;
                engText && engText.destroy();
                const japTextHeight = japText ? (japText.y() + japText.height()) : null;
                engText = new Konva.Text({
                    x: stage.width() * 0.05,
                    y: japTextHeight + buffer,
                    width: stage.width() * 0.9,
                    align: "center",
                    fontSize: fontSize,
                    fill: englishFill,
                    text: englishSentence
                });
                answersLayer.add(engText).draw();
            }


            function getFontSize() {
                return fontSize;
            }


            return { setJapanese, setEnglish, appendNextWord, clearText, appendEllipsis, getFontSize, getHeight, };
        }


        function Targets(currentProblem, stage, gridObjects, wordBlocks) {


            // this gets returned at the end
            let blocksInCorrectOrder = [],
                targets = {};


            const processed = assignment.processSentenceForNarabekae(currentProblem[1]),
                correctWords = processed.real,
                dummyWords = processed.dummy; //tools.trimAllElements(dummyWords, { removeUnderscores: true });


            textHolder.setEnglish(correctWords);
            targets.allWords = correctWords.concat(dummyWords);
            textHolder.setJapanese(currentProblem[0]);


            targets.allWords.forEach(function(thisWord) {


                const wordBlock = WordBlockMaker({
                    text: thisWord,
                    breakAtSpaces: true,
                    textFill: tools.pickLightColor(),
                });
                wordBlock.text = thisWord;
                targetsLayer.add(wordBlock);
                gridObjects.push(wordBlock);
                wordBlocks.push(wordBlock);
                blocksInCorrectOrder.push(wordBlock);
            });


            // scaling blocks if they're too wide for PacMan to fit between
            wordBlocks.forEach(function(thisBlock) {


                const percentOfStageWidth = thisBlock.width / stage.width();
                const maxAllowed = 0.25;


                if (percentOfStageWidth > maxAllowed) {
                    thisBlock.scaleTo(maxAllowed / percentOfStageWidth);
                }


                targetsLayer.draw();
            });


            function isCorrectBlock(thisBlock) {
                return thisBlock === blocksInCorrectOrder[0];
            }


            function allWordsHaveBeenEaten() {
                return blocksInCorrectOrder.length === dummyWords.length;
            }


            return { dummyWords, blocksInCorrectOrder, isCorrectBlock, allWordsHaveBeenEaten, };
        }


        function SpeedPills(grid) {


            const numberOfSpeedPills = 2;
            let array = [];


            // the speedPill template
            const speedPillMaker = WordBlockFactory({
                parentLayer: targetsLayer,
                name: "speedPill",
                paddingX: 10,
                paddingY: 2,
                fontSize: 10,
                cornerRadius: 200,
                text: "x2",
                fill: "red",
                textFill: "white",
                stroke: "transparent"
            });


            // making instances from the speedPill template above
            for (let i = 0; i < numberOfSpeedPills; i++) {
                const speedPill = speedPillMaker();
                speedPill.x(stageWidth / 2);
                speedPill.y(stageHeight - choicesHolder.height() + (i * (grid.numRows - 1) * grid.rowSpacing) + grid.rowSpacing / 2);
                targetsLayer.add(speedPill);
                array.push(speedPill);
            }


            return array;
        }


        function calculateGrid(gridObjects) {
            const isLandscape = stageHeight < stageWidth;
            const numRows = Math.ceil(gridObjects.length / (isLandscape ? 4 : 2)); // NOTE need the quotes around the ternary
            const numColumns = isLandscape ? 4 : 2;
            const rowSpacing = choicesHolder.height() / numRows;
            const columnSpacing = choicesHolder.width() / numColumns;
            return { numRows, numColumns, rowSpacing, columnSpacing };
        }


        function setup() {


            // setting up the stage and various layers
            stage = new Konva.Stage({
                container: "pacManHolder",
                width: $pacManHolder.width(),
                height: $pacManHolder.height()
            });
            stageWidth = stage.width();
            stageHeight = stage.height();
            backgroundLayer = new Konva.Layer({ listening: false });
            targetsLayer = new Konva.Layer({ listening: false });
            pacManLayer = new Konva.Layer();
            boundariesLayer = new Konva.Layer({ listening: false });
            answersLayer = new Konva.Layer({ listening: false });
            stage.add(backgroundLayer, targetsLayer, pacManLayer, boundariesLayer, answersLayer);


            background = new Background(stageWidth, stageHeight);
            textHolder = new TextHolder();


            // bounding box, for pacMan to move around in
            boundaries = new Konva.Rect({
                width: stage.width(),
                height: stageHeight,
                x: 0,
                y: 0,
            });
            boundariesLayer.add(boundaries);


            // holds the wordBlocks
            choicesHolder = (function() {
                const padding = 40;
                const holder = new Konva.Rect({
                    width: stage.width(),
                    height: stageHeight - padding,
                    x: 0,
                    y: padding,
                    strokeWith: 1
                });
                return holder;
            }());
            boundariesLayer.add(choicesHolder).draw();


            WordBlockMaker = WordBlockFactory({
                paddingX: 0,
                paddingY: 0,
                textSize: 24,
                strokeWidth: 1,
                fill: "transparent",
                textFill: tools.pickLightColor(),
                stroke: "transparent",
                name: "target",
                parentLayer: targetsLayer,
                breakAtSpaces: true,
                maxWidth: stageWidth / 4,
            });


            assignment.getProblemData(function(data) {


                if (data.number_problems && data.number_problems > 0) {
                    tools.whittleDownArray(data.problem, data.number_problems);
                }


                myJSON = data;
                problems.remainingProblems = data.problem;
                problems.numberOfProblems = problems.remainingProblems.length;


                assignment.directions.show("pac_man", {
                    directions: myJSON.assignment.directions,
                });


                assignment.fixedProblemHolder();
                assignment.gambariTimeStart();


                nextProblem();
            });
        }



        /*  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  */



        function nextProblem() {


            // FUCK had to move this here so that sounds load properly (after a touch event)
            soundEffects = soundEffects || new SoundEffects({
                container: $("#sound-effects-controls"),
                checkBoxTextAlign: "left",
                sounds: {
                    movementSound: "/sounds/pac_man/movementSound.mp3",
                    pacManDie: "/sounds/pac_man/pacManDie.mp3",
                    wrongSound: "/sounds/pac_man/wrongSound.mp3",
                    birthSound: "/sounds/pac_man/birthSound.mp3",
                    successSound: "/sounds/pac_man/successSound.mp3",
                    tada: "/sounds/pac_man/tada.mp3",
                    correctSound: "/sounds/pac_man/correctSound.mp3",
                    speedUp: "/sounds/pac_man/speedUp.mp3",
                }
            });


            let gridObjects = []; // holds all wordBlocks and speedPills
            let wordBlocks = []; // holds all wordBlocks, in the correct order so it can get whittled down


            // picking off the first of the remaining problems
            const currentProblem = problems.remainingProblems.shift(),
                currentAudio = currentProblem[0],
                targets = new Targets(currentProblem, stage, gridObjects, wordBlocks),
                grid = calculateGrid(gridObjects),
                speedPills = new SpeedPills(grid);


            score.startTimer();
            background.refresh();


            audio.destroy && audio.destroy();
            audio = new Howl({
                src: [myJSON.audioFiles[currentAudio]],
                onload: function() {
                    $("body").addClass("has-audio"); // showing the play button, using CSS
                },
                onloaderror: function() {
                    $("body").removeClass("has-audio"); // hiding the play button, using CSS
                },
            });


            $playButton.off("click").on("click", function() {
                audio.stop().play();
                pacMan.enable();
            });


            audio.on("play", function() {
                pacMan.enable();
            });


            // updating the scoreText
            $("#scoreText").text(problems.numberOfProblems - problems.remainingProblems.length + " / " + problems.numberOfProblems);


            // let obstacles = (function() {
            //
            //     let numberObstacles = 0;
            //
            //     // 'obstacles' are just normal wordBlocks, but colored and with no text
            //     let obstaclesArray = [];
            //     let ObstacleMaker = WordBlockFactory({
            //         fill: "skyblue",
            //         stroke: "navy",
            //         name: "obstacle"
            //     });
            //
            //     for (let i = 0; i < numberObstacles; i++) {
            //         let obstacle = ObstacleMaker({
            //             width: 50,
            //             height: 50,
            //             x: 100 + i * 100,
            //             y: 50
            //         });
            //         targetsLayer.add(obstacle);
            //         obstaclesArray.push(obstacle);
            //     }
            //
            //     targetsLayer.draw();
            //
            //     return obstaclesArray;
            // }());


            const NewPacMan = (function() {


                const pacManStart = {
                    x: stageWidth / 2,
                    y: choicesHolder.height() / 2 + (stageHeight - choicesHolder.height()),
                };


                return function(enableOnBirth) {


                    const pacMan = pacManFactory({
                        disableOnStartup: enableOnBirth ? false : true,
                        layer: pacManLayer,
                        fill: "orange",
                        radius: stage.width() * (tools.isNotMobile() ? 0.02 : 0.04),
                        pakuInterval: 0.15,
                        speed: stage.width() / 4,
                        useBlastCircleBeforeBirth: true,
                        boundaries: boundaries || stage,
                        hittables: [
                            { items: wordBlocks, onHit: checkAnswer },
                            { items: speedPills, onHit: speedUp }
                        ],
                        // obstacles: obstacles,
                        soundEffects: soundEffects,
                        onBirth: function() {
                            if (tools.isMobile()) {
                                pacMan.startText({
                                    text: "タッチして\n始めよう",
                                    showDelay: 200,
                                    onClick: function() {
                                        tools.activateTiltDetection({
                                            onSuccess: function() {
                                                $playButton.click();
                                                tiltSimulatesArrowKeys();
                                            },
                                            onFail: function(e) {
                                                log("Couldn't activate tilt detection!");
                                            },
                                        });
                                    }
                                });
                            } else {
                                $playButton.click();
                            }
                        },
                        onMove: function() {
                            assignment.manuallyTriggerUserStillAcive();
                        }
                    });


                    // function to set the starting X & Y (set during the first instantiation)
                    pacMan.setStartingXY = function(x, y) {
                        pacManStart.x = x;
                        pacManStart.y = y;
                    };


                    // placing pacMan at the original starting X & Y, if they're set
                    pacMan.x(pacManStart.x);
                    pacMan.y(pacManStart.y);
                    pacManLayer.add(pacMan);


                    return pacMan;
                };
            }());
            pacMan = NewPacMan();


            // calculating the x/y position of each word, the speedPills, and pacMan HIMSELF!
            (function() {


                let gridArray = [];
                for (let r = 0; r < grid.numRows; r++) {
                    for (let c = 0; c < grid.numColumns; c++) {
                        const posX = choicesHolder.x() + (c * grid.columnSpacing) + (grid.columnSpacing / 2);
                        const posY = choicesHolder.y() + (r * grid.rowSpacing) + (grid.rowSpacing / 2);
                        gridArray.push({ x: posX, y: posY, });
                    }
                }


                while (gridObjects.length) {
                    const thisObject = tools.pickOneFrom(gridObjects, true); // true --> deleting the element
                    const pos = tools.pickOneFrom(gridArray, true);
                    thisObject.x(pos.x).y(pos.y);
                }


                // Cool!  Remember this syntax!
                stage.find(".target, .speedPill").each(function(thisBlock) {
                    thisBlock.popUp();
                });
            }());


            // received from the pacMan object when it has hit a target
            function checkAnswer(thisBlock) {
                if (targets.isCorrectBlock(thisBlock)) {
                    correctAnswerHandler(thisBlock, wordBlocks, pacMan, targets);
                } else {
                    wrongAnswerHandler(pacMan, NewPacMan);

                    // generating pacMan
                    setTimeout(function() {
                        pacMan = NewPacMan("enableOnBirth");
                    }, 2000);
                }
            }


            function speedUp(thisBlock) {


                speedPills.splice(speedPills.indexOf(thisBlock), 1);
                thisBlock.removeMe();
                pacMan.speedUp();
                soundEffects.play("speedUp");
                const logo = SpeedUpLogo();


                // centering the logo horizontally above the speedPill
                logo.x(thisBlock.x() + thisBlock.width / 2 - logo.width / 2);
                logo.y(thisBlock.y());
                targetsLayer.add(logo);


                // 1 of 2: tween the logo up the screen
                logo.to({
                    duration: 1.5,
                    y: logo.y() - 75,
                    onFinish: function() {
                        logo.destroy();
                    }
                });


                // 2 of 2: a moment later, tweening it out
                setTimeout(function() {
                    logo.to({
                        duration: 0.5,
                        fill: "yellow",
                        opacity: 0,
                    });
                }, 1000);


                pacMan.flash();
            }
        }


        const sendResults = (function() {


            let hasBeenCalled = false;
            const passConditions = {
                tooManyMistakes: false,
                timeUp: false,
                allAnswered: true,
                timeTrial: true
            };


            return function(result) {


                if (hasBeenCalled) { return false; }
                hasBeenCalled = true;


                const results = {
                    time_taken: score.time_taken(),
                    number_problems: problems.numberOfProblems,
                    number_mistakes: score.number_mistakes,
                    passed: passConditions[result],
                };


                // results to pass to the assignment.send_results function
                assignment.send_results(results, function() {
                    setTimeout(function() {
                        assignment.showAssignmentResults({
                            container: $("#mainProblemsHolder"),
                            result: "allAnswered",
                            data: [
                                { label: "時間", value: score.time_taken() + " 秒" },
                                { label: "問題数", value: results.number_problems + " 問" },
                                { label: "間違い", value: score.number_mistakes }
                            ],
                        });
                    }, 1000);
                });
            };
        }());


        function clearStage(pacMan, p = {}) { // default values!  cool!


            const duration = 0.5; // seconds (not ms) because these use Konva tweens


            setTimeout(function() {


                targetsLayer.getChildren().each(function(thisChild) {
                    thisChild.fadeAndRemove({
                        duration: duration,
                        scaleX: p.scaleX ? p.scaleX : 1, // Not shrinking away
                        scaleY: p.scaleY ? p.scaleY : 1
                    });
                });


                pacMan.fadeAndRemove({
                    duration: duration,
                    callback: p.callback
                });


                textHolder.clearText(duration);
            }, p.afterMs ? p.afterMs : 0);
        }


        function thisProblemFinished(pacMan) {
            pacMan.stop();
            setTimeout(function() {
                soundEffects.play("tada");
                clearStage(pacMan, {
                    afterMs: 1500,
                    callback: () => {
                        // if all the problems are done...
                        if (problems.remainingProblems.length === 0) {
                            sendResults("allAnswered");
                        } else {
                            soundEffects.play("successSound");
                            nextProblem();
                        }
                    }
                });
            }, 500);
        }


        function correctAnswerHandler(thisBlock, wordBlocks, pacMan, targets) {


            // the word is correct, so...
            soundEffects.play("correctSound");
            textHolder.appendNextWord();
            thisBlock.removeMe();
            wordBlocks.shift();
            targets.blocksInCorrectOrder.shift();


            blastCircle({
                layer: pacManLayer,
                shape: "star",
                innerRadius: 25,
                outerRadius: 40,
                stroke: "orange",
                duration: 1.5,
                x: thisBlock.x(),
                y: thisBlock.y()
            });


            // checking for problem finish
            targets.allWordsHaveBeenEaten() ? thisProblemFinished(pacMan) : textHolder.appendEllipsis();
        }


        function wrongAnswerHandler(pacMan) {


            soundEffects.play("wrongSound");
            pacMan.die();
            score.number_mistakes++;


            shakeStage({
                stage: stage,
                shakeAmplitude: 6,
                shakeRate: 10,
                shakeLength: 600
            });
        }
    });