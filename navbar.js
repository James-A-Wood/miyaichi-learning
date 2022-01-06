/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *
 *      JavaScript for navbar.php!
 *
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

define(
        [
            "jquery",
            "tools",
        ],
    function($, tools, ) {


        // wiring up the navbar-logout-button
        $("#navbar-logout-button").off("click").click(function() {

            // erasing localStorage 'isLoggedIn' and sessionStorage 'kyoushitsu'
            try {
                localStorage.removeItem("isLoggedIn");
            } catch (e) {
                //
            }

            // logging out, and then redirecting back to the home page
            $.getJSON("/user_logout", function() {
                tools.userInfo("clear");
                window.location = "/user_page";
            }).fail(function(d) {
                console.log("Error?");
                console.log(d);
            });
        });
    }
);