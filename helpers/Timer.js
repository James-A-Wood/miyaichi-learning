define(
    [
        "jquery"
    ],
    function ($) {


        return function Timer(params = {}) {

            /*
             *
             *
             *  params = {
             *      pauseStart: @bool (optional, default false) - whether to pause start and wait for "start" method,
             *      countdownFrom: @number (optional, 0) - number seconds to countdown from (otherwise, count up from 0)
             *      eachSecond: @function (optional) - fires once per second,
             *      onFinish: @function (optional) - fires when finished (only if countdownFrom is set),
             *      onWarn: @function (optional) - fires some seconds before finish
             *  }
             *
             *
             *  properties/methods:
             *      start: @function - starts the clock,
             *      pause: @function - pauses the clock,
             *      time: @function - returns the clock current time
             *      set: @function - set any clock property to a value
             *      isRunning: @function - gets whether the timer is running
             *      getFormattedTime: @function - returns time, formatted in minutes & seconds
             *
             *
             */


            let settings = $.extend({
                container: null, // REQUIRED the DOM element to put the numbers in
                countdownFrom: null, // counts DOWN from this, or counts UP from 0 if it's null
                warnAt: null,
                warningClass: "warning", // class to add to container when some point is passed
                eachSecond: () => { },
                onFinish: () => { },
                onWarn: () => { },
                onInstantiation: () => { },
                onStopped: () => { },
                onStart: () => { },
                onDisable: () => { },
            }, params);


            const $container = params.container; // may be null!


            let totalTimeElapsed = 0;
            let isRunning = false;
            let onWarningHasFired = false;
            let lastSecondDisplayed = null;
            let startTime;
            let isDisabled = false;
            let formattedTime = {
                minutes: null,
                seconds: null
            };


            // starting the clock on instantiation, or not, depending...
            params.pauseStart ? $container?.css({ visibility: "visible" }) : start();


            // starts the timer IF not already running
            function start() {
                if (isRunning || isDisabled) return;
                isRunning = true;
                settings.onStart();
                startTime = Date.now();
                window.requestAnimationFrame(checkTime);
            }


            function stop() {
                settings.onStopped();
                isRunning = false;
            }


            // checks the time once a frame
            function checkTime() {


                totalTimeElapsed = Date.now() - startTime;
                refreshDisplay(totalTimeElapsed);
                const totalSecondsElapsed = totalTimeElapsed / 1000; // converting to seconds


                if (settings.warnAt && !onWarningHasFired && (totalSecondsElapsed >= (settings.countdownFrom - settings.warnAt))) {
                    $container && $container.addClass(settings.warningClass);
                    settings.onWarn();
                    onWarningHasFired = true;
                }


                if (settings.countdownFrom && totalSecondsElapsed >= settings.countdownFrom) {
                    stop();
                    settings.onFinish();
                } else {
                    isRunning && window.requestAnimationFrame(checkTime);
                }
            }


            function refreshDisplay(time) {


                time = time ?? 0;
                time = Math.floor(time / 1000); // converting to seconds
                time = settings.countdownFrom ? (settings.countdownFrom - time) : time;
                formattedTime.minutes = Math.floor(time / 60);
                formattedTime.seconds = time % 60;


                if (formattedTime.seconds === lastSecondDisplayed) return;


                lastSecondDisplayed = formattedTime.seconds;
                settings.eachSecond && settings.eachSecond(time);


                formattedTime.seconds = (formattedTime.seconds < 10) ? "0" + formattedTime.seconds : formattedTime.seconds;


                // showing text in the container, if applicable
                $container?.css({ visibility: "visible" }).text(formattedTime.minutes + ":" + formattedTime.seconds);
            }


            function getTotalTime() {
                const time = Math.floor(totalTimeElapsed / 1000);
                if (params.countdownFrom) return params.countdownFrom - time;
                return Math.floor(totalTimeElapsed / 1000);
            }


            this.getFormattedTime = () => formattedTime.minutes + ":" + formattedTime.seconds;


            // adds/changes settings dynamically, after instantiation
            function changeSettings(obj) {
                for (let key in obj) settings[key] = obj[key];
            }


            function getIsRunning() {
                return isRunning;
            }


            const setEnabledState = state => isDisabled = state;


            this.disable = () => {
                stop();
                settings.onDisable();
                setEnabledState(true);
            };


            this.enable = () => {
                setEnabledState(false);
            };


            settings.onInstantiation();


            // returning some methods
            this.start = start;
            this.stop = stop;
            this.time = getTotalTime;
            this.set = changeSettings;
            this.isRunning = getIsRunning;
        };
    }
);
