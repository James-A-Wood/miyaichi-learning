define(
    [
        "jquery",
        "tools",
        "assignment",
        "libraries/iframe_api"
    ],
    function(
        $,
        tools,
        assignment
    ) {


        $(function() {


            const backButton = (function() { // probably overengineering this


                const $backButton = $("#video-back-button");
                $backButton.on("click", function() {
                    window.history.back();
                });


                function show() {
                    $backButton.prop("disabled", false);
                }


                return {
                    show,
                };
            }());


            assignment.getProblemData(function(d) {


                let t1 = null;
                let totalMilisecondsWatched = 0;
                let resultsWereSent = false;
                let currentVideoState; // 0 == finished, 1 == playing, 2 == stopped, 3 == jump
                let minSecondsNeededToPass;
                let player;


                // keeping track of watched videos so we can avoid adding gambariTime on subsequent playings
                const watchedVideos = tools.objectLocalStorage("watched_videos");
                const minPercentageWatchedForPass = 0.5; // 50% of the video should be watched


                $("#video-title-holder").text(d.video_info.title);


                // if already watched, then activating the backButton by default
                if (watchedVideos(d.assignment.video_id)) {
                    backButton.show();
                }


                // instantiating the player AFTER the global YT object has loaded
                instantiatePlayer();

                function instantiatePlayer() {


                    // repeating until YT has loaded
                    if (!YT || !YT.Player) {
                        window.requestAnimationFrame(instantiatePlayer);
                        return;
                    }


                    // will *REPLACE" the #video-holder div with a YouTube iframe
                    player = new YT.Player("video-holder", {
                        width: "100%",
                        videoId: d.video_info.embed_code,
                        events: {
                            onReady: onPlayerReady,
                            onStateChange: onPlayerStateChange
                        },
                    });
                }


                function onPlayerReady() {


                    minSecondsNeededToPass = player.getDuration() * minPercentageWatchedForPass;


                    window.requestAnimationFrame(eachFrame);

                    function eachFrame() {



                        if (watchedVideos(d.assignment.video_id)) return;


                        const t2 = (new Date()).getTime();


                        if (currentVideoState === 1 && document.hasFocus()) { // if video is playing
                            t1 = t1 || t2;
                            totalMilisecondsWatched += (t2 - t1);
                            assignment.manuallyTriggerUserStillAcive();
                        }


                        t1 = t2;


                        // sending results if we're past the threshhold
                        if (totalMilisecondsWatched / 1000 > minSecondsNeededToPass) {
                            if (!resultsWereSent) {
                                assignment.send_results({
                                    passed: true,
                                    number_mistakes: 0,
                                }, backFromSendResults);
                            }
                            resultsWereSent = true;
                            return;
                        }


                        window.requestAnimationFrame(eachFrame);
                    }
                }


                function onPlayerStateChange(event) {
                    currentVideoState = event.data;
                }


                function backFromSendResults() {
                    watchedVideos(d.assignment.video_id, true); // recording that this video has been watched
                    backButton.show();
                }
            });
        });
    }
);