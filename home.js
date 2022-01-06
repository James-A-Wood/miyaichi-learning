/* jshint esversion:6 */

/* jshint expr: true */

define(
    [
        "jquery",
        "helpers/shakeElement",
        "tools",
        // "libraries/WebAudioTrack",
        "howler", // use for 禁断のボタン
        "bootstrap",
    ],
    function(
        $,
        shakeElement,
        tools
        // WebAudioTrack
    ) {


        $(function() {


            // testing for PRIVATE BROWSING, because iOS Safari doesn't
            // support localStorage when using private browsing!  Jesus!
            tools.warnPrivateBrowsing();


            // preventing page zoom on mobile, because it messes up the login box stuff
            if (tools.isMobile() && $("#viewport").length) {
                $("#viewport").attr("content", "initial-scale=1.0, user-scalable=no");
            }


            sessionStorage.text = "";


            // loading each YouTube video ONLY when it's onscreen
            // copying the source from the data-src attribute to the real "src" attribute
            $(".home-video").each(function() {
                var $this = $(this);
                tools.elementOnScreen($this, function() {
                    $this.attr("src", $this.data("src"));
                });
            });


            // preloading the username, and setting focus on the password input
            if (tools.userInfo("username")) {
                $("#username-input").val(tools.userInfo("username")); //localStorage.username);
            }


            // clearing the password-wrong class every time a key is pressed
            $("#password-input").off("keydown").keydown(function() {
                $(this).removeClass("password-wrong");
            });


            $("#login-form").submit(function(e) {
                e.preventDefault();
                const username = $("#username-input").val().trim();
                const password = $("#password-input").val().trim();
                login(username, password);
            });


            function login(username, password) {


                if (!username || !password) return false;


                const doAutoLogin = $("#auto-login-checkbox").is(":checked") ? 1 : 0;
                $("#login-loading-gif").show();
                $("#password-input").attr({ disabled: true });


                $.post("/check_login_password", {
                    username: username,
                    password: password,
                    autoLogin: doAutoLogin
                }, function(data) {
                    $("#login-loading-gif").hide();
                    data ? login_success(data) : login_failed();
                }, "json").fail(function(d) {
                    console.log("Login failed!");
                    console.log(d);
                });


                function login_failed() {
                    $("#password-input").val("").addClass("password-wrong").attr({ disabled: false }).focus();
                    shakeElement($("#login-stuff-holder"), { amplitude: 4, });
                    tools.userInfo("clear");
                }


                function login_success(data) {

                    // if we've got this far, then we're logged in
                    // localStorage.username = data.username;
                    // localStorage.user_id = data.user_id;

                    // disabling stuff, so user isn't tempted to click twice
                    $("#login-submit-button").attr({ disabled: true }).removeClass("btn-warning").addClass("btn-success");
                    $("#login-buton").off("click");
                    $("#password-input").attr({ disabled: true }).addClass("password-correct").val("ログイン中...");
                    $("#login-form").addClass("logging-in");


                    window.location = "/user_page";
                }
            }






            /*
             *
             *      TESTING coins & cash stuff
             *
             *
             */


            //                let rewardCoin = (function () {
            //
            //
            //                    let kachingHasLoaded = false;
            //                    let isPlaying = false;
            //
            //                    let coinMessage = "Congratulations!";
            //                    let coinAmount = "$5";
            //                    let coinFloatSeconds = 10;
            //
            //                    let $coinHolder = $("#coin-frame").detach().removeClass("my-template");
            //                    let kaching = new Howl({
            //                        src: "/sounds/cash_register.mp3",
            //                        onload: function () {
            //                            kachingHasLoaded = true;
            //                        }
            //                    });
            //
            //
            //                    function play(obj) {
            //
            //                        if (!kachingHasLoaded) {
            //                            return false;
            //                        }
            //
            //                        // retracting if the animation is currently running
            //                        if (isPlaying) {
            //                            retract();
            //                            return true;
            //                        } else {
            //                            isPlaying = true;
            //                        }
            //
            //
            //                        // have to append to body first, in order to get its height
            //                        $coinHolder.appendTo("body");
            //                        let coinHolderHeight = $coinHolder.outerHeight(true);
            //
            //                        $("#coin-message-holder").text(obj.message || coinMessage);
            //                        $("#coin-amount-holder").text(obj.amount || coinAmount);
            //
            //                        // the "in" animation only
            //                        $coinHolder.animate({
            //                            top: window.innerHeight - coinHolderHeight
            //                        }, 600, null, function () {
            //                            kaching.play();
            //                            setTimeout(retract, coinFloatSeconds * 1000); // 10 seconds
            //                        });
            //                    }
            //
            //
            //                    function retract() {
            //                        $coinHolder.animate({
            //                            top: "100%"
            //                        }, 600, null, function () {
            //                            isPlaying = false;
            //                            $coinHolder.detach();
            //                        }, 2000);
            //                    }
            //
            //
            //                    return {
            //                        play: play
            //                    };
            //                }());
            //
            //
            //                $("body").on("click", function () {
            //                    rewardCoin.play({
            //                        message: "Hello!",
            //                        amount: "$10"
            //                    });
            //                });


        });
    }
);