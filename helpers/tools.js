/* jshint expr: true */

(function () {
    "use strict";
}());


define = define || function () {
    //
};


define(
    [
        "jquery",
        "jqueryui",
        "howler",
    ],
    function ($) {





        window.log = console.log;





        /*
         *
         *      Extending jQuery!  How cool is this?
         *
         *      A few functions to deal with various input types, their
         *      various change events, and methods for retrieving values
         *
         *
         *
         */





        // gets input type, like "button" or "radio"
        // usage: let type = $("#thisElement").getInputType();
        // NOTE can't use fat-arrow function here, because it screws with "this"
        $.fn.getInputType = function () {
            if (!$(this)) return log("No $(this) for getInputType!"); // NEW TEST sometimes it seems there's no "this"!
            const type = $(this).attr("type");
            const tagName = $(this)[0].tagName;
            return (type || tagName).toLowerCase();
        };


        // gets the input value for various types of input
        // like this: let value = $("#someElement").getInputValue();
        $.fn.getInputValue = function () {

            const type = this.getInputType();

            if (["text", "number", "textarea", "range", "select"].indexOf(type) !== -1) return this.val();
            if (type === "checkbox") return this.is(":checked") ? 1 : 0;

            if (type === "radio") {
                const name = $(this[0]).prop("name");
                return $(`input[name='${name}'']:checked`).val();
            }

            return null;
        };


        // gets the appropriate change event to listen for for various
        // kinds of inputs, e.g., "change", "click", or "input"
        $.fn.getInputChangeEvent = function () {

            const type = this.getInputType();
            const inputTypes = ["checkbox", "text", "textarea", "number", "radio", "select"];

            if (inputTypes.indexOf(type) !== -1) return "change";
            if (type === "button" || type === "submit") return "click";
            if (type === "range") return "input"; // 'input' responds while sliding; 'change' responds only when finished sliding

            return null;
        };





        let tools = {};





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *
         *      Simple timer - starts, stops, clears, does something every second, etc.
         *
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function timer(obj = {}) {


            obj = $.extend({
                onEachFrame: function () {
                    // log("Frame!");
                },
                onEachSecond: function () {
                    // log(lastSecond + " seconds");
                },
                onStart: function () {
                    log("Started");
                },
                onStop: function () {
                    // log("Stopped");
                },
                onPause: function () {
                    log("Paused");
                },
                onClear: function () {
                    // log("Cleared!");
                },
            }, obj);


            let t1 = Date.now();
            let timeElapsed = 0;
            let secondsCounter = 0;
            let timerIsRunning = false;


            function eachFrame() {
                t2 = Date.now()
                if (timerIsRunning) timeElapsed += (t2 - t1);
                if (timerIsRunning) secondsCounter += (t2 - t1);
                t1 = t2;
                checkForSecond();
                obj.onEachFrame();
                window.requestAnimationFrame(eachFrame);
            }


            function checkForSecond() {
                if (secondsCounter < 1000) return;
                secondsCounter -= 1000;
                obj.onEachSecond();
            }


            function start() {
                if (timerIsRunning) return;
                timerIsRunning = true;
                t1 = Date.now();
                eachFrame();
                obj.onStart();
            }


            function stop() {
                if (!timerIsRunning) return this;
                timerIsRunning = false;
                t1 = null;
                obj.onStop();
                return this;
            }


            function getTimeElapsed() {
                return timeElapsed;
            }


            function getSecondsElapsed() {
                return Math.floor(getTimeElapsed() / 1000);
            }


            function isRunning() {
                return timerIsRunning;
            }


            function pause() {
                timerIsRunning = false;
                t1 = null;
                obj.onPause();
                return this;
            }


            function reset() {
                stop();
                t1 = null;
                t2 = null;
                lastSecond = null;
                timeElapsed = 0;
                obj.onClear();
                return this;
            }


            return {
                isRunning,
                pause,
                reset,
                start,
                stop,
                getTimeElapsed,
                getSecondsElapsed,
            };
        }



        function Timer(obj = {}) {


            const controller = new TimerController(Ticker, Display, Interval);
            const public = this;


            function TimerController(Ticker, Display, Interval) {

                const ticker = new Ticker();
                const display = new Display();

                display.getMs = () => ticker.getElapsedMs();
            };


            function Ticker() {

                let elapsedMs = 0;
                let isRunning = false;
                let t1 = Date.now();
                let elapsedSeconds = 0;

                setInterval(() => {
                    const t2 = Date.now();
                    if (isRunning) elapsedMs += t2 - t1;
                    if (isRunning) checkForSecond(t2 - t1);
                    t1 = t2;
                }, 20);

                function checkForSecond(ms) {
                    elapsedMs += ms;
                    if (elapsedSeconds < 1000) return;
                    elapsedSeconds -= 1000;
                    this.onElapsedSecond();
                }

                this.getElapsedMs = () => elapsedMs;
                this.onElapsedSecond = () => undefined;
                this.changeRunningState = val => isRunning = val ?? !isRunning;
            }


            function Display() {

                const pad = t => t < 10 ? "0" + t : t;

                this.getMs = () => undefined;

                this.getFormattedTime = () => {

                    const ms = this.getMs();
                    const totalSeconds = Math.floor(ms / 1000);
                    const displaySeconds = totalSeconds % 60;
                    const minutes = Math.floor(totalSeconds / 60);
                    const hundredths = Math.floor(ms / 10) % 100;

                    return {
                        raw: {
                            totalSeconds,
                            displaySeconds,
                            minutes,
                            hundredths
                        },
                        padded: {
                            totalSeconds: pad(totalSeconds),
                            displaySeconds: pad(displaySeconds),
                            minutes: pad(minutes),
                            hundredths: pad(hundredths),
                        },
                    };
                }
            }



            // return {
            //     isRunning,
            //     pause,
            //     reset,
            //     start,
            //     stop,
            //     getTimeElapsed,
            //     getSecondsElapsed,
            // };
        }





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *
         *      Analyzing arrays to see if they intersect partially, completely, etc.
         *
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function arrayIntersectHandler(a1, a2) {


            if (arguments.length !== 2 || !Array.isArray(a1) || !Array.isArray(a2)) {
                return log("Didn't the right number of arrays!");
            }


            if (!a1.length || !a2.length) return false;


            const intersection = a1.filter(item => a2.indexOf(item) !== -1);
            const numOverlap = intersection.length;
            const arraysDoIntersect = !!numOverlap;
            const arraysDontOverlap = !arraysDoIntersect;
            const arraysOverlapCompletely = a1.every(item => a2.indexOf(item) !== -1) || a2.every(item => a1.indexOf(item) !== -1);


            return {
                numOverlap,
                arraysDoIntersect,
                arraysDontOverlap,
                arraysOverlapCompletely,
            };
        }





        function arraysDoIntersect(a1, a2) {
            return arrayIntersectHandler(a1, a2).arraysDoIntersect;
        }
        tools.arraysDoIntersect = arraysDoIntersect;





        function arraysOverlapCompletely(a1, a2) {
            return arrayIntersectHandler(a1, a2).arraysOverlapCompletely;
        }
        tools.arraysOverlapCompletely = arraysOverlapCompletely;





        function stringsIntersect(s1, s2, obj = {}) {
            const a1 = s1.split(" " ?? obj.breakOn);
            const a2 = s2.split(" " ?? obj.breakOn);
            return arraysDoIntersect(a1, a2);
        }
        tools.stringsIntersect = stringsIntersect;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *
         *      Just a shortcut for the audio voices
         *
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        const getAudioVoices = (function () {


            const baseArray = ["Emma", "Joanna", "Justin", "Matthew"];


            return function (doShuffle = false) {
                return doShuffle ? shuffleArray(baseArray) : baseArray;
            };
        }());
        tools.getAudioVoices = getAudioVoices;




        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *
         *      Picking a random voice for the audio
         *
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        const audioVoice = (function () {

            const voicesArray = getAudioVoices();
            const shuffledArray = getAudioVoices(true);

            let voicePointer = 0;

            return {
                rotateVoice: () => voicePointer++,
                getCurrentVoice: () => shuffledArray[voicePointer % voicesArray.length],
                getAllVoices: (obj = {}) => obj.shuffle ? shuffledArray : voicesArray,
            };
        }());
        tools.rotateVoice = audioVoice.rotateVoice;
        tools.getCurrentVoice = audioVoice.getCurrentVoice;
        tools.getAllVoices = audioVoice.getAllVoices;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      Simply plays a sound. Stops on any keypress.
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        const simplePlayer = (function () {

            let isPlaying = false;
            let playerSettings = {};
            let howl = null;

            function set(obj = {}) {
                $.extend(playerSettings, obj);
                return true;
            }

            function play(file, obj = {}) {
                if (!file) return;
                howl && howl.stop();
                if (isPlaying) return;
                isPlaying = false;
                if (file.toString().indexOf(".mp3") === -1) file += ".mp3";

                const voice = obj.voice || audioVoice.pickRandom();
                howl = new Howl({
                    src: playerSettings.useCustomPath ? [file] : [`/audio/${voice}/${file}`],
                    autoplay: playerSettings.autoplay || true,
                    onplay: function () {
                        $(window).on("keydown", stop);
                        playerSettings.onplay && playerSettings.onplay();
                        obj.onplay && obj.onplay();
                    },
                    onend: function () {
                        $(window).off("keydown", stop);
                        isPlaying = false;
                        playerSettings.onstop && playerSettings.onstop();
                        obj.onstop && obj.onstop();
                    },
                    onstop: function () {
                        $(window).off("keydown", stop);
                        isPlaying = false;
                        playerSettings.onstop && playerSettings.onstop();
                        obj.onstop && obj.onstop();
                    },
                    onloaderror: function (e) {
                        log("Couldn't load " + file);
                    }
                });
            }


            function stop(e) {
                e.preventDefault();
                howl && howl.stop();
            }


            return {
                play,
                stop,
                set,
            };
        }());
        tools.simplePlayer = simplePlayer;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *
         *      Loads a JavaScript file dynamically
         *
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function loadScript(scriptSrc, callback) {
            let scriptTag = document.createElement("script");
            scriptTag.src = scriptSrc;
            document.head.appendChild(scriptTag);
            scriptTag.onload = function () {
                callback && callback();
            };
        }
        tools.loadScript = loadScript;






        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *
         *      Returns the average width of an array of jQuery elements
         *
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function getAverageWidth(elements = []) {
            let totalWidth = 0;
            elements.forEach($span => {
                $span = forceJQuery($span);
                totalWidth += $span.outerWidth();
            });
            return totalWidth / elements.length;
        }
        tools.getAverageWidth = getAverageWidth;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *
         *      Forcing an element to be jQuery
         *
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function forceJQuery(element) {
            return element instanceof $ ? element : $(element);
        }
        tools.forceJQuery = forceJQuery;






        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *
         *      Couldn't be simpler
         *
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function isMobile() {
            return typeof window.orientation !== "undefined";
        }
        tools.isMobile = isMobile;





        tools.isNotMobile = () => !isMobile();





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *
         *      Scrolls an element to the middle of the page (actually, the top of the element)
         *
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function scrollToMiddle(elem) {
            elem = (elem instanceof $) ? elem[0] : elem; // extracting HTML element from jQuery
            const absoluteElementTop = elem.getBoundingClientRect().top + window.pageYOffset;
            const middle = absoluteElementTop - (window.innerHeight / 2);
            window.scrollTo(0, middle);
        }
        tools.scrollToMiddle = scrollToMiddle;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *
         *      Handles the saving an object or array in localStorage (or sessionStorage) as JSON
         *
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function objectStorage(masterKey, sessionOrLocalStorage = "sessionStorage") {

            if (!masterKey) return log("objectStorage requires a key for the local (or session) storage!");

            const storage = window[sessionOrLocalStorage]; // either "localStorage" or "sessionStorage"

            let json = safeParseJSON(storage[masterKey]);

            return function (p) {

                /*
                    Usage:

                    tools.userInfo()                       --> GETS the WHOLE string, parsed as JSON
                    tools.userInfo("clear")                --> DELETES the object entirely from storage
                    tools.userInfo("username")             --> GETS the "username" value from the object
                    tools.userInfo("username", "James")    --> SETS the "username" to "James"
                    tools.userInfo({ one: 1, two: 2 })     --> SETS multiple values to the object
                    tools.userInfo([1, 2, 3,])             --> SETS the whole ARRAY into storage
                */

                const numArgs = arguments.length;

                if (!numArgs) return Object.keys(json).length ? json : null; // returning null if it's an empty object

                const arg1 = arguments[0];
                const arg2 = arguments[1];

                // saving key + value, like "storeObject('numStudent', 3)"
                if (numArgs === 2) { // key + value, presumably
                    json[arg1] = arg2;
                    storage[masterKey] = JSON.stringify(json);
                    return json;
                }

                if (numArgs === 1) {

                    if (arg1 === "clear") return storage.removeItem(masterKey);

                    if (typeof arg1 === "string") return json[arg1];

                    // overwriting the whole value with array new array
                    if (Array.isArray(p)) {
                        storage[masterKey] = JSON.stringify(p);
                        return p;
                    }

                    // extending the values
                    if (typeof p === "object") {
                        $.extend(json, p);
                        storage[masterKey] = JSON.stringify(json);
                        return json;
                    }
                }

                return false;
            };
        }
        tools.objectStorage = objectStorage;





        // shortcut methods for objectStorage
        tools.objectLocalStorage = function (masterKey) {
            return objectStorage(masterKey, "localStorage");
        };





        tools.objectSessionStorage = function (masterKey) {
            return objectStorage(masterKey, "sessionStorage");
        };





        /*

            Testing whether localStorage works or not, and alerting a warning if not

        */
        function warnPrivateBrowsing() {
            try {
                localStorage.setItem("testItem", "test_value");
                localStorage.removeItem("testItem");
            } catch (e) {
                alert("このサイトはプライベート・ブラウズに対応していません！\n\nプライベート・ブラウズを解除してください！\n\n - by Wood！");
            }
        }
        tools.warnPrivateBrowsing = warnPrivateBrowsing;






        function getArrayIndex(obj) {

            if (!obj || typeof obj !== "object" || !obj.array || !obj.find) return false;

            if (obj.searchFrom && obj.searchFrom !== "start" && obj.searchFrom !== "end") {
                return log("searchFrom property must be 'start' or 'end'");
            }

            if (!obj.find || typeof obj.find !== "function") {
                return log("getArrayIndex requires a 'find' property that is a function!");
            }

            const array = obj.array;
            const searchFrom = obj.searchFrom || "start";
            const meetsSearchCondition = obj.find;
            const onNull = obj.onNull;

            // loops through an array, either forwards or backwards, and
            // returns the index of the searched-for value, else -1
            function searchArrayByDirection(startValue, testCondition, direction) {
                for (let i = startValue; testCondition(i); i += direction) {
                    if (meetsSearchCondition(array[i])) return i;
                }
                onNull && onNull();
                return -1;
            }


            if (searchFrom === "start") {
                return searchArrayByDirection(0, function (i) {
                    return i < array.length;
                }, 1);
            } else {
                return searchArrayByDirection(array.length - 1, function (i) {
                    return i >= 0;
                }, -1);
            }
        }
        tools.getArrayIndex = getArrayIndex;








        const pickColor = (function () {

            const baseColors = {
                light: shuffleArray([
                    "yellow",
                    "orange",
                    "springgreen",
                    "powderblue",
                    "lightcyan",
                    "greenyellow",
                    "aqua",
                ]),
                dark: shuffleArray([
                    "navy",
                    "blue",
                    "purple",
                    "darkred",
                    "darkslateblue",
                    "indigo",
                    "darkcyan",
                    "green",
                    "darkgreen",
                ]),
            };
            baseColors.allColors = [...baseColors.light, ...baseColors.dark];

            let index = 0;

            return function (colorType) {
                if (!(colorType in baseColors)) return log("Requires either 'light', 'dark', or 'allColors'!");
                const numColors = baseColors[colorType].length;
                return () => baseColors[colorType][++index % numColors];
            };
        }());
        tools.pickColor = pickColor("allColors");
        tools.pickDarkColor = pickColor("dark");
        tools.pickLightColor = pickColor("light");





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      Takes an array and removes random elements
         *      until it's a specified length
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function whittleDownArray(array, desiredLength) {
            if (arguments.length === 0 || !Array.isArray(array)) return log("whittleDownArray got some bad parameteres!");
            if (!desiredLength) return array;
            while (array.length > desiredLength) pickOneFrom(array, true); // true means "delete this index"
            return array;
        }
        tools.whittleDownArray = whittleDownArray;





        /*
         *
         *      Removes elements from an object whose keys are not in a given array
         *
         *      Example: whittleDownObject(obj).toKeysIn(array);
         *
         *      NOTE this "returns" nothing, since objects are passed by reference
         *
         *
         */
        function whittleDownObject(object) {

            if (!object || typeof object !== "object" || Object.keys(object).length < 1) {
                return log("whittleDownObject requires an object as the first parameter!");
            }

            return {
                toKeysIn: function toKeysIn(array) {

                    if (!array || !Array.isArray(array) || !array.length) {
                        return log("whittleDownObject requires an array as the second parameter!");
                    }

                    // looping through the object, removing any elements where
                    // the key isn't in the array
                    for (let key in object) if (array.indexOf(key) === -1) delete object[key];
                }
            };
        }
        tools.whittleDownObject = whittleDownObject;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *
         *      Links a checkbox with a localStorage key, toggling between "true" and "false"
         *
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function checkboxStateHandler(obj = {}) {


            obj = $.extend({
                checkbox: null, // REQUIRED
                localStorageKey: null, // REQUIRED
                checkedValue: "true",
                uncheckedValue: "false",
                defaultToChecked: false, // whether to check by default on first use
                onChange: function () {
                    //
                },
                onCheck: function () {
                    //
                },
                onUncheck: function () {
                    //
                },
            }, obj);


            if (!obj.checkbox || !obj.localStorageKey) {
                return log("checkBoxStateHandler requires 'checkbox' and 'localStorageKey' properties!");
            }


            const $checkbox = tools.forceJQuery(obj.checkbox);
            const key = obj.localStorageKey;
            const checkedValue = obj.checkedValue;
            const uncheckedValue = obj.uncheckedValue;


            // checking by default IF it has never been set before AND 'defaultToChecked' is true
            if (!localStorage.hasOwnProperty(key) && obj.defaultToChecked) {
                localStorage.setItem(key, checkedValue);
                setCheckedStateTo(true);
                obj.onChange && obj.onChange();
            }


            $checkbox.on("change", function () {
                localStorage[key] = isChecked() ? checkedValue : uncheckedValue;
                obj.onChange();
                $checkbox.is(":checked") ? obj.onCheck() : obj.onUncheck();
            });


            function setCheckedStateTo(thisValue = false) {
                $checkbox.prop("checked", thisValue);
                return this;
            }


            function isChecked() {
                return $checkbox.is(":checked");
            }


            function disable() {
                $checkbox.prop("disabled", true);
                return this;
            }


            function enable() {
                $checkbox.prop("disabled", false);
                return this;
            }


            $checkbox.prop("checked", localStorage[key] === checkedValue);


            return {
                isChecked,
                disable,
                enable,
            };
        }
        tools.checkboxStateHandler = checkboxStateHandler;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *
         *      Links a radio input with a localStorage key, toggling between "true" and "false"
         *
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function radioStateHandler(obj = {}) {


            obj = $.extend({
                radioName: null, // REQUIRED
                localStorageKey: null, // REQUIRED
                onChange: function () {
                    //
                },
            }, obj);


            const radioName = obj.radioName;
            const $radios = $(`input[type='radio'][name='${radioName}']`);
            const localStorageKey = obj.localStorageKey;


            $radios.on("change", function () {
                localStorage[localStorageKey] = getValue();
                obj.onChange();
            });


            function getValue() {
                return $(`input[type='radio'][name='${radioName}']:checked`).val();
            }


            function setValue(value) {
                $(`input[type='radio'][name='${radioName}'][value='${value}']`).prop("checked", true);
                return this;
            }


            function disable() {
                $radios.prop("disabled", true);
            }


            function enable() {
                $radios.prop("disabled", false);
            }


            setValue(localStorage[localStorageKey]);


            return {
                getValue,
                setValue,
                disable,
                enable,
            };
        }
        tools.radioStateHandler = radioStateHandler;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *
         *      Links a select input with a localStorage key, toggling between "true" and "false"
         *
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function selectStateHandler(obj = {}) {


            obj = $.extend({
                select: null, // REQUIRED, jQuery or not
                localStorageKey: null, // REQUIRED
                options: [],
                onChange: function () {
                    //
                },
            }, obj);


            const $select = forceJQuery(obj.select);
            const localStorageKey = obj.localStorageKey;


            setOptions(obj.options);


            $select.on("change", function () {
                localStorage[localStorageKey] = getValue();
                obj.onChange();
            });


            function setOptions(array) {
                forceArray(array).forEach(function (item) {
                    const value = (typeof item === "object" && item.value) ? item.value : item;
                    const label = (typeof item === "object" && item.label) ? item.label : item;
                    $select.append(`<option value="${value}">${label}</option>`);
                });
                return true;
            }


            function getValue() {
                return $select.val();
            }


            function setValue(value) {
                $select.val(value);
                return this;
            }


            function disable() {
                $select.prop("disabled", true);
            }


            function enable() {
                $select.prop("disabled", false);
            }


            setValue(localStorage[localStorageKey]);


            return {
                getValue,
                setValue,
                disable,
                enable,
                setOptions,
            };
        }
        tools.selectStateHandler = selectStateHandler;






        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      naturally sorts an array of items, or an array of objects by some key in the objects
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function naturallySort(array, key) {

            array.sort(function (a, b) {

                let k1 = a,
                    k2 = b;

                if (key) {
                    k1 = k1[key];
                    k2 = k2[key];
                }

                return k1.toString().localeCompare(k2.toString(), undefined, { // WHOOOA I don't understand this
                    numeric: true,
                    sensitivity: "base"
                });
            });

            return true;
        }
        tools.naturallySort = naturallySort;





        /*
         *
         *
         *      Converts an image to a dataURI, via a canvas element (which is not added to the DOM)
         *
         *
         */
        function imageToDataURL(image, obj = {}) {

            const ratio = (function () {

                if (obj.maxWidth && obj.maxHeight) {
                    return Math.min(obj.maxWidth / image.width, obj.maxHeight / image.height);
                } else if (obj.maxWidth) {
                    return obj.maxWidth / image.width;
                } else if (obj.maxHeight) {
                    return obj.maxHeight / image.height;
                }
                return 1;
            }());

            // creating a canvas element, but never adding it to the DOM
            const canvas = document.createElement("canvas");
            canvas.width = image.width * ratio;
            canvas.height = image.height * ratio;
            canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);

            return canvas.toDataURL();
        }
        tools.imageToDataURL = imageToDataURL;





        /*
         *
         *
         *      Converts an image to a dataURI, via a canvas element
         *
         *
         */

        function dataURLToBlob(obj = {}) {

            if (!obj.url) return log("dataURLToBlob got some bad parameters");

            const callback = obj.onFinish;

            let parts,
                contentType,
                raw,
                blob,
                dataURL = obj.url;

            if (dataURL.indexOf(";base64,") === -1) {
                parts = dataURL.split(',');
                contentType = parts[0].split(':')[1];
                raw = parts[1];
                blob = new Blob([raw], { type: contentType });
                obj.onFinish && obj.onFinish(blob);
                return;
            }

            parts = dataURL.split(";base64,");
            contentType = parts[0].split(':')[1];
            raw = window.atob(parts[1]);

            const uInt8Array = new Uint8Array(raw.length);

            for (let i = 0; i < raw.length; ++i) uInt8Array[i] = raw.charCodeAt(i);

            blob = new Blob([uInt8Array], { type: contentType });

            obj.onFinish && obj.onFinish(blob);
        }
        tools.dataURLToBlob = dataURLToBlob;





        /*
         *
         *
         *      Converts a Konva layer (canvas) to a PNG image, so it can be printed
         *
         *
         *
         */
        function konvaLayerToImage(layer) {
            const imageData = layer.getCanvas().toDataURL();
            const canvas = layer.getCanvas()._canvas; // funky
            const $image = $(`<img src='${imageData}'>`).css({
                width: layer.width() + "px", // NOTE have to force width & height, for cases where
                height: layer.height() + "px", // the pixel ration may be weird
            });
            $(canvas).replaceWith($image);
            return true;
        }
        tools.konvaLayerToImage = konvaLayerToImage;





        function objectToArray(thing) {


            /* * * * * * * * * * * * * * * * * * * * * * * *
             *
             *
             *      changes an object to an array, like this:
             *
             *      {dog: 犬} --> ["dog", "犬"]
             *
             *
             * * * * * * * * * * * * * * * * * * * * * * * * */


            if (Array.isArray(thing)) return thing;

            let array = [];
            for (let word in thing) array.push([word, thing[word]]);
            return array;
        }
        tools.objectToArray = objectToArray;





        // adjusting quotes (slanted to straight) and removing any 2+ consecutive spaces
        function removeExtraWhiteSpace(string, obj = {}) {
            string = string.replace(/’|‘/g, "'"); // slanted single quotes (open and close) to straight
            string = string.replace(/“|”/g, '"'); // slanted double quotes (open and close) to straight
            string = string.replace(/\s{2,}/g, " ").trim();
            return string;
        }
        tools.removeExtraWhiteSpace = removeExtraWhiteSpace;





        function straightQuotesToSlanted(string) {
            // string = string.replace(/(\w)'(\w)/g, "$1’$2"); // apostrophe
            // string = string.replace(/ "/g, " ”"); // opening double quote
            // string = string.replace(/(\w)"/g, "$1”"); // closing double quote
            return string;
        }
        tools.straightQuotesToSlanted = straightQuotesToSlanted;




        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      1.  Splits a string into an array of words,
         *      2.  Trims white space from all elements (words), and
         *      3.  Optionally removes underscores
         *      4.  Optionally shuffles
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function trimAllElements(array, options = {}) {

            if (typeof array === "string") {
                array = removeExtraWhiteSpace(array);
                array = array.split(" ");
            }

            if (!Array.isArray(array)) return log("trimAll requires an array or a string!");

            // trimming each item (string) and replacing underscores with spaces, optionally
            array = array.map(item => {
                item = item.trim();
                item = removeExtraWhiteSpace(item);
                if (options.removeUnderscores) item = item.replace(/_/gi, " ");
                item = item.replace(/‘|’/g, "'"); // slanted single quotes to straight
                item = item.replace(/“|”/g, "\""); // slanted double quotes to straight
                return item;
            });

            if (options.shuffle) array = shuffleArray(array, options.alwaysMoveFirst);

            return array;
        }
        tools.trimAllElements = trimAllElements;





        // adds an item to an array IF it isn't there already
        function pushUnique(item, array) {
            if (arguments.length !== 2 || !Array.isArray(array)) return log("Bad arguments!");
            array.indexOf(item) === -1 && array.push(item);
            return true;
        }
        tools.pushUnique = pushUnique;




        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *
         *      "turn (to the) left"        --> ["turn left, turn to the left"]
         *      "(an) apple"                --> ["apple", "an apple"]
         *      "[one's, your] left"        --> ["one's left", "your left"] NOTE separated by comma, not slash!
         *
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function getCandidateAnswers(string, divider = "/") {

            string = removeExtraWhiteSpace(string);

            let candidatesArray = string.split(divider).map(answer => removeExtraWhiteSpace(answer));

            // adding scrubbed versions to the array
            candidatesArray.forEach(answer => {

                answer = scrubString(answer);
                pushUnique(answer, candidatesArray);

                // adding versions WITH optional bits, and without
                const withoutOptional = answer.replace(/\(.*?[^\)]\)/g, "");
                const withOptional = answer.replace(/\(|\)/g, "");
                const withoutDashes = answer.replace(/-/g, " "); // replacing dashes with SPACES
                pushUnique(withoutOptional, candidatesArray);
                pushUnique(withOptional, candidatesArray);
                pushUnique(withoutDashes, candidatesArray);

                // "lose [one's, your, my] way" --> ["lose one's way", "lose your way", "lose my way"]
                if (answer.indexOf("[") !== -1 && answer.indexOf("]") !== -1) {
                    const alternates = answer.split("[")[1].split("]")[0].split(",").map(word => word.trim());
                    alternates.forEach(alternate => {
                        const newString = answer.replace(/\[.[^\]]{0,}\]/, alternate); // any text between square brackets
                        pushUnique(newString, candidatesArray);
                    });
                }
            });

            candidatesArray = candidatesArray.map(item => removeExtraWhiteSpace(item));

            return candidatesArray;
        }
        tools.getCandidateAnswers = getCandidateAnswers;




        function getIdealAnswer(string) {
            return removeParenthetical(getCandidateAnswers(string)[0]).trim();
        }
        tools.getIdealAnswer = getIdealAnswer;





        // limiting to alphanumeric, spaces, (), [], and select punctuation
        function scrubString(text) {
            return text.replace(/[^\w\s\(\)\[\]\/',_-]/gi, "");
        }
        tools.scrubString = scrubString;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      Stripping any text between (parentheses) or [brackets] from a string,
         *      and returning the first letter
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function getFirstRealLetter(string) {
            string = string.replace(/\(.[^\)]*\)/g, ""); // removing anything in ( ) - same as "removeParenthetical" below
            string = string.replace(/\[.[^\]]*\]/g, ""); // removing anything in [ ]
            string = removeExtraWhiteSpace(string);
            return string.charAt(0);
        }
        tools.getFirstRealLetter = getFirstRealLetter;







        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      Removes any text between parentheses, and any spaces after
         *
         *      "(the) United States (of America)" --> "United States"
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function removeParenthetical(string) {
            string = string.replace(/\([^\(\)]*\)/gi, ""); // removing anything in parentheses
            string = string.replace(/\[[^\[\]]*\]/gi, ""); // removing anything in square brackets
            string = string.replace(/<[^<>]*>/gi, ""); // removing anything in angle brackets
            return string;
        }
        tools.removeParenthetical = removeParenthetical;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      Takes an array and returns a shuffled version of it
         *
         *      ALWAYS returns a differently ordered version
         *      UNLESS there are only two elements, in which case it
         *      MAY return an identical version
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function shuffleArray(originalArray) {

            if (!Array.isArray(originalArray)) return log("shuffleArray requires an array!");

            let arrayCopy = originalArray.concat(); // cloning the array
            let shuffledArray = [];
            while (arrayCopy.length > 0) shuffledArray.push(pickOneFrom(arrayCopy, true)); // true => delete that element

            // ensuring that arrays of length 3+ are changed
            if (shuffledArray.length >= 3) {
                while (arraysAreIdentical(shuffledArray, originalArray)) shuffledArray = shuffleArray(originalArray);
            }

            return shuffledArray;
        }
        tools.shuffle = shuffleArray;





        // gets the x & y coordinates of mouse click or touch, relative to any offset parent
        function pointerPosition(event, offsetParent) {

            const offsetLeft = offsetParent ? offsetParent.offset().left : 0;
            const offsetTop = offsetParent ? offsetParent.offset().top : 0;

            let x, y;

            // calculating position, for either touch or click
            if (event.type === "touchstart" || event.type === "touchend") {
                const touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
                x = touch.pageX - offsetLeft;
                y = touch.pageY - offsetTop;
            } else {
                x = event.pageX - offsetLeft;
                y = event.pageY - offsetTop;
            }

            return { x, y, };
        }
        tools.pointerPosition = pointerPosition;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      Picks a random index (integer) from an array,
         *
         *      or else a random int, 0 <= int < some given number
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function pickIntFrom(arrayOrNumber) {

            if (!arrayOrNumber || !(Array.isArray(arrayOrNumber) || !isNaN(arrayOrNumber))) {
                return log("pickIntFrom requires an array or a number as a parameter!");
            }

            if (Array.isArray(arrayOrNumber)) {
                return Math.floor(Math.random() * arrayOrNumber.length);
            }

            return Math.floor(Math.random() * arrayOrNumber);
        }
        tools.pickIntFrom = pickIntFrom;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *
         *      Returns a random ELEMENT from an array (not just the index integer),
         *
         *      and deletes that element, optionally
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function pickOneFrom(array, deleteChosenItem) {

            if (!array || !Array.isArray(array) || array.length < 1) {
                return log("tools.pickOneFrom requires an array!");
            }

            const index = pickIntFrom(array);
            const item = array[index];

            if (deleteChosenItem) array.splice(index, 1);

            return item;
        }
        tools.pickOneFrom = pickOneFrom;





        function removeOneFrom(array) {
            return pickOneFrom(array, true);
        }
        tools.removeOneFrom = removeOneFrom;





        function elementOnScreen($element, callback, obj = null) {

            if (!$element || !callback) return false;

            $element = tools.forceJQuery($element);

            // wiring up the scroll listener, and triggering once
            $(window).off("scroll", scrollHandler).on("scroll", scrollHandler).trigger("scroll");

            function scrollHandler() {
                const elementTop = $element.offset().top;
                const screenBottom = $(window).scrollTop() + $(window).height();
                if (elementTop > screenBottom || $element.is(":hidden")) return;
                $(window).off("scroll", scrollHandler);
                callback();
            }

            function activate() {
                $(window).off("scroll", scrollHandler).on("scroll", scrollHandler);
            }

            return {
                activate
            };
        }
        tools.elementOnScreen = elementOnScreen;



        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      Simply returns whether an element is on screen, vertically
         *      NOTE doesn't check left and right
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function elementIsOnScreen($element) {

            const elementTop = $element.offset().top;
            const elementBottom = $element.offset().bottom;
            const screenTop = $(window).scrollTop();
            const screenBottom = $(window).scrollTop() + $(window).height();

            return !(elementTop > screenBottom || elementBottom < screenTop);
        }
        tools.elementIsOnScreen = elementIsOnScreen;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      Checks whether arrays contain the same elements, though not necessarily in the
         *
         *      same order.  NOTE that this is different than "arraysAreIdentical" below.
         *
         *      Does NOT work on nested arrays!
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function arraysContainSameElements(a1, a2) {
            if (!Array.isArray(a1) || !Array.isArray(a2) || a1.length !== a2.length) return false;
            const intersection = a1.filter(element => a2.indexOf(element) !== -1);
            return intersection.length === a1.length;
        }
        tools.arraysContainSameElements = arraysContainSameElements;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      Checks whether arrays are identical - same elements in the same order
         *
         *      Also checks for nested arrays (useful?) but DOES NOT WORK with nested objects!
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function arraysAreIdentical(a1, a2) {

            if (!Array.isArray(a1) || !Array.isArray(a2) || a1.length !== a2.length) return false;

            for (let i = 0; i < a1.length; i++) {
                if (Array.isArray(a1[i])) {
                    if (!arraysAreIdentical(a1[i], a2[i])) return false;
                } else if (a1[i] !== a2[i]) {
                    return false;
                }
            }

            return true;
        }
        tools.arraysAreIdentical = arraysAreIdentical;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      Tries to parse a string into JSON, and
         *      returns an empty object if it fails
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function safeParseJSON(string) {
            try {
                return JSON.parse(string) || {};
            } catch (err) {
                return {};
            }
        }
        tools.safeParseJSON = safeParseJSON;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *
         *      Takes a string with words surrounded by * (astrixes) and replaces those * with
         *      other strings, such as span tags
         *
         *      NOTE that the opening and closing replacement string may be different
         *
         *      Usage:
         *      replaceStars("This is *bold*", "<b>", "</b>");  -->   "This is <b>bold</b>"
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function replaceStars(string, before, after = null) {

            if (arguments.length < 2 || arguments.length > 3) return;

            after = after || before; // if after is null, setting it to same as the "before" element

            // returning the string unchanged if there are no stars
            if (string.indexOf("*") === -1) return string;

            // exiting if stars are not of an even number
            if (string.match(/\*/g).length % 2 !== 0) {
                return log("Odd number of stars!");
            }

            return string.replace(/\*(.[^\*]{0,})\*/g, before + "$1" + after);
        }
        tools.replaceStars = replaceStars;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *
         *      In a text input (or textarea), toggles square brackets around selected text
         *      (inserts them if not present, removes them if they are)
         *
         *      Usage: "Shift + Ctrl + [" (opening square backet)
         *
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function toggleBrackets($input, e, p = {}) {

            const keyCode = p.which || 219; // opening square bracket
            const openingCharacter = p.openingCharacter || "[";
            const closingCharacter = p.closingCharacter || "]";
            const oldVal = $input.val();

            if (e.which !== keyCode || !e.ctrlKey || !e.shiftKey) return;

            // auto-selecting the current word, if nothing is selected
            selectWholeWord($input);

            const start = $input.prop("selectionStart"); // COOL! getting the start and end of an input's selected area
            const end = $input.prop("selectionEnd");
            const alreadySurrounded = oldVal.substring(start - 1, start) === openingCharacter && oldVal.substring(end, end + 1 === closingCharacter);

            let newVal;
            if (!alreadySurrounded) {
                newVal = oldVal.substring(0, start) + openingCharacter + oldVal.substring(start, end) + closingCharacter + oldVal.substring(end, oldVal.length);
            } else {
                newVal = oldVal.substring(0, start - 1) + oldVal.substring(start, end) + oldVal.substring(end + 1, oldVal.length);
            }
            $input.val(newVal);

            // re-selecting the selected test, just for good measure
            const adjustment = alreadySurrounded ? -1 : 1; // moving the selected area by 1, depending
            $input.prop({ selectionStart: start + adjustment, selectionEnd: end + adjustment }).change();
        }
        tools.toggleBrackets = toggleBrackets;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *
         *      In a text input, selects the whole word (if nothing is otherwise selected)
         *
         *      or whole words, if words are partially selected
         *
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function selectWholeWord($input) {

            const string = $input.val();

            let start = $input.prop("selectionStart");
            let end = $input.prop("selectionEnd");

            while (string.charAt(start - 1).match(/\w\b/) && start >= 0) start--;
            while (string.charAt(end).match(/\w\b/) && end < string.length) end++;

            $input.prop({ selectionStart: start, selectionEnd: end });
        }






        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *
         *      In a text input (or textarea), replaces the next space (based on the insertion point)
         *      with an underscore.
         *
         *      Usage: Shift + Ctrl + "u"    (NOTE: can't use "_" 'cause that doubles as "-" minus on Windows - fuck!)
         *
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function toggleUnderscores($input, e, p = {}) {

            const keyCode = p.which || 85; // 85 = "u" for "underscore"

            if (e.which !== keyCode || !e.ctrlKey || !e.shiftKey) return;

            e.preventDefault();

            const string = $input.val();
            const selectionStart = $input.prop("selectionStart");
            const selectionEnd = $input.prop("selectionEnd");
            const p1 = string.substring(0, selectionStart);
            const p2 = string.substring(selectionEnd, string.length).replace(/\s/, "_"); // only the first space, 'cause no global "g" flag

            $input.val(p1 + p2).prop({ selectionStart: selectionStart, selectionEnd: selectionStart }).change();
        }
        tools.toggleUnderscores = toggleUnderscores;





        // keeps track of user info (name, grade, etc.) in sessionStorage
        tools.userInfo = tools.objectLocalStorage("user_info");





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      Abstracting away the tediousness of making something fullscreen
         *
         *      NOTE some browsers don't use promises, so we can't use: elem.requestFullscreen().then()
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function requestFullscreen($elem, obj = {}) {
            const elem = ($elem instanceof $) ? $elem[0] : $elem; // extracting the raw HTML if it's jQuery
            elem.requestFullscreen = elem.webkitRequestFullscreen || elem.msRequestFullscreen || elem.requestFullscreen;
            try {
                elem.requestFullscreen();
                obj.onFullscreen && obj.onFullscreen();
                return true;
            } catch (err) {
                obj.onError && obj.onError(err);
                return false;
            }
        }
        tools.requestFullscreen = requestFullscreen;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      Handles the ".my-template" stuff, detaching and returning
         *      an element that can be cloned many times
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function makeTemplate($element, obj = {}) {

            $element = forceJQuery($element);
            const classToRemove = obj.klass || "my-template";

            $element.removeClass(classToRemove);
            $element.detach();

            return $element;
        }
        tools.makeTemplate = makeTemplate;




        /*
         *      UNDER CONSTRUCTION!!
         *
         */
        // function sentenceWithDummyWords(string) {
        //
        //     if (!string || typeof string !== "string") {
        //         console.log("sentenceWithDummyWords needs a string");
        //         return false;
        //     }
        //
        //     if (string.includes("¥") && string.includes("[")) {
        //         console.log("Either a ¥ *OR* square brackets, butthead!");
        //         return false;
        //     }
        //
        //     let divider = string.includes("¥") ? "¥" : "[";
        //
        //     let twoArrays = string.split(divider);
        //
        //
        //     return {
        //         //
        //     };
        // }
        // tools.sentenceWithDummyWords = sentenceWithDummyWords;




        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      the dateTime of the pageLoad, so we only get chats
         *        that showed up AFTER the page was loaded
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        const getPageLoadDateTime = (function () {

            const pageLoadTime = (new Date()).getTime();

            return function () {
                return (new Date(pageLoadTime));
            };
        }());
        tools.pageLoadDateTime = getPageLoadDateTime;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      Shortcut for creating a range
         *      NOTE that the loop returns THROUGH the end value
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function range(startValue, throughValue) {
            if (arguments.length !== 2) {
                return console.log("tools.range takes two arguments, a startValue and a throughValue!");
            }
            let array = [];
            for (let i = startValue; i <= throughValue; i++) array.push(i);
            return array;
        }
        tools.range = range;





        /*
         *
         *      Gets the index of the first element in an array that meets
         *      some condition, as defined by a testIsTrueFor function
         *
         *
         */
        function getIndexOfElementInArray(array, testIsTrueFor) {
            for (let i = 0; i < array.length; i++) {
                if (testIsTrueFor(array[i])) return i;
            }
            return -1;
        }
        tools.getIndexOfElementInArray = getIndexOfElementInArray;





        /*
         *
         *      Removes the first element in an array that meets
         *      some condition, as defined by a testFunction
         *
         *
         */
        function removeElement(array, testFunction) {
            const index = getIndexOfElementInArray(array, testFunction);
            array.splice(index, 1);
        }
        tools.removeElement = removeElement;





        /*
         *
         *      Calculates the number of rows and columns for a grid of objects, e.g.
         *
         *      4 objects => 2x2
         *      5 objects => 3x2
         *      6 objects => 3x2
         *      7 objects => 3x3
         *      8 objects => 3x3
         *      ...
         *      15 objects => 5x5
         *
         *
         */
        // function calculateGrid(numItems) {
        //
        //     const squareRouteRoundedUp = Math.ceil(Math.sqrt(numItems));
        //     const numRows = squareRouteRoundedUp;
        //
        //     let numColumns = squareRouteRoundedUp;
        //
        //     if (numRows * (numColumns - 1) >= numItems) {
        //         numColumns--;
        //     }
        //
        //     return { numRows, numColumns };
        // }
        // tools.calculateGrid = calculateGrid;





        /*
         *
         *      converts MySQL timestamp to a readable format, e.g.
         *
         *      2018-04-06 13.15.06 -> Mar 06, 2018
         *
         */
        const readableDate = (function () {

            const months = ["Jan", "Feb", "March", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            return function (timestamp) {

                const yearMonthDate = timestamp.split(" ")[0].split("-");
                const year = yearMonthDate[0];
                const month = months[parseInt(yearMonthDate[1]) - 1];
                const date = yearMonthDate[2];

                return month + " " + date + ", " + year;
            };
        }());
        tools.readableDate = readableDate;





        function promptStringWithTrim(obj = {}) {

            obj = $.extend({
                label: "",
                placeholder: "default",
                minLength: 2
            }, obj);

            let inputString = prompt(obj.label, obj.placeholder);
            if (!inputString || inputString <= obj.minLength) return;
            inputString = inputString.trim();
            if (!inputString || inputString <= obj.minLength) return;

            return inputString;
        }
        tools.promptStringWithTrim = promptStringWithTrim;





        function getSelectOptionWidth($select) {

            const fontSize = $select.css("font-size");
            const fontFamily = $select.css("font-family");
            const fontWeight = $select.css("font-weight");
            const text = $select.find("option:selected").text();

            const $span = $("<span></span>").text(text).css({
                visibility: "hidden",
                position: "fixed",
                top: "100%",
                fontSize: fontSize,
                fontFamily: fontFamily,
                fontWeight: fontWeight
            }).appendTo("html");

            const width = $span.outerWidth(true);
            $span.remove();

            return width;
        }
        tools.getSelectOptionWidth = getSelectOptionWidth;





        /*
         *
         *      Returns true if an element has class "this-input-is-momentarily-disabled";
         *      otherwise, adds that class and then removes it after some number of miliseconds
         *      (100 by default)
         *
         *      Used to temporarily disable an input - e.g., when "blur" and "sumbit"
         *      events call each other on an input, leading to stack overflow
         *
         *
         */
        const momentarilyDisable = (function () {

            const className = "this-input-is-momentarily-disabled";

            return function ($input, callback, obj = {}) {

                obj = $.extend({
                    delay: 100 //ms
                }, obj);

                if (!$input.hasClass(className)) {

                    $input.addClass(className);

                    setTimeout(function () {
                        $input.removeClass(className);
                    }, obj.delay);

                    callback();
                }
            };
        }());
        tools.momentarilyDisable = momentarilyDisable;





        const brackets = (function () {

            function areBalanced(str) {

                if (!str) return;

                let nextExpectedType = "["; // first must be opening bracket

                return str.split("").every(function (char) {
                    if (char === "[" || char === "]") {
                        if (char !== nextExpectedType) return false;
                        nextExpectedType = (nextExpectedType === "[") ? "]" : "[";
                    }
                    return true;
                });
            }


            function sameNumber(str) {
                if (!str) return;
                const num = numberOfBrackets(str);
                if (num[0] === num[1]) return true;
                return false;
            }


            function numberOfBrackets(string) {
                const numOpeningBrackers = (string.match(/\[/gi) || []).length;
                const numClosingBrackets = (string.match(/\]/gi) || []).length;
                return [numOpeningBrackers, numClosingBrackets];
            }


            function noBrackets(string) {
                const num = numberOfBrackets(string);
                return (num[0] === 0) && (num[1] === 0);
            }


            function areBrackets(str) {
                return !noBrackets(str);
            }


            function areBalancedAndSameNumber(str) {
                return areBalanced(str) && sameNumber(str); // && areBrackets(str);
            }


            function notBalanced(s) {
                return !areBalanced(s);
            }


            function notSameNumber(s) {
                return !sameNumber(s);
            }


            function notBalancedAndSame(s) {
                return !areBalancedAndSameNumber(s);
            }


            return {
                areBalanced,
                sameNumber,
                areBalancedAndSameNumber,
                notBalanced,
                notSameNumber,
                notBalancedAndSame,
                numberOfBrackets,
                noBrackets,
            };
        }());
        tools.brackets = brackets;




        /*
         *      Takes one argument and returns that "array version" of that item
         *
         *      This is so we can use Array.forEach, even when
         *
         */
        function forceArray(item = []) {
            return Array.isArray(item) ? item : [item];
        }
        tools.forceArray = forceArray;





        const currentlyPressedKeys = (function () {


            /*
             *
             *       Keeps track of which keys are currently pressed
             *
             *
             */


            let keysDown = {};


            // adding or removing keyCodes from the keysDown object
            // whenever a key is pressed or released
            $(window).on("keyup keydown", function (e) {
                e.type === "keydown" ? keysDown[e.which] = true : delete keysDown[e.which];
            });


            function getAll() {
                return keysDown;
            }


            function getArray() {
                return Object.keys(keysDown);
            }


            function isPressed(keyCode) {
                return forceArray(keyCode).some(function (thisKeycode) {
                    return keysDown.hasOwnProperty(thisKeycode);
                });
            }


            function allArePressed(keyCodes) {
                return forceArray(keyCodes).every(function (thisKeycode) {
                    return keysDown.hasOwnProperty(thisKeycode);
                });
            }


            function numPressed() {
                return getArray().length;
            }


            return {
                getAll,
                getArray,
                isPressed,
                numPressed,
                allArePressed,
            };
        }());
        tools.currentlyPressedKeys = currentlyPressedKeys;
        tools.numKeysPressed = currentlyPressedKeys.numPressed;
        tools.keyIsPressed = currentlyPressedKeys.isPressed;
        tools.keysAreAllPressed = currentlyPressedKeys.allArePressed;





        // returns True if ANY arrow keys are pressed
        function anyArrowKeysPressed() {
            return currentlyPressedKeys.isPressed([37, 38, 39, 40]);
        }
        tools.anyArrowKeysPressed = anyArrowKeysPressed;





        // returns True if NO arrow keys are pressed
        function noArrowKeysPressed() {
            return !anyArrowKeysPressed();
        }
        tools.noArrowKeysPressed = noArrowKeysPressed;





        // returns an array of all the currently pressed arrow keys
        function currentlyPressedArrowKeys() {
            let array = [];
            [37, 38, 39, 40].forEach(function (thisKey) {
                currentlyPressedKeys.isPressed(thisKey) && array.push();
            });
            return array;
        }
        tools.currentlyPressedArrowKeys = currentlyPressedArrowKeys;





        // matches keydown (and keyup) events with callback functions
        const keyevent = (function () {

            let anyKeyUpFunctions = [];
            let bindings = {
                keydown: {}, // e.g. {"37": someFunc}
                keyup: {}
            };

            let anyKeyDownFunctions = [];

            function anyKeyDown(func) {
                anyKeyDownFunctions.push(func);
            }

            function anyKeyUp(func) {
                anyKeyUpFunctions.push(func);
            }

            $(window).on("keydown keyup", function (e) {

                // first, calling functions that are linked to ANY keydown or keyup
                const funcs = (e.type === "keydown") ? anyKeyDownFunctions : anyKeyUpFunctions;
                funcs.forEach(thisFunc => thisFunc(e));

                e.which = e.which || e.keyCode;
                if (!e.which) return;

                const keyCode = e.which.toString(); // 'cause the numbers are object keys, which are string
                const eventType = e.type; // keydown or keyup

                // calling the associated function, if any
                if (bindings[eventType][keyCode]) {

                    e.preventDefault();
                    bindings[eventType][keyCode].callback(e);

                    // deleting the binding after it's used, if the "callOnce" property is true
                    if (bindings[eventType][keyCode] && bindings[eventType][keyCode].callOnce) {
                        delete bindings[eventType][keyCode];
                    }
                }
            });


            function bindKeyEvent(p) {

                if (!p || typeof p !== "object" ||
                    !p.keys ||
                    !p.onOrOff ||
                    !(p.onOrOff === "on" || p.onOrOff === "off") ||
                    (isNaN(p.keys) && !Array.isArray(p.keys)) ||
                    (p.callback && typeof p.callback !== "function") ||
                    !p.event ||
                    !(p.event === "keydown" || p.event === "keyup")) {
                    log("bindKeyEvent got some bad arguments!");
                    return false;
                }

                const e = p.event;
                const keys = p.keys;

                forceArray(keys).forEach(function (thisKey) {
                    thisKey = thisKey.toString(); // 'cause it's a key in an object
                    if (p.onOrOff === "on") {
                        bindings[e][thisKey] = {
                            callback: p.callback,
                            callOnce: !!p.callOnce
                        };
                    } else {
                        delete bindings[e][thisKey];
                    }
                });

                return keyevent;
            }


            function keydown(keys, callback, callOnce) {
                return bindKeyEvent({
                    keys: keys,
                    callback: callback,
                    callOnce: callOnce,
                    onOrOff: "on",
                    event: "keydown"
                });
            }


            function keyup(keys, callback, callOnce) {
                return bindKeyEvent({
                    keys: keys,
                    callback: callback,
                    callOnce: callOnce,
                    onOrOff: "on",
                    event: "keyup"
                });
            }


            function keydownOnce(keys, callback) {
                return bindKeyEvent({
                    keys: keys,
                    callback: callback,
                    onOrOff: "on",
                    callOnce: true,
                    event: "keydown"
                });
            }


            function keyupOnce(keys, callback) {
                return bindKeyEvent({
                    keys: keys,
                    callback: callback,
                    onOrOff: "on",
                    callOnce: true,
                    event: "keyup"
                });
            }


            function keydownOff(keys) {
                return bindKeyEvent({
                    keys: keys,
                    onOrOff: "off",
                    event: "keydown"
                });
            }


            function keyupOff(keys) {
                return bindKeyEvent({
                    keys: keys,
                    onOrOff: "off",
                    event: "keyup"
                });
            }


            function hasKeydownEvent(key) {
                return !!bindings.keydown[key];
            }


            function hasKeyupEvent(key) {
                return !!bindings.keyup[key];
            }


            function hasSomeEvent(key) {
                return !!(hasKeydownEvent(key) || hasKeyupEvent(key));
            }


            function clearAll(event) {
                if (event) {
                    bindings[event] = {};
                } else {
                    bindings.keydown = {};
                    bindings.keyup = {};
                }
            }


            // returning "on" or "off" functionality
            return {
                keydown,
                keyup,
                keydownOnce,
                keydownOff,
                keyupOff,
                hasKeydownEvent,
                hasKeyupEvent,
                clearAll,
                hasSomeEvent,
                anyKeyDown,
                anyKeyUp,
            };
        }());
        tools.keydown = keyevent.keydown;
        tools.keydownOnce = keyevent.keydownOnce;
        tools.keydownOff = keyevent.keydownOff;
        tools.keyup = keyevent.keyup;
        tools.keyupOnce = keyevent.keyupOnce;
        tools.keyupOff = keyevent.keyupOff;
        tools.hasKeydownEvent = keyevent.hasKeydownEvent;
        tools.hasKeyupEvent = keyevent.hasKeyupEvent;
        tools.clearKeyEvents = keyevent.clearAll;
        tools.hasSomeEvent = keyevent.hasSomeEvent;
        tools.anyKeyDown = keyevent.anyKeyDown;
        tools.anyKeyUp = keyevent.anyKeyUp;




        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *
         *      Listens for any user interaction with the device, and calls a callback
         *
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        const onUserInteraction = (function () {


            // NOTE removed "keydown" from the events list, 'cause it's easily spoofed by simply
            // holding down any key (thanks, Kyota!) and anyway "keyup" is sufficient.
            // Also erased "mousedown" 'cause it can probably be spoofed too
            let eventsToListenFor = "scroll mouseup mousemove DOMMouseScroll mousewheel touchmove touchend";


            // adding keyup listeners ONLY for desktop; this is because other
            // plugins (e.g. "tiltSimulatesArrowKeys") may simulate keypresses
            // on mobile, even though there's no actual keyboard
            if (!tools.isMobile()) { eventsToListenFor += " keyup"; }


            return function (callback) {


                if (!callback || typeof callback !== "function") {
                    log("onUserIntraction requires a callback function!");
                    return false;
                }


                // activating by default
                activate();


                function activate() {
                    $(window).on(eventsToListenFor, callback);
                }


                function deactivate() {
                    $(window).off(eventsToListenFor, callback);
                }


                return {
                    deactivate,
                    activate,
                };
            };
        }());
        tools.onUserInteraction = onUserInteraction;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      Returns the first several items from an array, e.g.,
         *      items [0 ~ 4] of an array of ten items
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function getFirstFromArray(number, array) {


            if (!array || !number ||
                !Array.isArray(array) ||
                isNaN(number) ||
                number < 1 ||
                number > array.length) {
                log("Got some bad parameters!");
                return false;
            }


            return array.slice(0, number);
        }
        tools.getFirstFromArray = getFirstFromArray;





        /*
         *
         *
         *      returns TRUE if any element is repeated in the array, otherwise FALSE
         *
         *
         */
        function arrayContainsDuplicates(array) {


            var previousItems = [];


            return array.some(function (thisElement) {
                if (previousItems.indexOf(thisElement) !== -1) return true;
                previousItems.push(thisElement);
            });
        }
        tools.arrayContainsDuplicates = arrayContainsDuplicates;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      returns TRUE if an array contains no duplicates
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function arrayAllUnique(array) {
            return !arrayContainsDuplicates(array);
        }
        tools.arrayAllUnique = arrayAllUnique;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      Checks whether two objects (or arrays, which are objects) are identical
         *
         *      Returns "identical", "different", or FALSE if they're not comparable
         *
         *      NOTE this works for objects (or arrays) with values of primitive
         *      types, but not for functions with constructors, etc.
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function objectsAreIdentical(a1, a2) {


            if (arguments.length !== 2) return;


            // checking that they're both objects, or both arrays, and that
            // their lengths are the same,
            if (typeof a1 !== "object" ||
                typeof a2 !== "object" ||
                typeof a1 === "function" ||
                typeof a2 === "function" ||
                Array.isArray(a1) !== Array.isArray(a2) ||
                Object.keys(a1).length !== Object.keys(a2).length) {
                return false;
            }


            // returning false if ANY members are not identical
            const areIdentical = Object.keys(a1).every(function (thisKey) {


                if (!(thisKey in a2)) return;


                // recursion!
                if (typeof a1[thisKey] === "object" || typeof a2[thisKey] === "object") {
                    return objectsAreIdentical(a1[thisKey], a2[thisKey]);
                }


                // simply comparing elements
                return a1[thisKey] === a2[thisKey];
            });


            return areIdentical ? "identical" : "different";
        }
        tools.objectsAreIdentical = objectsAreIdentical;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      Removes angle brackets and anything between them
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function removeSSMLTags(string) {
            return string.replace(/<.*?>/g, "");
        }
        tools.removeSSMLTags = removeSSMLTags;





        function isJapanese(string) {
            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
             *
             *
             *      Returns TRUE if ANY characters in the string are Japanese
             *
             *      Codes mean:
             *
             *          3000 - 303f:    Japanese-style punctuation
             *          3040 - 309f:    Hiragana
             *          30a0 - 30ff:    Katakana
             *          ff00 - ff9f:    Full-width Roman characters and half-width Katakana
             *          4e00 - 9faf:    CJK unified ideographs - Common and uncommon Kanji
             *          3400 - 4dbf:    CJK unified ideographs Extension A - Rare Kanji
             *
             *
             * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
            return !!string.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/);
        }
        tools.isJapanese = isJapanese;





        function isEnglish(string) {
            return !isJapanese(string);
        }
        tools.isEnglish = isEnglish;





        function countLanguageShifts(str) {


            const letters = str.split("");
            if (!letters) return log("Didn't get any text to process!");


            return letters.filter((currentLetter, index) => {
                const precedingLetter = letters[index - 1] ?? currentLetter;
                return areDifferentLanguages(currentLetter, precedingLetter);
            }).length;
        }
        tools.countLanguageShifts = countLanguageShifts;





        const areDifferentLanguages = (t1, t2) => isJapanese(t1) !== isJapanese(t2);
        tools.areDifferentLanguages = areDifferentLanguages;





        function getIndexOfShift(t) {
            const letters = t.split("");
            for (let i = 0; i < letters.length; i++) {
                const currentLetter = letters[i];
                const precedingLetter = letters[i - 1] ?? currentLetter;
                if (isJapanese(currentLetter) !== isJapanese(precedingLetter)) return i;
            }
        }
        tools.getIndexOfShift = getIndexOfShift;





        function splitAtLanguageShift(t) {


            const index = getIndexOfShift(t);
            const first = t.substr(0, index).trim();
            const second = t.substr(index, t.length - index).trim();


            return {
                english: !isJapanese(first) ? first : second,
                japanese: isJapanese(first) ? first : second,
            };
        }
        tools.splitAtLanguageShift = splitAtLanguageShift;










        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      Checks that a string has no forward slashes, while allowing "</", used in SSML tags
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function isSpeakable(text) {
            return !text.match(/[^<]\/]/g);
        }
        tools.isSpeakable = isSpeakable;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      Takes a string with underscores, brackets, etc., and returns a scrubbed version,
         *      with underscores removed, dummy words at end removed, and with the first word
         *      in bracketed text extracted. Like this...
         *
         *
         *      From:       "There_is (only) [one, two] thing_to_do! [dummy words]"
         *      To:         "There is one thing to do!"
         *
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function scrubForVoiceSynthesis(string) {


            if (!tools.isEnglish(string)) return;


            string = string.replace(/_/g, " "); // removing underscores
            string = string.replace(/\(.+?\)/g, ""); // removing anything in parentheses
            string = string.replace(/\[.[^\[]*\]$/, ""); // removing any bracketed content at end of string
            string = string.replace(/\[(.+?)(,.*?)*\]/g, "$1"); // extracting first word from words in brackets, separated by commas
            string = string.replace(/\s{2,}/g, " ").trim(); // removing multiple spaces


            return string;
        }
        tools.scrubForVoiceSynthesis = scrubForVoiceSynthesis;





        function chances(fraction) {
            if (!fraction || isNaN(fraction) || fraction >= 1 || fraction <= 0) {
                return log("chances requires a fraction (or decimal number) between 0 and 1!");
            }
            return Math.random() < fraction;
        }
        tools.chances = chances;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      Uses the "chances" function above to return true 50% of the time
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function coinToss() {
            return chances(1 / 2);
        }
        tools.coinToss = coinToss;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      Tests for deviceorientation, and executes a callback if it isn't supported.
         *
         *      Mostly this is for iOS Safari, which is being stupid.
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        // function ifNoTiltSupport(callback) {
        //     if (tools.isMobile()) {
        //         let timeout = setTimeout(callback, 1000);
        //         window.addEventListener("deviceorientation", (e) => clearTimeout(timeout));
        //     }
        // }
        // tools.ifNoTiltSupport = ifNoTiltSupport;





        function jqueryuiModal(obj) {


            if (!obj || typeof obj !== "object" || !obj.title || !obj.body) {
                return console.log("jqueryuiModal requires an object with properties 'title' and 'body'!");
            }


            obj.buttons = forceArray(obj.buttons);
            const modalID = "jquery-ui-modal";


            $(`<div id='${modalID}' title='${obj.title}'></div>`).appendTo("body");
            $(`<p>${obj.body}</p>`).appendTo($(`#${modalID}`));


            $("#jquery-ui-modal").dialog({
                buttons: obj.buttons ? obj.buttons : null
            });
        }
        tools.jqueryuiModal = jqueryuiModal;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *
         *      Wiring up any body touchend event to trigger permission for orentation change
         *
         *      NOTE that this only activates the permission dialog; it does not wire up any listeners,
         *      though it does call a callback
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function activateTiltDetection(obj = {}) {

            const onDesktop = obj.onDesktop || function () { };
            const onSuccess = obj.onSuccess || function () { };
            const onFail = obj.onFail || function () { };

            if (!tools.isMobile()) return onDesktop();

            $("body").on("touchend", getTiltPermission);

            function getTiltPermission() {
                $("body").off("touchend", getTiltPermission);
                DeviceMotionEvent.requestPermission().then(function (response) {
                    if (response === "granted") onSuccess();
                }).catch(function (e) {
                    onFail();
                    log("Failed!");
                    log.error(e);
                });
            }
        }
        tools.activateTiltDetection = activateTiltDetection;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      Returns an object with properties x and y, that are constantly updated
         *
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        function DeviceTiltDetector(params) {

            params = $.extend({
                maxTilt: 10 // higher == less sensitive
            }, params || {});

            const maxTilt = params.maxTilt;
            this.maxTilt = maxTilt;

            // returning null properties if not mobile
            if (!window.hasOwnProperty("orientation")) {
                this.x = null;
                this.y = null;
                this.maxTilt = null;
                return true;
            }

            // saving tilt info every time the device moves
            registerNewTilt = event => {
                const tilt = getTilt(event);
                this.x = Math.max(Math.min(tilt.x, maxTilt), -maxTilt); // left-to-right
                this.y = Math.max(Math.min(tilt.y, maxTilt), -maxTilt); // back-to-front
            };

            // saving tilt info every time the device moves
            // NOTE adding this "requestPermission" bullshit
            DeviceMotionEvent.requestPermission().then(function (response) {
                response === "granted" && window.addEventListener("deviceorientation", registerNewTilt);
            }).catch(function (e) {
                console.error(e);
            });

            $(window).trigger("orientationchange");
        }
        tools.DeviceTiltDetector = DeviceTiltDetector;




        // swapping x, y in portrait / landscape mode
        function getTilt(event) {
            const directions = {
                "0": { x: event.gamma, y: event.beta },
                "180": { x: -event.gamma, y: -event.beta }, // NEW 'cause some tables support this now!
                "90": { x: event.beta, y: -event.gamma },
                "-90": { x: -event.beta, y: event.gamma },
            };
            return directions[window.orientation];
        }
        tools.getTilt = getTilt;



        function pauser(p) {

            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
             *
             *
             *      Takes an array of keyCodes (e.g. [80] == p) and
             *      toggles a variable ("isPaused") on keyDown
             *
             *      NEW:
             *      Also takes a button or checkbox
             *
             *      NEW:
             *      Added methods "disable", "enable", and "destroy"
             *
             *
             *
             * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


            if (!p || typeof p !== "object") {
                return log("tools.pauser got some bad parameters!");
            }


            const settings = $.extend({
                keyCodes: [80], // the 'p' key **  NOTE this can be a single number, or an array of numbers
                startValue: false, // false == not paused
                element: null, // a jQuery element, such as button or checkbox
                pausedClass: null, // class to add to the element when paused
                resumedClass: null, // class to add to the element when not paused
                onPause: function () {
                    // do something on pause
                },
                onResume: function () {
                    // do something on pause
                }
            }, p || {});


            const $element = settings.element;
            const kCodes = forceArray(settings.keyCodes);

            let isPaused = settings.startValue; // false by default
            let pauserDisabled = false; // USE THIS to comletely disable the pauser


            keyevent.keydown(kCodes, togglePausedState);


            // wiring up the element, if specified (e.g. button or checkbox)
            // NOTE we're using the "click" event even on checkboxes, rather than the "change" method
            if ($element && $element instanceof jQuery) $element.click(togglePausedState);


            function togglePausedState() {
                if (pauserDisabled) return;
                isPaused = !isPaused;
                isPaused ? settings.onPause() : settings.onResume();
                $element && toggleElementState();
            }


            function toggleElementState() {
                $element.toggleClass(settings.pausedClass, !!(isPaused));
                $element.toggleClass(settings.resumedClass, !(isPaused));
                $element.is(":checkbox") && $element.prop("checked", isPaused ? true : false); // only affects checkboxes
            }


            function getPausedState() {
                return isPaused;
            }


            function disable() {
                pauserDisabled = true;
            }


            function enable() {
                pauserDisabled = false;
            }


            function destroy() {
                $element && $element.off("click", togglePausedState);
                keyevent.keydownOff(kCodes);
            }


            return {
                isPaused: getPausedState,
                togglePausedState: togglePausedState,
                disable: disable,
                enable: enable,
                destroy: destroy
            };
        }
        tools.pauser = pauser;





        function secondsToOtherFormats(timeInSeconds) {

            const seconds = timeInSeconds % 60;
            const minutes = Math.floor(timeInSeconds / 60 % 60);
            const hours = Math.floor(timeInSeconds / 3600);
            const totalMinutes = Math.floor(timeInSeconds / 60);

            return { seconds, minutes, hours, totalMinutes, timeInSeconds, };
        }
        tools.secondsToOtherFormats = secondsToOtherFormats;





        // converts seconds (not miliseconds!) to h:m.s format
        function secondsToHMS(time, obj = {}) {

            const settings = $.extend({
                hoursTag: "h ",
                minutesTag: "m ",
                secondsTag: "s",
                useHours: true,
                useMinutes: true,
                useSeconds: true,
                useLeadingZeroes: true,
                prefix: "",
                suffix: "",
            }, obj);

            time = secondsToOtherFormats(time);

            function addLeadingZero(number) {
                number = parseInt(number);
                if (number >= 0 && number <= 9) return "0" + number;
                return number.toString();
            }

            let hours = time.hours ?? "",
                minutes = time.minutes ?? "",
                seconds = time.seconds;

            // only adding leading 0's IF there's something to the LEFT
            if (settings.useLeadingZeroes) {
                if (time.hours) minutes = addLeadingZero(minutes);
                if (time.totalMinutes) seconds = addLeadingZero(seconds);
            }

            if (hours) hours += settings.hoursTag;
            if (minutes) minutes += settings.minutesTag;
            if (seconds) seconds += settings.secondsTag;

            return hours + minutes + seconds;
        }
        tools.secondsToHMS = secondsToHMS;





        const easer = (function () {

            return function (power, duration, type) {

                if (arguments.length !== 3 || isNaN(power) || isNaN(duration) || (type !== "easeIn" && type !== "easeOut")) {
                    return false;
                }

                const easingTypes = {
                    easeIn: function (t, d) {
                        d = d || duration;
                        return Math.pow((t / d), power);
                    },
                    easeOut: function (t, d) {
                        d = d || duration;
                        return 1 - Math.pow(1 - (t / d), power);
                    }
                };


                return easingTypes[type];
            };
        }());
        tools.easer = easer;





        function windowHasFocus() {
            return !document.hidden && document.hasFocus();
        }
        tools.windowHasFocus = windowHasFocus;





        function lightenElementsIncrementally(obj) {


            if (!obj || typeof obj !== "object" || !obj.elements || isNaN(obj.minOpacity)) {
                return log("lightenIncrementally received no params, or they're not right!");
            }


            let currentOpacity = obj.minOpacity;
            const lightnessIncrement = (1 - obj.minOpacity) / obj.elements.length;


            obj.elements.each(function () {
                $(this).css({ opacity: currentOpacity });
                currentOpacity += lightnessIncrement;
            });


            return true;
        }
        tools.lightenElementsIncrementally = lightenElementsIncrementally;





        function shrinkToFit($inner, $outer, options = {}) {


            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
             *
             *
             *      Shrinks the font-size of an INNER div until it fits entirely inside an
             *      OUTER div.
             *
             *      Ideal for text within cards.
             *
             *
             * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


            if (arguments.length < 2) {
                return console.warn("tools.shrinkToFit requires inner and outer jQuery elements!");
            }


            $inner = forceJQuery($inner);
            $outer = forceJQuery($outer);


            const upperLimit = options.tryCeiling || 20;
            const shrinkIncrement = options.shrinkIncrement || 2;


            const outerHeight = () => parseInt($outer.height());
            const innerHeight = () => parseInt($inner.height());
            const outerWidth = () => parseInt($outer.width());
            const innerWidth = () => parseInt($inner.width());


            // actually shrinking the font
            let counter = 0;
            while ((innerHeight() > outerHeight() || innerWidth() > outerWidth()) && counter < upperLimit) {
                counter++;
                const currentFontSize = parseInt($inner.css("font-size"));
                const newFontSize = currentFontSize - shrinkIncrement;
                $inner.css({ fontSize: newFontSize });
            }


            return $outer;
        }
        tools.shrinkToFit = shrinkToFit;






        function fadeAndReload(opacity = 0.3) {
            $("body").css({ opacity });
            window.location.reload();
        }
        tools.fadeAndReload = fadeAndReload;





        function doubleConfirm(text) {
            if (!window.confirm(text) || !window.confirm("** " + text + " **")) return false;
            return true;
        }
        tools.doubleConfirm = doubleConfirm;





        tools.page = {
            rememberScroll: function () {
                $(window).scroll(() => sessionStorage.scrollPosition = $("body").scrollTop());
            },
            restoreScroll: function () {
                $("body").scrollTop(sessionStorage.scrollPosition);
            }
        };





        function doAfterNoUserInteraction(object) {


            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
             *
             *
             *      object.callback = some function to call when user hasn't interacted for however long
             *
             *      object.interval (optional) = how many seconds to wait before calling the callback
             *
             *
             * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


            // param scrubbing
            if (!object || typeof object !== "object" || !object.callback || typeof object.callback !== "function") {
                return log("tools.beCheckingForUserInput requires an object passed in with a callback property, which must be a function!");
            }


            // defaults to 15 seconds
            object.interval = object.interval || 15;


            let checkInterval; // will hold a setTimeout
            let hasFinished = false;


            // on any user interaction, clearing any old intervals and starting a new one
            restartCheckInterval(); // starting once without user interaction
            function restartCheckInterval() {

                clearTimeout(checkInterval);

                checkInterval = setTimeout(function () {

                    if (hasFinished) return;

                    object.callback();
                    hasFinished = true;
                }, object.interval * 1000);
            }


            // adding all sorts of listeners for any sort of user input
            $("body, html").on("scroll mousedown mousemove DOMMouseScroll mousewheel keydown keyup touchstart touchmove touchend", restartCheckInterval);


            function cancel() {
                hasFinished = true;
            }

            // returning a way to manually cancel the thing
            return { cancel, };
        }
        tools.doAfterNoUserInteraction = doAfterNoUserInteraction;





        function getTime() {
            return (new Date()).getTime();
        }
        tools.getTime = getTime;





        function secondsFromNow(time) {
            return getTime() + time;
        }
        tools.secondsFromNow = secondsFromNow;





        function showMistakenVocab(words) {


            /*
             *
             *      returns a string in the format "cat-猫<br>dog-犬<br>horse-馬"
             *
             */


            words = words || {};
            let returnString = "";

            for (var key in words) {
                const value = words[key];
                returnString += `${key} - <i>${value}</i><br>`;
            }

            return returnString;
        }
        tools.showMistakenVocab = showMistakenVocab;





        function getFontSize($object) {
            if (!$object) {
                log("tools.getFontSize requires a jQuery object passed in!");
                return false;
            }
            return parseInt($object.css("font-size"));
        }
        tools.getFontSize = getFontSize;





        function refreshAfterWakingFromSleep(object = {}) {

            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
             *
             *      Reloads the page if the computer has been asleep
             *      for more than 2 minutes
             *
             *      This relies on the fact that javascript (and therefor this function)
             *      stops when the computer's asleep
             *
             * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

            // making the object an object, if none is passed in
            const updateInterval = object.updateInterval || 2000; // update every 2 seconds
            const maxAllowed = object.allowedSleepInterval || 120 * 1000; // allowing 120 seconds between

            let lastTime = (new Date()).getTime();

            setInterval(function () {

                const currentTime = (new Date()).getTime();
                const elapsedTime = currentTime - lastTime;

                if (elapsedTime < maxAllowed) {
                    lastTime = currentTime;
                } else {
                    location.reload();
                }

            }, updateInterval);
        }
        tools.refreshAfterWakingFromSleep = refreshAfterWakingFromSleep;





        // triggering the change event on any focussed object on Enter key down
        function enterKeyTriggersChangeEvent() {

            /*
             *
             *      NOTE this is necessary only when not using a <form> tag!
             *
             */
            keyevent.keydown(13, function () {
                $(":focus").trigger("change");
            });
        }
        tools.enterKeyTriggersChangeEvent = enterKeyTriggersChangeEvent;





        // converts 全角 and 半角 alphanumeric stuff, as well as ? and ! marks
        // NOTE this does not work with 漢字
        function zenHanConvert(string) {


            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
             *
             *
             *      Two-part function! So, for example...
             *
             *      zenHanConvert("１２３４").to("hankaku");
             *
             *
             * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


            // error checking
            if (!string || typeof string !== "string" || string.length < 1) {
                log("tools.convertZenkaku needs a string as the first paramter!");
                return;
            }


            return {
                to: function (convertTo) {

                    if (!convertTo || !(convertTo === "zenkaku" || convertTo === "hankaku")) {
                        log("tools.convertZenkaku takes a string, either 'zenkaku' or 'hankaku', as the second paramter!");
                        return;
                    }

                    // 全角に
                    if (convertTo === "zenkaku") {
                        return string.replace(/[A-Za-z0-9?!]/g, function (s) {
                            return String.fromCharCode(s.charCodeAt(0) + 0xFEE0);
                        });
                    }

                    // 半角に
                    if (convertTo === "hankaku") {
                        return string.replace(/[Ａ-Ｚａ-ｚ０-９？！]/g, function (s) {
                            return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
                        });
                    }
                }
            };
        }
        tools.zenHanConvert = zenHanConvert;





        function fitOnOneLine($div) {

            if (!$div) {
                log("tools.fitOnOneLine requires a jquery id of the container holding the text!");
                return;
            }

            if ($div.text() === "") {
                log("tools.fitOnOneLine received no text that needs shrinking!");
                return;
            }

            // adding an invisible for-testing div at the bottom to measure the text in
            if ($("#fit-on-one-line-thing").length === 0) {
                $("html").append("<div style='clear: both; opacity: 0; visibility: 0;'><span id='fit-on-one-line-thing'></span></div>");
            }

            const $fitOnOneLineThing = $("#fit-on-one-line-thing");
            let fontSize = parseInt($div.css("font-size"));
            let safetyCounter = 0;

            $fitOnOneLineThing.text($div.text()).css({ fontSize: fontSize });

            while (($fitOnOneLineThing.width() > $div.parent().width() || $fitOnOneLineThing.height() > $div.parent().height()) && safetyCounter < 20) {
                safetyCounter++;
                fontSize -= 1;
                $fitOnOneLineThing.css({ fontSize: fontSize });
            }

            // finally, setting the font size of the original object
            $div.css({ fontSize: fontSize - 2 });

            return true;
        }
        tools.fitOnOneLine = fitOnOneLine;





        function setMobileScreenWidth(width, callback) {

            // exiting if there is no meta-tag with an id of "viewport"
            if ($("#viewport").length < 1) {
                log("tools.setMobileScreenWidth requires a meta tag with id='viewport'");
                return;
            }

            width = width || 320; // default width

            // using the default width if the screen is smaller than 400px (so this won't apply to desktop)
            if (screen.width <= 400) {
                $("#viewport").prop("content", "width = " + width + ", initial-scale=1.0, maximum-scale=1.0, user-scalable=no");
                if (callback) { callback(); }
            }
        }
        tools.setMobileScreenWidth = setMobileScreenWidth;





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      Returns "Japanese" if there are ANY Japanese characters
         *
         *      in the string; otherwise, returns "English"
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        const languageOf = (function () {

            // regex testing for Japanese hiragana, katakana, and kanji
            const japaneseLetters = /[\u3040-\u309F]|[\u30A0-\u30FF]|[\u4E00-\u9FAF]/;

            return function (string) {

                if (!string || typeof string !== "string" || string.length === 0) {
                    return "tools.languageOf requires a string!";
                }

                return japaneseLetters.test(string) ? "Japanese" : "English";
            };
        }());
        tools.languageOf = languageOf;





        const numbToTouch = (function () {

            return function ($elementsArray, string) {

                tools.forceArray($elementsArray).forEach(function ($element) {

                    if (!$element && $element.length < 1) return; // is the && right here? Should be ||?

                    $element.off("touchstart", disableTouch);

                    if (string !== "off") $element.on("touchstart", disableTouch);

                    function disableTouch(e) {
                        if (e.touches) e = e.touches[0];
                        return false;
                    }
                });
            };
        }());
        tools.numbToTouch = numbToTouch;





        function shrinkFont($container, percent) {

            if (!$container || !($container instanceof $)) return log("tools.shrinkFont requires a jQuery DOM element as the first parameter!");

            // how much of the element to fill (default 90%)
            percent = percent || 0.9;

            // used to break out of infinite loops
            let counter = 0;
            let finalFontSize = 16; // nice, round default?

            function getContainerHeight() {
                return parseInt($container.height());
            }

            function getFontSize() {
                return parseInt($container.css("font-size"));
            }

            // exiting here if it's already one line, or if the font is already ridiculously small
            if (getContainerHeight() < getFontSize * 1.5 || getFontSize < 4) return true;

            // shrinking the font size
            while (getContainerHeight() > (getFontSize * 1.5) && counter < 40) {
                counter++;
                finalFontSize = getFontSize - 1;
                // log("finalFontSize is: " + finalFontSize);
                $container.css({ fontSize: finalFontSize });
            }

            // calculating the final font size
            finalFontSize *= percent;

            $container.css({ fontSize: finalFontSize });
        }
        tools.shrinkFont = shrinkFont;





        // returns 'click' if it's desktop, or 'touchend' if it's mobile
        tools.clickOrTouch = tools.isMobile() ? "touchend" : "click"; // NEW TEST changed from "touchstart" to "touchend"





        function score(obj) {


            const settings = $.extend({
                timerAutoStart: false
            }, obj || {});


            let time1; // time at the FIRST answer, constant
            let time2; // time of the LAST answer, updated with each problem
            let myInterval;
            let timerHasStarted = false;


            function markTimeOfAnswer() {
                score.number_correct++;
                time2 = (new Date()).getTime();
                return this;
            }


            function getAverageTimeBetweenAnswers() {
                const avgTime = (time2 - time1) / score.number_correct; // miliseconds
                return {
                    miliseconds: avgTime, // miliseconds
                    seconds: Math.round(avgTime / 1000),
                    twoDecimal: Math.round(avgTime / 10) / 100 // e.g. 1789 => 1.79
                };
            }


            function startTimer() {
                if (timerHasStarted) return;
                timerHasStarted = true;
                time1 = (new Date()).getTime();
                myInterval = setInterval(incrementTimer, 1000);
                return this;
            }


            function incrementTimer() {
                const currentTime = (new Date()).getTime();
                const timeElapsed = Math.floor((currentTime - time1) / 1000);
                score.time_taken = timeElapsed;
                return this;
            }


            function stopTimer() {
                clearInterval(myInterval);
                return this;
            }


            function getNumberAnswered() {
                return this.number_correct + this.number_mistakes;
            }


            if (settings.timerAutoStart) startTimer();


            return {
                time_taken: function () {
                    return score.time_taken;
                },
                number_correct: 0,
                number_mistakes: 0,
                total_number_problems: null,
                stopTimer,
                startTimer,
                markTimeOfAnswer,
                getAverageTimeBetweenAnswers,
                getNumberAnswered,
            };
        }
        tools.score = score;





        // returning the tools object so it works with Require.js
        return tools;
    }
);
