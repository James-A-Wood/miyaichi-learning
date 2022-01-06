define(
    [
        "jquery",
        "tools"
    ],
    function ($, tools) {

        return function (obj = {}) {

            const isLoggedIn = obj.isLoggedIn;
            const postInterval = obj.postInvterval || 10 * 1000; // 10 seconds
            const displayUpdateInterval = obj.displayUpdateInverval || 1 * 1000; // 1 second

            let estimatedGambariTime = 0;
            let userHasInteracted = false;
            let lastTime = null;
            let isPaused = false;
            let problemHasStarted = false;
            let myInterval = null;

            // marking "userHasInteracted" on ANY user input
            // NOTE this is reset to FALSE every time the ajax is sent
            tools.onUserInteraction(() => {
                if (problemHasStarted && !isPaused) userHasInteracted = true;
            });


            // setting the "estimatedGambariTime" - only an estimate, strictly for display purpses!
            // NOTE the actual $.post update is sent separately, every ~10 seconds
            setInterval(function () {
                const currentTime = Date.now();
                if (isPaused || !problemHasStarted) return false;
                if (userHasInteracted) estimatedGambariTime += currentTime - lastTime;
                lastTime = currentTime;
            }, displayUpdateInterval);



            // showing real-time (though approximate) gambari-jikan on the page
            let display = (function () {

                if (!isLoggedIn) return;

                const displayRefreshInterval = obj.displayRefreshInterval || 1 * 1000; // every second
                const $display = obj.display || $("#timer-display");
                const $userInfo = $display.removeClass("my-template");
                const baseText = "頑張り時間: ";

                let displayInterval = setInterval(displayGambariJikan, displayRefreshInterval);
                displayGambariJikan();

                function displayGambariJikan() {

                    const totalTime = Math.floor(getTotalTime() / 1000);
                    const formattedTime = tools.secondsToHMS(totalTime, {
                        secondsTag: "s",
                        minutesTag: "m ",
                        useLeadingZeroes: false
                    });

                    $userInfo.empty().html(baseText + formattedTime);

                    getUserIsActivelyUsing() ? $userInfo.removeClass("sleeping") : $userInfo.addClass("sleeping");
                }

                function remove() {
                    clearInterval(displayInterval);
                    $userInfo.remove();
                }

                return { remove };
            }());


            // periodically notifying the server that this user is still actively using
            if (!myInterval) {
                myInterval = setInterval(sendGambariTime, postInterval);
                sendGambariTime();
            }


            function sendGambariTime() {

                // doing nothing if the user hasn't touched or moved
                // anything, or if the user isn't logged in
                if (!userHasInteracted || !isLoggedIn || !problemHasStarted || isPaused) return;

                userHasInteracted = false;

                // posting that the student has interacted
                $.post("/user_stuff", { job: "add_user_gambari_time" }).always(d => {
                    userHasInteracted = false;
                })
            }


            function stop() {
                clearInterval(myInterval);
                display?.remove();
                return true;
            }


            function getTotalTime() {
                return parseInt(estimatedGambariTime);
            }


            function manuallyTriggerUserStillAcive() {
                userHasInteracted = true;
            }


            function getUserIsActivelyUsing() {
                return userHasInteracted && problemHasStarted;
            }


            function pause() {
                isPaused = true;
            }


            function resume() {
                isPaused = false;
            }


            function start() {
                lastTime = (new Date()).getTime();
                userHasInteracted = true;
                problemHasStarted = true;
            }


            return {
                stop,
                getTotalTime,
                getUserIsActivelyUsing,
                pause,
                resume,
                start,
                display,
                manuallyTriggerUserStillAcive
            };
        };
    }
);
