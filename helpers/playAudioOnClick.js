/* jshint expr: true */


define(
    [
        "jquery",
        "tools",
        "helpers/AudioLoader",
        "howler",
    ],
    function(
        $,
        tools
    ) {


        new Howl({
            src: [""],
            autoplay: true,
            format: ["mp3"], // just to avoid pointless warnings
        });


        // const getVoiceFolder = (function() {
        //
        //
        //     const voicesArray = tools.shuffle(["Emma", "Joanna", "Justin", "Matthew"]);
        //     let index = 0;
        //
        //
        //     return function() {
        //         index++;
        //         return voicesArray[index % voicesArray.length];
        //     };
        // }());


        let $allButtons = [];


        function stopAll() {
            $allButtons.forEach($button => {
                $button.howl && $button.howl.stop();
                $button.reset();
            });
        }


        return function($button, audioFileName) {


            if (arguments.length !== 2) {
                console.log("playAudioOnClick requires a jQuery element and an audioFileName passed in!");
                return false;
            }


            // adding methods to the buttons THEMSELVES - how cool is that??
            $button.reset = function() {
                $button.css({ opacity: 1 });
            };


            $button.activate = function() {
                $button.css({ opacity: 0.5 });
            };


            tools.elementOnScreen($button, function() {


                $button.off("click").on("click", playSound);


                function playSound() {


                    stopAll();


                    const howl = new Howl({
                        src: [`/audio/${tools.pickRandomVoice()}/${audioFileName}.mp3`],
                        onload: function() {
                            $button.howl = howl; // adding the howl to the button itself
                            $allButtons.push($button);
                            $(window).trigger("scroll"); // forcing the sounds to load - why??
                            $button.activate();
                        },
                        onend: $button.reset,
                        // onplay: function() {
                        //     $button.activate();
                        // },
                        onloaderror: function() {
                            //
                        },
                        autoplay: true,
                    });
                }
            });
        };
    }
);