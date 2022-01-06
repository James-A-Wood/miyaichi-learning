/* jshint expr: true */



define(
    [
        "jquery",
        "helpers/chatManager",
        "tools",
    ],
    function ($, myChatManager, tools) {


        $(function () {


            const poll_interval = 10; // 10-seconds default


            let highestLoadedID = 0;
            let lowestLoadedID;
            let queryCount = 0;
            let isQuerying = false;
            let rowCounter = 0;


            function reloadPage() {
                $("body").css({
                    pointerEvents: "none",
                    opacity: 0.4
                });
                window.location.reload();
            }


            const userLimiter = (function () {


                const sessionKey = "report_limit_user_to";
                const $holder = $("#user-limit-stuff-holder");
                const $input = $holder.find("input[type='number']");
                const $clearButton = $holder.find("#user-limit-clear-button");


                $clearButton.on("click", function () {
                    $input.val() && setValue(null);
                });


                $input.on("change", function () {
                    setValue($(this).val());
                });


                if (sessionStorage[sessionKey]) {
                    $input.val(sessionStorage[sessionKey]);
                }


                function getValue() {
                    return sessionStorage[sessionKey];
                }


                function setValue(number) {


                    if (number) {
                        sessionStorage[sessionKey] = number;
                    } else {
                        sessionStorage.removeItem(sessionKey);
                    }


                    if (!number) {
                        $input.val(null);
                    }


                    reloadPage();
                }


                return {
                    getValue,
                    setValue,
                };
            }());


            const chatManager = myChatManager();


            var countdown = new Countdown({ // using "var" to avoid "can't use before instantiation" error
                button: $("#query-button"),
                classOnFire: "query-button-executing",
                intervalLength: poll_interval * 1000,
                callback: function () {
                    chatManager.retrieveChats();
                    getSubmittedAssignments(addRows);
                }
            });


            // wiring up the #load-next-trigger to call getSubmittedAssignments every time
            // it is scrolled into view
            const loadMoreAssignmentsTrigger = tools.elementOnScreen($("#load-next-trigger"), function () {
                getSubmittedAssignments(addRows, "bottom");
            });


            const desktopNotification = (function () {


                let isFirstTime = true;
                let showDesktopNotifications = false;


                function show(d) {


                    // no notification on page load
                    if (isFirstTime) {
                        isFirstTime = false;
                        return;
                    }


                    if (!d || !d.length || !showDesktopNotifications) return;


                    const nen = d[0].kyoushitsu.title;
                    const firstname = d[0].firstname;
                    const lastname = d[0].lastname;
                    const time = d[0].time_taken + "s";
                    const passed = d[0].passed === 0 ? "X" : "O";


                    let title = lastname + " " + firstname + " (" + nen + ")";
                    let body = "Time: " + time + ", Passed: " + passed;


                    // overwriting the above when there are multiple submitteds
                    if (d.length > 1) {
                        title = d.length + " students";
                        body = "";
                    }


                    window.Notification && window.Notification.requestPermission().then(function () {
                        new Notification(title, {
                            body: body,
                            icon: "/images/checkmark_big.png",
                        });
                    });
                }


                function setShowMode(value) {
                    showDesktopNotifications = !!value;
                }


                return {
                    show,
                    setShowMode
                };
            }());


            function addRows(d, addRowTo) {


                // showing notifications - if they're newly submitted, added at the top
                if (addRowTo !== "bottom") {
                    desktopNotification.show(d);
                    d.reverse(); // WHY IS THIS SUDDENLY NECESSARY???
                }


                d.forEach(function (thisAssignment) {


                    // keeping track of the highestLoadedID and lowestLoadedID
                    highestLoadedID = Math.max(thisAssignment.id, highestLoadedID);
                    lowestLoadedID = lowestLoadedID ? Math.min(thisAssignment.id, lowestLoadedID) : highestLoadedID;


                    const $newRow = new TableRow(thisAssignment);


                    if (addRowTo === "top") {


                        // appending to the TOP of the table - immediately after the header
                        $("#reportTableHeader").after($newRow);


                        // formatting the rows as "newly-added" if they're after the initial query
                        if (queryCount > 1) {
                            rowCounter += 1;
                            const classToAdd = (rowCounter % 2 === 0) ? "newRow2" : "newRow1"; // for formatting
                            $newRow.addClass(classToAdd);
                            const numberNew = $(".newRow1").length + $(".newRow2").length;
                            const numberNewRows = " (" + numberNew + ")";
                            // HERE let's beef this up
                            $("title").text("Submitted " + numberNewRows);
                        }
                    }


                    // if it's a previous submission, then appending to the BOTTOM of the table
                    if (addRowTo === "bottom") {
                        $("#reportTable").append($newRow);
                    }
                });


                hideShowColumns();
            }


            const hideShowColumns = (function () {


                // default values
                const hiddenColumns = {
                    id: true,
                    deleteAssignments: true,
                    username: true,
                    previous_login_name: true,
                    limit_to_user: true
                };


                // building and wiring up the buttons on instantiation
                const $buttonMaster = $("#buttons-holder").find("button.my-template").detach().removeClass("my-template");
                $("th").on("click", toggleColumn).each(function () {
                    const column = $(this).data("column");
                    const headerText = $(this).data("fallback_label") ? $(this).data("fallback_label") : $(this).text();
                    $buttonMaster.clone().data({
                        column: column
                    }).text(headerText).hide().addClass(column).click(toggleColumn).appendTo("#buttons-holder");
                });


                function toggleColumn() {
                    const column = $(this).data("column");
                    hiddenColumns[column] = !hiddenColumns[column];
                    hideShowColumns();
                }


                function hideShowColumns() {


                    // first, showing all td's and th's, and hiding all buttons
                    $("#reportTable").find("td").show();
                    $("#reportTable").find("th").show();
                    $(".show-column-button").hide();

                    // then, hiding stuff that should be hidden
                    for (let column in hiddenColumns) {
                        if (hiddenColumns[column]) {
                            $("#reportTable ." + column).hide();
                            $(".show-column-button." + column).show();
                        }
                    }
                }


                return hideShowColumns;
            }());


            const TableRow = (function () {


                const months = ["Jan", "Feb", "March", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const $rowMaster = $("#reportTable").find("tr.my-template").detach().removeClass("my-template");


                const substitutes = {
                    passed: {
                        "0": "X",
                        "1": "O"
                    },
                    submitted_as_active: {
                        "1": "yes",
                        "-": "-"
                    }
                };


                function processDate(d) {


                    if (!d) return "";


                    // d is like: 2017-10-26 15:22:54


                    const pieces = d.split(" ");
                    let date = pieces[0],
                        time = pieces[1];


                    date = date.split("-");
                    date[1] = months[parseInt(date[1]) - 1];
                    date = date[1] + " " + date[2];


                    time = time.split(".")[0].split(":");
                    time = time[0] + ":" + time[1];


                    return date + ", " + time;
                }


                function Row(thisSubmittedAssignment) {


                    const $newRow = $rowMaster.clone();


                    // NOTE don't have to do this any longer because we're doing it on the server
                    // tweaking the date - funky syntax, because thisSubmittedAssignment.date is an object which itself has a "date" property
                    // thisSubmittedAssignment.date = processDate((thisSubmittedAssignment.date).date); // removing the trailing ".00000"


                    thisSubmittedAssignment.date = processDate(thisSubmittedAssignment.date); // removing the trailing ".00000"


                    // adding the text data for each column
                    for (let column in thisSubmittedAssignment) {
                        const $thisCell = $newRow.find("." + column);
                        let content = thisSubmittedAssignment[column];
                        if (substitutes[column]) content = substitutes[column][content];
                        $thisCell.text(content);
                    }


                    // showing and wiring up the .chat-button, if there is a user_id (i.e., if the user was registered and logged in)
                    if (thisSubmittedAssignment.user_id) {
                        $newRow.find(".username, .lastname, .firstname").show().click(function (event) {
                            chatManager.uploadAdminMessage({
                                event: event,
                                user_id: thisSubmittedAssignment.user_id,
                                firstname: $newRow.find(".firstname").text(),
                                lastname: $newRow.find(".lastname").text(),
                                username: $newRow.find(".username").text()
                            });
                        });
                    }


                    if (!thisSubmittedAssignment.user_id) {
                        $newRow.find(".limit-to-user-button").remove();
                    } else {
                        $newRow.find(".limit-to-user-button").click(function () {
                            limitUser(thisSubmittedAssignment.user_id);
                        });
                    }


                    // wiring up the "submitted_as_active" cell
                    $newRow.find("td.submitted_as_active").dblclick(toggleSubmittedAsActive);
                    $newRow.find(".deleteAssignments").click(deleteAssignment);
                    $newRow.attr("data-user_id", thisSubmittedAssignment.user_id);


                    // wiring up the "user_page" button to open up that user's page,
                    // or removing it, if it's not a registered user
                    if (!thisSubmittedAssignment.user_id) {
                        $newRow.find(".user_page").find("span").remove();
                    } else {
                        $newRow.find(".user_page").on("click", function () {
                            $.post("/login_user_from_kyoushitsu_report", {
                                user_id: thisSubmittedAssignment.user_id
                            }).done(function () {
                                // opening in new tab
                                window.open(window.location.protocol + "//" + window.location.host);
                            }).fail(function (d) {
                                log("login_user_from_kyoushitsu_report faild!");
                                log(d);
                            });
                        });
                    }


                    return $newRow;
                }


                return function (thisSubmittedAssignment) {
                    return new Row(thisSubmittedAssignment);
                };
            }());


            function getSubmittedAssignments(callback, addRowTo) {


                if (isQuerying) return false;
                isQuerying = true;
                addRowTo = addRowTo || "top"; // top by default
                countdown && countdown.pause();


                $.getJSON("/report_stuff", {
                    job: "get_submitted",
                    after_id: (addRowTo === "top") ? highestLoadedID : 0,
                    below_id: (addRowTo === "bottom") ? lowestLoadedID : 0,
                    user_id: userLimiter.getValue()
                }).done(function (d) {


                    desktopNotification.setShowMode(d.show_desktop_notifications);
                    showCurrentUsers(d.current_users);
                    countdown && countdown.setPollInterval(d.poll_interval);


                    // scrolling to page top after the first query ONLY
                    if (queryCount === 0) window.scrollTo(0, 0);


                    // keeping track of the number of queries, mostly so we can format stuff after the second query
                    queryCount += 1;
                    isQuerying = false;
                    countdown && countdown.restart();
                    loadMoreAssignmentsTrigger.activate();
                    d.completedAssignments = d.completedAssignments || [];
                    callback && callback(d.completedAssignments, addRowTo);
                }).fail(function () {
                    reloadPage();
                });
            }


            function limitUser(id) {
                userLimiter.setValue(id);
            }


            // wiring up the ".submitted_as_active" column to toggle the value when clicked
            function toggleSubmittedAsActive() {


                const $this = $(this);
                const currentValue = $this.text();
                const id = $this.siblings(".id").text();


                if (!id || !currentValue) return;


                $.getJSON("/report_stuff", {
                    id: id,
                    job: "toggle_submitted_as_active"
                }).done(function (d) {
                    const newValue = (d === 1) ? "yes" : "-";
                    $this.text(newValue).toggleClass("updated");
                }).fail(function (d) {
                    log("Error toggling submitted_as_active");
                    log(d);
                });
            }


            function deleteAssignment() {


                const $row = $(this).closest("tr");
                const id = $(this).siblings(".id").text();
                $row.addClass("selected");


                setTimeout(function () {


                    if (!tools.doubleConfirm("Really delete?")) {
                        $row.removeClass("selected");
                        return false;
                    }


                    $.getJSON("/report_stuff", {
                        job: "delete_assignment",
                        id: id
                    }).done(function (d) {
                        $row.fadeTo(400, 0, function () {
                            $row.remove();
                        });
                    }).fail(function (d) {
                        log(d);
                    });
                }, 20);
            }


            // Countdown timer that fires off a callback (here, an AJAX request)
            // every ~30 seconds, or when a button is clicked
            function Countdown(inputs) {


                if (!inputs || typeof inputs !== "object" || !inputs.button || !inputs.callback) {
                    log("Countdown received invalid inputs!");
                    return false;
                }

                const $button = inputs.button;
                const buttonDefaultText = inputs.buttonDefaultText || $button.find("#query-button-text").text() || "";
                const classOnFire = inputs.classOnFire || "";


                let intervalLength = inputs.intervalLength || 10 * 1000;
                let startTime = (new Date()).getTime();
                let currentTime = startTime;
                let milisecondsRemaining = 0;


                $button.click(executeCallback);
                executeCallback();


                let myInterval = setInterval(markTimeElapsed, 100); // ten times per second
                markTimeElapsed();


                function markTimeElapsed() {


                    currentTime = (new Date()).getTime();
                    const secondsPassed = currentTime - startTime;
                    milisecondsRemaining = intervalLength - secondsPassed;
                    const secondsText = Math.ceil(milisecondsRemaining / 1000);


                    $button.find("#query-button-text").text(buttonDefaultText + " in " + secondsText);

                    if (milisecondsRemaining <= 0) {
                        pause();
                        executeCallback();
                    }
                }


                function pause() {
                    clearInterval(markTimeElapsed);
                    $button.off("click", executeCallback);
                    $button.addClass(classOnFire);
                    $button.find("#query-button-text").text(buttonDefaultText);
                }


                function restart() {
                    setInterval(markTimeElapsed, 100);
                    $button.off("click", executeCallback).click(executeCallback);
                    $button.removeClass(classOnFire);
                    markTimeElapsed();
                }


                function executeCallback() {
                    startTime = (new Date()).getTime();
                    markTimeElapsed();
                    inputs.callback();
                }


                function cancel() {
                    clearInterval(myInterval);
                    $button.off("click", executeCallback);
                }


                function setPollInterval(number) {
                    intervalLength = number * 1000;
                }

                this.cancel = cancel;
                this.pause = pause;
                this.restart = restart;
                this.setPollInterval = setPollInterval;
            }


            function showCurrentUsers(users) {


                $("#current-users-holder").empty();


                users && users.forEach(function (user, index) {


                    const joiner = (index === users.length - 1) ? "" : ", ";
                    const name = (function () {
                        if (user.lastname && user.firstname) {
                            return user.lastname + " " + user.firstname;
                        }
                        return user.username;
                    }());
                    const nenKumi = (function () {
                        if (user.nen && user.kumi) {
                            return " (" + user.nen + "-" + user.kumi + ")";
                        }
                        return "";
                    }());


                    const $span = $("<span>").text(name + nenKumi + joiner);


                    // dimming the user if he is logged in, but not actively using teh app
                    !user.is_active && $span.css({ opacity: 0.3 });


                    $span.click(function (event) {
                        chatManager.uploadAdminMessage({
                            event: event,
                            user_id: user.user_id,
                            firstname: user.firstname.text,
                            lastname: user.lastname.text,
                            username: user.username
                        });
                    });


                    // appending the span to the holder
                    $("#current-users-holder").append($span);
                });
            }
        });
    }
);
