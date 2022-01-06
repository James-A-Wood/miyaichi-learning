/* jshint expr: true */


define(
    [
        "jquery",
        "tools",
        "recordUserGambariTime",
        "helpers/assignmentTree",
        "helpers/user_present",
        "howler",
    ],
    function(
        $,
        tools,
        recordUserGambariTime,
        assignmentTree
    ) {


        if (tools.isMobile()) {
            $("body").addClass("mobile");
        }


        const chatCheckInterval = 10 * 1000; // 10 seconds
        const clickOrTouch = tools.clickOrTouch;
        const isMobile = tools.isMobile();


        let lastDisplayedChatID = 0;
        let assignment = {};
        let user = userStatus();
        assignment.user = userStatus;
        let gambariTime = recordUserGambariTime({
            isLoggedIn: user.isLoggedIn()
        });


        $("#chat-message-frame").click(function() {
            $(this).removeClass(showingClass);
        });


        setInterval(retrieveChats, chatCheckInterval);
        retrieveChats();


        function retrieveChats() {


            $.getJSON("/chat_stuff", {
                job: "retrieve_last_message_from_admin"
            }).done(function(chat) {


                if (!chat || chat.length === 0) return;


                // calculating the time of the last message (have to do this for fucking ID)
                const dateStr = chat.created_at; //returned from mysql timestamp/datetime field
                const a = dateStr.split(" ");
                const d = a[0].split("-");
                const t = a[1].split(":");
                const messageTime = new Date(d[0], (d[1] - 1), d[2], t[0], t[1], t[2]);
                const isNewerThanPageLoad = messageTime > tools.pageLoadDateTime();
                const hasntBeenDisplayedYet = (chat.id !== lastDisplayedChatID);


                if (isNewerThanPageLoad && hasntBeenDisplayedYet) {
                    lastDisplayedChatID = chat.id;
                    displayMessage(chat.message);
                }
            }).fail(function(d) {
                console.log("Error?");
                console.log(d);
            });
        }


        function displayMessage(message) {
            if (message) {
                $("#chat-message-frame").removeClass(showingClass);
                $("#message-content").empty().append(message);
                $("#chat-message-frame").addClass(showingClass);
            }
        }


        const controlPanel = (function() {


            const $controlPanel = $("#control-panel");
            const $bgmCheckbox = $("#bgm-checkbox");
            const $soundEffectsCheckbox = $("#soundEffectsCheckbox");
            const $gearIcon = $("#cp-gear-icon");
            const $voices = $("#voice-stuff");
            const $voiceStuff = $("#voice-stuff");


            const showingClass = "showing";
            const voiceRadioName = "voice-radio";


            $gearIcon.on(tools.clickOrTouch, function() {
                $controlPanel.toggleClass(showingClass);
            });


            $controlPanel.on(tools.clickOrTouch, function(e) {
                if (e.target === this) { // e.target equals "#control-panel", not its children
                    $(this).removeClass(showingClass);
                }
            });


            const soundEffectsCheckbox = tools.checkboxStateHandler({
                checkbox: $soundEffectsCheckbox,
                localStorageKey: "assignmnet_do_use_sound_effects",
            });


            const bgmCheckbox = tools.checkboxStateHandler({
                checkbox: $bgmCheckbox,
                localStorageKey: "assignmnet_do_use_bgm",
                onCheck: () => backgroundMusic.play(),
                onUncheck: () => backgroundMusic.pause(),
            });


            const voiceRadios = tools.radioStateHandler({
                radioName: voiceRadioName,
                localStorageKey: "assignment_voice_radio_value",
            });


            function getVoice() {
                return $(`input[name='${voiceRadioName}']:checked`).val();
            }


            function hide() {
                $controlPanel.css({ display: "none" });
            }


            function remove() {
                $controlPanel.remove();
            }


            function useVoices() {
                return displayElement($voiceStuff);
            }


            function useBGM() {
                return displayElement($("#bgm-stuff"));
            }


            function isUsingBGM() {
                return $bgmCheckbox.is(":checked");
            }


            // private
            function displayElement($element) {
                tools.forceJQuery($element).removeClass("hidden");
                return controlPanel; // for some reason, can't simply return "this" from here!
            }


            return {
                hide,
                remove,
                useVoices,
                useBGM,
                getVoice,
                isUsingBGM,
            };
        })();
        assignment.controlPanel = controlPanel;




        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *
         *      Instructions for mobile devices - locking screen rotation, holding device level, etc.
         *
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function mobileChuui(obj = {}) {


            // standard warnings, common across all tilt-based games
            obj.warningsFirst = obj.warningsFirst || [
                {
                    paragraphs: ["デバイスを*縦向き*に使い、*自動回転しないように*設定しましょう。"],
                    img: "/images/mobile-usage-icons/rotation-lock.png",
                },
                {
                    paragraphs: ["デバイスを*水平に*持ちながら、軽く*傾けて操作しましょう*。"],
                    img: "/images/mobile-usage-icons/smartphone-axes.png",
                },
                {
                    paragraphs: [
                        "傾きを検知するために、デバイスからの許可が必要です。",
                        "次のようなダイアログが出たら*「許可」*をクリックしてください。",
                    ],
                    img: "/images/mobile-usage-icons/kyoka.png",
                },
            ];


            // obj.warnings (optional) is a completely new set of warnings, overriding everything else
            // obj.warningsLast are to be appended onto obj.warningsFirst
            obj.warnings = obj.warnings || obj.warningsFirst.concat(obj.warningsLast || []);


            const warnings = obj.warnings;
            const $template = obj.template || $(".mobile-chuui.my-template").detach().removeClass("my-template");
            const emphasizedClass = obj.emphasizedClass || "emphasized";


            warnings.forEach(function(warning, index) {


                const $clone = $template.clone().appendTo("#mobile-chuui-holder");
                $clone.find(".number-holder").text((index + 1) + " of " + warnings.length);


                warning.paragraphs.forEach(function(paragraph) {
                    paragraph = tools.replaceStars(paragraph, `<span class='${emphasizedClass}'>`, `</span>`);
                    $clone.find(".paragraphs-holder").append(`<p>${paragraph}</p>`);
                });


                warning.img && $clone.find("img").prop("src", warning.img);


                $clone.find(".next-button").text(warning.buttonText || "次 →").click(function() {


                    warning.onClick && warning.onClick();


                    if (index === warnings.length - 1) {
                        $("#mobile-chuui-holder").fadeOut(500, function() {
                            $(this).remove();
                        });
                    } else {
                        $clone.fadeOut(300, function() {
                            $clone.remove();
                        });
                    }
                });
            });
        }
        assignment.mobileChuui = mobileChuui;





        function analyzeProblem(myJSON) {
            if (!myJSON || typeof myJSON !== "object" || !myJSON.problem) {
                console.log("analyzeProblem got some bad data!");
                return false;
            }
        }
        assignment.analyzeProblem = analyzeProblem;




        /*

            Takes a string and breaks it up into an array of single words

            If there is a ¥ or [] brackets, it treats the latter section as "dummy" words

        */
        function processSentenceForNarabekae(string, opt = {}) {


            string = tools.removeExtraWhiteSpace(string);


            const divider = opt.divider || (string.indexOf("¥") !== -1 ? "¥" : "[");


            let pieces = string.split(divider);
            let real = pieces[0].trim().split(" ");
            real = tools.trimAllElements(real, { removeUnderscores: true });


            // removing any closing "]" brackets, and
            // returning empty [] if there are no dummy choices
            let dummy = pieces[1] ? pieces[1].trim().replace(/\]/g, "").split(" ") : [];
            dummy = tools.trimAllElements(dummy, { removeUnderscores: true });


            return {
                real,
                dummy,
                realShuffled: tools.shuffle(real),
                dummyShuffled: tools.shuffle(dummy),
                all: real.concat(dummy)
            };
        }
        assignment.processSentenceForNarabekae = processSentenceForNarabekae;





        function showImage(inputs) {


            if (!inputs || !inputs.images || !inputs.holder) {
                console.log("showImage() got some bad parameters!");
                return false;
            }


            let settings = $.extend({
                showMultiple: false
            }, inputs);


            // exiting if there are no images for this assignment
            if (settings.images.length === 0) {
                return false;
            }


            inputs.onShow && inputs.onShow();
            settings.holder.append(`<img src='/storage/${settings.images[0].image}'>`);
        }
        assignment.showImage = showImage;





        const backgroundMusic = (function() {


            let standardVolume = 0.5;
            let music = buildNewHowl();


            function source(src) {
                music.unload();
                music = buildNewHowl({ src: src, });
            }


            function buildNewHowl(obj = {}) {
                return new Howl({
                    src: [obj.src || ""],
                    loop: obj.loop || true,
                    volume: obj.volume || standardVolume,
                    html5: obj.html5 || true,
                    autoplay: controlPanel.isUsingBGM(),
                    format: ["mp3"],
                });
            }


            function play() {
                controlPanel.isUsingBGM() && !music.playing() && music.play();
            }


            function playing() {
                return music.playing();
            }


            function pause() {
                music.pause();
                return this;
            }


            function volume(val) {
                if (val !== undefined) {
                    controlPanel.isUsingBGM() && music.volume(val);
                    return true;
                }
                return music.volume();
            }


            function restoreVolume() {
                controlPanel.isUsingBGM() && volume(standardVolume);
                return this;
            }


            function temporarilyReduceVolume() {
                standardVolume = volume();
                controlPanel.isUsingBGM() && volume(0.05);
            }


            function fadeOut(duration) {
                duration = duration || 200;
                controlPanel.isUsingBGM() && fadeTo(volume(), 0, duration);
                return this;
            }


            function fadeTo(from, to, duration) {
                controlPanel.isUsingBGM() && music.fadeTo(from, to, duration);
                return this;
            }


            return {
                source,
                play,
                playing,
                pause,
                volume,
                fadeTo,
                fadeOut,
                temporarilyReduceVolume,
                restoreVolume,
            };
        }());
        assignment.backgroundMusic = backgroundMusic;





        function addTiltListeners() {
            gambariTime.addTiltListeners();
        }
        assignment.addTiltListeners = addTiltListeners;





        // used when the assignment has no HTML "start" button, like space
        function gambariTimeStart() {
            gambariTime.start();
        }
        assignment.gambariTimeStart = gambariTimeStart;





        function gambariTimeStop() {
            gambariTime.stop();
        }
        assignment.gambariTimeStop = gambariTimeStop;





        /*
         *
         *
         *
         *
         *
         */
        function setRevolvingBackgroundImage($holder, subFolder) {


            const key = "assignment_revolving_background_image_counter";
            let counter = localStorage[key];
            counter = counter ? parseInt(counter) : 0;


            $.getJSON("/assignment_stuff", {
                job: "get_image",
                counter: counter
            }).done(function(path) {
                localStorage[key] = ++counter;
                $holder.css({
                    backgroundImage: "url(/storage/" + path + ")",
                    backgroundPosition: "center center", // centering perfectly - doesn't work in css!
                    backgroundSize: "cover",
                });
            }).fail(function(e) {
                console.log(e);
            });
        }
        assignment.setRevolvingBackgroundImage = setRevolvingBackgroundImage;





        function userStatus() {


            /*
                Keeps track of a localStorage key called "isLoggedIn", setting
                it to "true" (though it could be anything) if user is logged in, and
                deleting the key entirely if the user is not logged in
            */


            const isLoggedInKey = "isLoggedIn";


            function isLoggedIn() {
                return !!localStorage[isLoggedInKey];
            }


            function isNotLoggedIn() {
                return !isLoggedIn();
            }


            function setIsLoggedIn() {
                localStorage.setItem(isLoggedInKey, "true");
            }


            function setIsLoggedOut() {
                localStorage.removeItem(isLoggedInKey);
            }


            return {
                isLoggedIn,
                isNotLoggedIn,
                setIsLoggedIn,
                setIsLoggedOut
            };
        }





        function removeProblemsWithoutAudio(myJSON) {

            /*
             *
             *      Removes any problems that don't have audio.
             *
             *      NOTE that we don't have to return anything, since the
             *      "myJSON" argument is an object, which is passed
             *      by reference!
             *
             *
             */


            if (!myJSON || typeof myJSON !== "object" || !myJSON.problem) {
                console.log("removeProblemsWithoutAudio got some bad parameters!");
                return false;
            }


            // looping through the array, removing any that aren't in the audioFiles
            if (myJSON.audioFiles) {
                myJSON.problem = myJSON.problem.filter(function(problem) {
                    return !!myJSON.audioFiles[problem[0]];
                });
            }
        }
        assignment.removeProblemsWithoutAudio = removeProblemsWithoutAudio;





        function manuallyTriggerUserStillAcive() {
            gambariTime.manuallyTriggerUserStillAcive();
        }
        assignment.manuallyTriggerUserStillAcive = manuallyTriggerUserStillAcive;





        function send_results(object, callback) {


            if (arguments.length !== 2 || typeof object !== "object" || typeof callback !== "function") {
                console.log("tools.send_results got some bad parameters!");
                return false;
            }


            gambariTimeStop();


            object.computer_info = navigator.userAgent.toLowerCase();


            $.post("/register_submitted", object).done(function() {


                // if not logged in, then saving results in localStorage so we can style the buttons on the main menu
                if (!localStorage.isLoggedIn) {
                    let completed = sessionStorage.getItem("completedAsGuest") || {};
                    completed = tools.safeParseJSON(completed);
                    completed[sessionStorage.assignmentId] = "true";
                    sessionStorage.setItem("completedAsGuest", JSON.stringify(completed));
                }
            }).fail(function(d) {
                console.log("Error in registering the submitted assignment!");
                console.log(d);
            }).always(function(d) {
                //console.log(d);
            });


            callback();
        }
        assignment.send_results = send_results;





        function startButton(options = {}) {


            if (!options || !options.button || !options.callback) {
                console.log("startButton needs a button and a callback!");
                return false;
            }


            const settings = $.extend({
                buttonFadeoutTime: 200,
                shortcutKeys: [13, 32], // Enter and Space keys, by default
                buttonAlternate: [],
            }, options);


            const $button = tools.forceJQuery(settings.button),
                $buttonText = settings.buttonText,
                $alternates = tools.forceArray(settings.buttonAlternate);


            $button.prop("disabled", false).on(clickOrTouch, clickHandler);
            tools.keydownOnce(settings.shortcutKeys, clickHandler);
            $alternates.forEach(function($thing) {
                $thing.on(clickOrTouch, alternateHandler);
            });
            $buttonText && $button.text($buttonText);


            // need primarily for Safari, which needs a sound actually played via the button
            const testHowl = new Howl({
                src: ["/sounds/dummyHowl.mp3"],
                onloaderror: (e) => console.log("Error loading the testHowl!"),
                volume: 0,
                format: ["mp3"],
            });


            function clickHandler() {


                testHowl.play(); // in order to "activate" sounds -- seems necessary for Safari! FUCK!


                $alternates.forEach(function($thing) {
                    $thing.off(clickOrTouch, alternateHandler);
                });


                $button.off(clickOrTouch, clickHandler).fadeOut(settings.buttonFadeoutTime, function() {
                    gambariTime && gambariTime.start();
                    tools.keydownOff(settings.shortcutKeys);
                    $button.remove();
                    settings.callback();
                });
            }


            function alternateHandler() {
                clickHandler();
            }
        }
        assignment.startButton = startButton;





        function nextButton(options) {


            if (!options || typeof options !== "object" ||
                !options.button ||
                !(options.button instanceof $) ||
                !options.callback ||
                typeof options.callback !== "function") {
                console.log("tools.nextButton got some bad parameters!");
                return false;
            }


            let settings = $.extend({
                buttonFadeoutTime: 200,
                initialClass: "my-template",
                callbackCondition: null,
                shortcutKeys: [13, 32, 39] // Enter, Space, and Right Arrow
            }, options);


            settings.buttonAlternate = tools.forceArray(settings.buttonAlternate);


            const $buttonParent = (settings.button).parent();
            const $buttonMaster = (settings.button).detach().removeClass(settings.initialClass);
            const $alternates = settings.buttonAlternate;
            const $buttonText = settings.buttonText;
            const callback = settings.callback;

            let $button = null;


            function show(delay) {
                delay = (delay && !isNaN(delay)) ? delay : 0;
                settings.onShow && settings.onShow();
                setTimeout(function() {
                    $button = $buttonMaster.clone().on(clickOrTouch, clickHandler).appendTo($buttonParent);
                    tools.keydownOnce(settings.shortcutKeys, clickHandler);
                    $alternates.forEach(function($this) {
                        $this.on(clickOrTouch, alternateHandler);
                    });
                    $buttonText && $button.text($buttonText);
                }, delay);
            }


            function clickHandler() {
                $button.off(clickOrTouch, clickHandler).fadeOut(settings.buttonFadeoutTime, function() {
                    $(this).remove();
                });
                $alternates && $alternates.forEach(function($this) {
                    $this.off(clickOrTouch, alternateHandler);
                });
                tools.keydownOff(settings.shortcutKeys, clickHandler);
                callback();
            }


            function alternateHandler() {
                clickHandler();
            }


            return {
                show,
            };
        }
        assignment.nextButton = nextButton;





        const fixedProblemHolder = (function() {


            const $detachableButton = $(".detachable-button");


            return function(options = {}) {


                options = $.extend({
                    onSlideUp: function() {
                        // do this when the thing slides up
                    },
                    onSlideDown: function() {
                        // do this when it slides back down
                    },
                    always: function() {
                        // do this any time
                    },
                }, options);


                if (options.remove) {
                    $detachableButton.remove();
                    return false;
                }


                $detachableButton.off("click").click(function() {
                    options.onClick && options.onClick();
                    $("body").toggleClass("full-screen");
                    options.always();
                    $("body").hasClass("full-screen") ? options.onSlideUp() : options.onSlideDown();
                });
            };
        }());
        assignment.fixedProblemHolder = fixedProblemHolder;




        const scorebar = (function() {


            const $scorebarTable = $("#scorebar-table");
            const $scorebarRow = $scorebarTable.find("#scorebar-row");
            const $scoreDotMaster = $scorebarRow.find(".score-dot.my-template").detach().removeClass("my-template");


            let numProblems = 0;
            let mistakesLine = 0;
            let totalNumberDots = 0;
            let numCorrect = 0;
            let numWrong = 0;


            function build(obj) {


                numProblems = obj.numProblems ? obj.numProblems : 0;
                mistakesLine = obj.mistakesLine ? obj.mistakesLine : 0;
                totalNumberDots = numProblems + mistakesLine;
                $holder = obj.holder;


                // optionally attaching the scorebar to some other element
                $holder && $scorebarTable.appendTo($holder);


                for (let i = 0; i < totalNumberDots; i++) {
                    let problemNumber = (i < numProblems) ? i + 1 : "";
                    $clone = $scoreDotMaster.clone().addClass(i < numProblems ? "correct-dot" : "wrong-dot").text(problemNumber).appendTo($scorebarRow);
                }


                // spacing cells evenly - necessary when some have text inside
                $scorebarRow.find("td").css({ width: (100 / totalNumberDots) + "%" });


                return this;
            }


            function incrementCorrect() {
                $scorebarRow.find(".correct-dot").eq(numCorrect).addClass("marked");
                numCorrect++;
            }


            function incrementWrong() {
                numWrong++;
                $scorebarRow.find(".wrong-dot").eq(mistakesLine - numWrong).addClass("marked");
            }


            return {
                incrementCorrect,
                incrementWrong,
                build,
            };
        }());
        assignment.scorebar = scorebar;





        function getProblemData(callback) {


            if (!ZOCKEY.problem_data) {
                console.log("There seems to be no ZOCKEY.problem_data!");
                return false;
            }


            const data = ZOCKEY.problem_data;


            data.misc = tools.safeParseJSON(data.misc);


            if (data.assignment.shuffle) {
                data.problem = tools.shuffle(data.problem);
            }


            /*
             *
             *      Appending additional info about the problem:
             *
             *      indexOfJapanese, indexOfSentakushi, and useAudio
             *
             */


            // assumes that the Japanese is the FIRST instance of Japanese test
            data.indexOfJapanese = tools.getArrayIndex({
                array: data.problem[0],
                searchFrom: "start",
                find: function(item) {
                    return tools.languageOf(item) === "Japanese";
                },
                onNull: function() {
                    //
                }
            });


            // assuming that the sentakushi are the LAST English element
            // NOTE that these could be same as the audio itself
            data.indexOfSentakushi = tools.getArrayIndex({
                array: data.problem[0],
                searchFrom: "end",
                find: function(thing) {
                    return tools.languageOf(thing) === "English";
                }
            });


            data.useAudio = (function() {


                // getting the checkbox value from database
                if (parseInt(data.assignment.use_audio)) return true;


                // or, returning FALSE if ANY of the elements are Japanese
                if (data.indexOfJapanese !== -1) return false;


                return true;
            }());


            bestTime.show(data.best_time);


            callback(data);
        }
        assignment.getProblemData = getProblemData;





        const directions = (function() {


            const $directionsHolder = $("#directions");


            const defaultDirectionsByAssignment = {
                chooseMeaning: "読まれる英文を聞いて、選択肢の中から一番適当なものを選びましょう。",
                trueFalse: "教科書の内容についての英語を聞いて、「正しい」か「正しくない」を選びましょう。",
                vocabulary: "英語を聞いて、正しいものをスライドしてドロップ・ゾーンに落としましょう。",
                cardDrop: "同じ意味の英語と日本語を重ねて遊びましょう。",
                narabekae_spoken: "英語を聞いて、単語を正しい順番に並べ替えましょう。",
                narabekae_written: "英単語を日本語の意味に合うように並べ替えましょう。",
                card_slider: "同意の日本語と英語を上下にずらして重ねましょう。",
                shinkei: "同意の日本語と英語のカードをマッチしていきましょう。",
                blanks_drop: "正しい英語を　「？」 のところにドラッグしましょう。",
                fill_blanks: "英語を聞いて、各空所に正しいワードをタイプしましょう。",
                fill_blanks_written: "日本語の意味に合わせて、各空所に正しいワードをタイプしましょう。",
                scrabble: "文字タイルを正しい順番に並べましょう！",
                space: "英語を聞いて、飛んでくる正しい日本語を打ちましょう！",
                invaders_spoken: "英語を聞いて、正しい順番に UFO を打ちましょう！",
                invaders_written: "日本語を読んで、正しい順番に UFO を打ちましょう！",
                video: "ビデオを見ましょう！早送りしたり、このページから離れたりすると記録が付きません！",
                eitango_marathon: "単語のスペルを打ち込みましょう。",
                pac_man: "パックマンを操作して、単語を正しい順番に食べて行きましょう。",
                word_spelling: "単語の英語のスペルを打ち込みましょう。",
            };


            function show(type, tagsObj) {
                tagsObj = tagsObj || {};
                $directionsHolder.append(tagsObj.directions || defaultDirectionsByAssignment[type]);
            }


            return {
                show,
            };
        }());
        assignment.directions = directions;





        const bestTime = (function() {

            /*
             *
             *      Shows the fastest times for the current assignment,
             *      for this user and all users
             *
             *
             */

            const $bestTimesHolder = $("#best-times-holder");
            const $recordHolderNotification = $("#record-holder-notification");
            const $bestOverallTimeHolder = $bestTimesHolder.find(".best-time-all-users .best-time-value");
            const $bestUserTimeHolder = $bestTimesHolder.find(".best-time-this-user .best-time-value");
            const $trophyMaster = $recordHolderNotification.find(".my-template").detach().removeClass("my-template");
            let secondsTag = " 秒";


            function showNotification(message) {
                $recordHolderNotification.text(message);
            }


            function addTrophy(numTimes) {

                for (let i = 0; i < numTimes; i++) {
                    $recordHolderNotification.append($trophyMaster.clone());
                }

                $bestTimesHolder.addClass("record-holder");
            }


            function show(p) {

                if (!p || typeof p !== "object") {
                    remove();
                    return false;
                }

                $bestOverallTimeHolder.text(p.overall_fastest_time ? p.overall_fastest_time + secondsTag : "-");
                $bestUserTimeHolder.text(p.user_fastest_time ? p.user_fastest_time + secondsTag : "-");

                if (p.user_is_record_holder) {
                    showNotification("** あなたは最高記録保持者です!");
                    addTrophy(5);
                }
            }

            function remove() {
                $bestTimesHolder.remove();
            }

            return { show, remove, };
        }());
        assignment.bestTime = bestTime;





        const showAssignmentResults = (function() {


            const $endScreenHolder = $("#end-screen-holder"); // have to do this HERE, before it's detached down below
            const $resultsRow = $(".results-row.my-template").removeClass("my-template").detach();
            const $assignmentResults = $("#assignment_results").detach();


            const terms = {
                timeUp: { label: "Time Up! ☹", class: "failed" },
                allAnswered: { label: "結果：合格! ☺", class: "success" },
                tooManyMistakes: { label: "結果：ざんね〜ん... ☹", class: "failed" },
                timeTrial: { label: "Finished! ☺", class: "success" }
            };


            return function(object) {

                /*
                 *
                 *      Takes an object like this:
                 *
                 *      {
                 *          container: $("#container_id"),
                 *          result: "allAnswered", // else "timeUp", "tooManyMistakes", etc.
                 *          data: [
                 *              {label: "時間", value: score.time_taken + " 秒"},
                 *              {label: "問題数", value: results.number_problems + " 問"},
                 *              {label: "間違い", value: score.number_mistakes}
                 *          ]
                 *      }
                 *
                 *      The HTML markup is included in the assignment view, undisplayed, at the bottom,
                 *      and then cloned up into the specified container
                 *
                 *
                 */


                if (!object || typeof object !== "object" || !object.container || !object.data || !object.result) {
                    console.log("tools.showAssignmentResults requires an object with .data and .result keys!");
                    return;
                }


                const $container = object.container;
                const data = object.data;


                // emptying the holding container, and copying the assignment_results stuff into it
                $container.empty();
                $assignmentResults.find(".result-header").html(terms[object.result].label);
                $endScreenHolder.addClass(terms[object.result].class);


                $("body").scrollTop(0);


                $assignmentResults.appendTo($container).fadeTo(100, 1);


                // displaying each item in the info (score, time_taken, etc.)
                data.forEach(function(item) {
                    const $newBlock = $resultsRow.clone().appendTo("#results-holder");
                    $newBlock.find(".label-holder").html(item.label ? item.label + ":" : " ");
                    $newBlock.find(".results-content").html(item.value);
                    item.rowClass && $newBlock.addClass(item.rowClass);
                });


                if (object.showPrintButton) {
                    $("#print-results-button").show().on("click", function() {
                        const originalContents = $("body").clone();
                        const divContents = $("#mainProblemsHolder")[0].innerHTML;
                        $("body").empty().html(divContents);
                        window.print();
                        setTimeout(function() {
                            $("body").html(originalContents);
                            $("#print-results-button").remove();
                        }, 0);
                    });
                }


                showNextAssignmentButton();
            };


            function showNextAssignmentButton() {


                if (!localStorage.isLoggedIn) return false;


                const assignments = assignmentTree();


                // exiting if there are no assignments, like, if user is not logged in
                if (!assignments) {
                    $("#nextAssignmentButton").remove();
                    return;
                }


                const nextAssignment = assignments.getNextAssignment();
                const chapter = nextAssignment.chapterName;
                const section = nextAssignment.sectionName;
                const assignment = nextAssignment.assignmentName;
                const href = "/" + nextAssignment.href;


                const string = `次の課題:<br>${chapter}, ${section}, ${assignment}`;


                $("#nextAssignmentButton").attr("href", href).html(string);
            }
        }());
        assignment.showAssignmentResults = showAssignmentResults;


        return assignment;
    });