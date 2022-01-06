define(
        [
            "jquery",
            "howler",
        ],
    function($) {

        return function(settings = {}) {

            const audioFolder = settings.audioFolder || "/audio/";
            const $player = settings.player || $("#audio-player");
            const $playButton = settings.playButton || $player.find(".glyphicon-play");
            const $pauseButton = settings.pauseButton || $player.find(".glyphicon-pause");
            const $stopButton = settings.stopButton || $player.find(".glyphicon-stop");
            const $textHolder = settings.textHolder || $player.find("#text-holder");
            const $durationHolder = settings.durationHolder || $player.find("#duration-holder");
            const $retractIcon = settings.retractIcon || $player.find("#retract-icon");
            const $progressBar = settings.progressBar || $player.find("#audio-progress-bar");
            const playerIsActiveClass = settings.playerIsActiveClass || "is-active";
            const playerIsPlayingClass = settings.playerIsPlayingClass || "is-playing";
            const maxLabelLength = settings.maxLabelLength || 15;

            let fileName = "",
                label = null,
                howl = new Howl({ src: [""], }); // setting "howl" to be at least a Howl object, never null

            $playButton && $playButton.click(play);
            $stopButton && $stopButton.click(stop);
            $pauseButton && $pauseButton.click(pause);

            $retractIcon && $retractIcon.click(function() {
                $player.removeClass(playerIsActiveClass);
            });

            const progressBar = (function(obj = {}) {

                const numSteps = $progressBar.attr("max") - $progressBar.attr("min");
                const playKeys = settings.playShortKeys || [32, 80, 38, 40]; // space bar, p, ↑, ↓
                const forwardBackwardKeys = settings.forwardBackwardKeys || [37, 39];
                const ffStep = settings.fastForwardStop || 0.1; // 10% of the audio duration

                $progressBar.on("input", function() {
                    const seekPosition = $(this).val() / numSteps * howl.duration();
                    howl.seek(seekPosition);
                });

                $progressBar.focus(() => {
                    $(window).off("keydown", manipulatePlayback).on("keydown", manipulatePlayback);
                }).blur(() => {
                    $(window).off("keydown", manipulatePlayback);
                });

                function manipulatePlayback(e) {

                    if (playKeys.indexOf(e.which) !== -1) {
                        e.preventDefault();
                        howl.playing() ? howl.pause() : howl.play();
                    }

                    if (forwardBackwardKeys.indexOf(e.which) !== -1) {
                        const direction = (e.which === 37) ? -1 : 1;
                        let newPos = howl.seek() + (howl.duration() * ffStep * direction);
                        newPosition = Math.max(newPosition, 0); // set to 0, if less than 0
                        howl.pause().seek(newPosition);
                        follow();
                    }

                    return this;
                }

                function reset() {
                    $progressBar && $progressBar.val(0);
                    return this;
                }

                function follow() {
                    const percent = howl.seek() / howl.duration();
                    $progressBar && $progressBar.val(percent * numSteps);
                    howl.playing() && requestAnimationFrame(follow);
                    return this;
                }

                function focus() {
                    $progressBar && $progressBar.focus();
                    return this;
                }

                return { reset, follow, focus, };
            }());


            function play(obj = {}) {

                if (howl.playing() && obj.fileName === fileName) { return false; }

                if (!obj.fileName || obj.fileName === fileName) {
                    howl.play();
                    return this;
                }

                fileName = obj.fileName;
                howl.stop();
                howl = new Howl({
                    src: [audioFolder + obj.fileName + ".mp3"],
                    onload: function() {
                        $player.addClass(playerIsActiveClass).removeClass(playerIsPlayingClass);
                        progressBar.reset();
                        howl.play();
                        $durationHolder.text(Math.floor(howl.duration() * 100) / 100 + "s");
                    },
                    onpause: function() {
                        progressBar.focus();
                        $player.removeClass(playerIsPlayingClass);
                    },
                    onstop: function() {
                        progressBar.focus();
                        $player.removeClass(playerIsPlayingClass);
                    },
                    onplay: function() {
                        progressBar.follow().focus();
                        $player.addClass(playerIsPlayingClass);
                    },
                    onend: function() {
                        $player.removeClass(playerIsPlayingClass);
                        progressBar.reset();
                    },
                    onloaderror: function(e) {
                        log("Error!");
                        log(e);
                        $player.removeClass(playerIsActiveClass, playerIsPlayingClass);
                        progressBar.reset();
                    },
                });

                if (obj.label) {
                    label = obj.label;
                    label = (label.length < maxLabelLength) ? label : label.substring(0, maxLabelLength - 1) + "...";
                    $textHolder.empty().text(label);
                }

                return this;
            }

            function stop() {
                howl.stop();
                progressBar.reset();
                return this;
            }

            function pause() {
                howl.pause();
                return this;
            }

            return { play, stop, pause, };
        };
    }
);