/* jshint expr: true */


/*
 *
 *
 *      Loads Howl objects individually
 *
 *
 *
 */



define(
    [
        "jquery",
        "Konva",
        "tools",
        "assignment",
        "howler",
    ],
    function(
        $,
        Konva,
        tools,
        assignment
    ) {


        let isPlaying = false,
            audioDisabled = false,
            howl = null;


        return function(inputs) {


            if (!inputs || typeof inputs !== "object" || !inputs.audioFiles) {
                console.log("AudioLoader requires an object with 'audioFiles' property!");
                return false;
            }


            let settings = $.extend({
                playButton: null, // jQuery or straight id string
                playButtonClassOnPause: "glyphicon-play", // default
                playButtonClassOnPlay: "glyphicon-pause", // default
                doRotateVoices: true,
                preloadAudio: false,
                // voices: ["Emma", "Joanna", "Justin", "Matthew"],
                onReady: function() {
                    // when the app is ready - all loaded, or on allLoaded
                },
                onEnded: function() {
                    // when a sound has finished playing
                },
                onIndividualSoundLoaded: function() {
                    // when a single sound has loaded
                },
                onLoadError: function() {
                    // when there's a load error
                },
                onPlay: function() {
                    // when a sound starts playing
                },
            }, inputs);


            const $playButton = tools.forceJQuery(settings.playButton);





            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
             *
             *
             *
             *      Voice stuff...
             *
             *
             *
             * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
            const voicesArray = tools.getAllVoices(true); // true == shuffle
            const $radios = $("input[name='voice-radio']");


            let voiceIndex = 0;


            function getVoiceRadioValue() {
                return assignment.controlPanel.getVoice();
            }


            function getVoice() {
                return getVoiceRadioValue() === "random" ? tools.getCurrentVoice() : getVoiceRadioValue();
            }


            function setVoice(newVoice) {
                if (voicesArray.indexOf(newVoice) === -1) return false;
                voiceIndex = voicesArray.indexOf(newVoice);
                return this;
            }


            let nowBetweenProblems = false;
            let audio;
            let numSoundsLeftToLoad = Object.keys(settings.audioFiles).length;


            settings.onReady();


            function loadAudio(thisAudio, doAutoplay) {


                // Slanted and straight quotes may conflict, so trying to convert
                if (!inputs.audioFiles.hasOwnProperty(thisAudio)) {
                    thisAudio = tools.straightQuotesToSlanted(thisAudio);
                    if (!inputs.audioFiles.hasOwnProperty(thisAudio)) {
                        console.log("Couldn't load this sound: " + thisAudio);
                        return false;
                    }
                }


                const voice = getVoice();


                howl = new Howl({
                    src: `/audio/${voice}/${inputs.audioFiles[thisAudio]}`,
                    autoplay: doAutoplay,
                    onend: reset,
                    onstop: reset,
                    onload: function() {
                        settings.onIndividualSoundLoaded();
                    },
                    onplay: function() {
                        tools.rotateVoice();
                        isPlaying = true;
                        settings.onPlay();
                        $playButton.removeClass(settings.playButtonClassOnPause).addClass(settings.playButtonClassOnPlay);
                    },
                    onloaderror: function(e) {
                        isPlaying = false;
                        console.log("Error loading: " + thisAudio);
                        console.log(e);
                        isPlaying = false;
                        settings.onLoadError();
                    }
                });
            }


            function reset() {
                isPlaying = false;
                settings.onEnded();
                $playButton.removeClass(settings.playButtonClassOnPlay).addClass(settings.playButtonClassOnPause);
            }


            function isNowBetweenProblems(setToThis) {
                if (typeof setToThis !== "undefined") {
                    nowBetweenProblems = setToThis;
                }
                return nowBetweenProblems;
            }


            function play(wordToPlay) {
                if (audioDisabled || isPlaying) return;
                wordToPlay = wordToPlay || settings.getWordToPlay();
                loadAudio(wordToPlay, true); // true == autoplay
                return this;
            }


            function stop() {
                howl && howl.stop();
                isPlaying = false;
                return this;
            }


            function startButtonMode() {
                $playButton.removeClass("btn-primary btn-success").addClass("btn-danger").text("Start");
                return this;
            }


            function disable() {
                audioDisabled = true;
                return this;
            }


            function getAllAudioForThisVoice() {
                settings.preloadAudio && Object.keys(inputs.audioFiles).forEach(function(thisAudio) {
                    howl = new Howl({
                        src: [`/audio/${getVoice()}/${inputs.audioFiles[thisAudio]}`],
                    });
                });
            }


            // inputs.audioFiles may contain more words than we actually need for this problem, so
            // if inputs.wordsList is specified, we remove the extra words from the audioFiles
            if (inputs.wordsList) {
                tools.whittleDownObject(inputs.audioFiles).toKeysIn(inputs.wordsList);
            }


            getAllAudioForThisVoice();


            return {
                getVoice,
                setVoice,
                isNowBetweenProblems,
                play,
                disable,
                startButtonMode,
                stop,
                stopAll: stop, // KLUGEY "stopAll" is a pointer to "stop" for compatability reasons
                onPlay: function(doThis) {
                    settings.onPlay = doThis;
                }
            };
        };
    }
);