/* jshint expr: true */

/*
 *
 *
 *      POSTs to the server that the user is still here - though not necessarily
 *      actively using
 *
 *      Included on user_page and assignment
 *
 *
 */

define(
        [
            "jquery"
        ],
    function($) {


        const sendInterval = 10 * 1000; // 10 seconds


        // calling once every 10 seconds (or whatever) - also calling once immediately
        setInterval(recordUserStillPresent, sendInterval);
        recordUserStillPresent();

        function recordUserStillPresent() {
            localStorage.isLoggedIn && $.post("/user_present");
        }
    }
);