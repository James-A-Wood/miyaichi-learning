/* jshint expr: true */



define(
    [
        "jquery",
        "konva/circleGraph",
        "tools",
        "libraries/odometer",
        "helpers/assignmentTree",
        "Konva",
        "helpers/sheepAttack",
        "matter",

        // The next libraries don't need a variable specified in the arguments
        // "libraries/dropzone",
        // "libraries/scrollTo",
        "jqueryui",
    ],
    function (
        $,
        circleGraphFactory,
        tools,
        Odometer,
        assignmentTree,
        Konva,
        SheepAttack
    ) {


        $(function () {


            const $reviewWordsHolder = $("#review-words-holder");


            // the forbidden button
            // (function() {
            //
            //
            //     const numCircles = 100;
            //     const interval = 1000;
            //
            //
            //     let isPartying = false;
            //
            //
            //     $("#kindan-button").click(partyTime);
            //
            //
            //     function partyTime() {
            //
            //
            //         // // NEW TEST
            //         // DeviceMotionEvent && DeviceMotionEvent.requestPermission && DeviceMotionEvent.requestPermission().then(function() {
            //         //     alert("OK");
            //         // });
            //
            //         $(this).blur(); // blurring the button
            //
            //         const canvasManager = (function() {
            //
            //             function addNew() {
            //                 const $canvas = $("<canvas id='party-canvas'></canvas>");
            //                 $canvas.click(clearParty);
            //                 $canvas.attr({
            //                     width: window.innerWidth,
            //                     height: window.innerHeight
            //                 }).css({
            //                     position: "fixed",
            //                     top: 0,
            //                     left: 0
            //                 });
            //                 $canvas.appendTo("body");
            //                 $("html").on("keyup", clearParty);
            //             }
            //
            //             function remove() {
            //                 $("#party-canvas").remove();
            //             }
            //
            //             return { addNew, remove };
            //         }());
            //
            //
            //         if (isPartying) {
            //             clearParty();
            //             return;
            //         }
            //         isPartying = true;
            //
            //
            //         canvasManager.addNew();
            //
            //
            //         function clearParty() {
            //             World && World.clear(engine.world);
            //             Engine && Engine.clear(engine);
            //             canvasManager && canvasManager.remove();
            //             $("html").off("keyup", clearParty);
            //             isPartying = false;
            //         }
            //
            //
            //         var Engine = Matter.Engine,
            //             Render = Matter.Render,
            //             World = Matter.World,
            //             Bodies = Matter.Bodies,
            //             Body = Matter.Body;
            //
            //
            //         // create engine
            //         const engine = Engine.create({
            //             canvas: document.getElementById("party-canvas")
            //         });
            //         const world = engine.world;
            //
            //
            //         // create renderer
            //         const render = Render.create({
            //             canvas: document.getElementById("party-canvas"),
            //             engine: engine,
            //             options: {
            //                 width: window.innerWidth,
            //                 height: window.innerHeight,
            //                 wireframes: false,
            //                 background: "transparent"
            //             }
            //         });
            //
            //
            //         function addCircle(i, interval, total) {
            //             setTimeout(function() {
            //                 const randX = 20 + (Math.random() * (window.innerWidth - 40));
            //                 const randY = 10 + Math.random() * (window.innerHeight * 0.9);
            //                 const randRadius = 10 + Math.random() * 5;
            //                 const circle = Bodies.circle(randX, randY, randRadius);
            //                 Body.setVelocity(circle, {
            //                     x: 5 - Math.random() * 10,
            //                     y: -5 - Math.random() * 5
            //                 });
            //                 circle.restitution = 1;
            //                 circle.restitution = 0.9;
            //                 circle.friction = 0.1;
            //                 World.add(world, circle);
            //             }, interval * (i / total));
            //         }
            //
            //
            //         // adding walls
            //         World.add(world, [
            //             // left
            //             Bodies.rectangle(-25, window.innerHeight / 2, 50, window.innerHeight, { isStatic: true }),
            //             // right
            //             Bodies.rectangle(window.innerWidth + 25, window.innerHeight / 2, 50, window.innerHeight, { isStatic: true }),
            //             // bottom
            //             Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 25, window.innerWidth, 50, { isStatic: true }),
            //         ]);
            //
            //         Engine.run(engine);
            //         Render.run(render);
            //
            //         for (let i = 0; i < numCircles; i++) {
            //             addCircle(i, interval, numCircles);
            //         }
            //
            //         // adding tilt detection
            //         const tiltDetector = new tools.DeviceTiltDetector();
            //         tiltDetector.maxTilt && eachFrame();
            //
            //         function eachFrame() {
            //             world.gravity.x = tiltDetector.x / tiltDetector.maxTilt;
            //             window.requestAnimationFrame(eachFrame);
            //         }
            //     }
            // }());



            //                var kindanButton = (function () {
            //
            //
            //                    var $kb = $("#kindan-button");
            //                    var nowShowing = false;
            //                    var counter = 0;
            //
            //
            //                    // gray background
            //                    var $background = $("<div></div>").css({
            //                        position: "fixed",
            //                        width: "100%",
            //                        height: "100%",
            //                        top: 0,
            //                        left: 0,
            //                        background: "rgba(100, 100, 100, 0.9)",
            //                        opacity: "0"
            //                    });
            //
            //
            //                    // adding X-mark to dismiss it - although actually the whole background is clickable
            //                    $("<span class='glyphicon glyphicon-remove' />").css({
            //                        color: "white",
            //                        position: "absolute",
            //                        fontSize: "36px",
            //                        top: "5%",
            //                        right: "5%"
            //                    }).appendTo($background);
            //
            //
            //                    function removeImage() {
            //                        $background.fadeOut(1000, function () {
            //                            $(this).empty();
            //                            $(this).remove();
            //                            nowShowing = false;
            //                        });
            //                        return true;
            //                    }
            //
            //
            //                    function escKeyDismissImage(e) {
            //                        (e.keyCode === 27 || e.keyCode === 13) && removeImage();
            //                    }
            //
            //
            //                    $kb.on("click", loadAndShowImage);
            //                    function loadAndShowImage() {
            //
            //
            //                        if (nowShowing) {
            //                            return false;
            //                        }
            //
            //
            //                        nowShowing = true;
            //
            //
            //                        $kb.addClass("waiting");
            //
            //
            //                        $.getJSON("/user_stuff", {
            //                            job: "get_image",
            //                            counter: counter
            //                        }).done(function (src) {
            //                            counter++;
            //                            var image = new Image();
            //                            image.onload = function () {
            //
            //
            //                                // appending and formatting the Image
            //                                $(image).css({
            //                                    position: "fixed",
            //                                    top: "50%",
            //                                    left: "50%",
            //                                    transform: "translate(-50%, -50%)"
            //                                }).addClass("img-responsive").appendTo($background);
            //
            //
            //                                // appending the background and wiring it up
            //                                $background.appendTo("body").fadeTo(1000, 1, function () {
            //                                    $kb.removeClass("waiting");
            //                                }).off("click", removeImage).on("click", removeImage);
            //
            //
            //                                // wiring up dismissal by Esc key
            //                                $("html").off("keydown", escKeyDismissImage).on("keydown", escKeyDismissImage);
            //                            };
            //                            image.src = src;
            //                        }).fail(function (e) {
            //                            console.log(e);
            //                        });
            //                    }
            //
            //                }());


            SheepAttack({
                button: $("#kindan-button")
            });


            tools.warnPrivateBrowsing();


            tools.elementOnScreen($reviewWordsHolder, function () {


                $.getJSON("/user_stuff", {
                    job: "get_tangocho_words",
                    limit: 20
                }).done(function (d) {


                    if (!d || typeof d !== "object" || !d.tangocho_items || !d.tangocho_items.length) return false;


                    $reviewWordsHolder.empty();
                    const words = d.tangocho_items;
                    const $mySpan = $("<span class='pair-holder col-xs-12 col-sm-6 col-md-4 col-lg-3'/>");


                    // for each word, adding a span holding the pair, English and Japanese
                    words.forEach(item => {
                        $mySpan.clone().text(item.english + " - " + item.japanese).appendTo($reviewWordsHolder);
                    });


                    // adding "+3 more" in the bottom (doesn't have to be 3)
                    const numAdditionalWords = d.num_tangocho_items - words.length;
                    if (numAdditionalWords > 0) {
                        const $additionalWordsSpan = $mySpan.clone().text("+ " + numAdditionalWords + " more").css({ fontStyle: "italic", float: "right", textAlign: "right" });
                        $reviewWordsHolder.append($additionalWordsSpan);
                    }
                }).fail(function (d) {
                    console.log("Failed!");
                    console.log(d);
                });
            });


            const lessonCompletedGraph = circleGraphFactory({
                outerRadius: 27,
                innerRadius: 23,
                foregroundFill: "limegreen",
                labelFontSize: 10,
                duration: 1,
                tag: "%\n完成!",
                pauseBeforeStart: 1
            });


            // getting fastest times for each assignment, and displaying the record-holder ribbons
            $.getJSON("/user_stuff", {
                job: "get_fastest_assignment_times",
                assignment_ids: getAllAssignmentIDs()
            }).done(assignments => {
                for (let thisAssignment in assignments) {
                    if (assignments[thisAssignment].record_holder) {
                        $(`.assignment-button[data-db_id=${thisAssignment}]`)
                            .addClass("record-holder")
                            .find(".record-holder-ribbon")
                            .append(" (" + assignments[thisAssignment].time_taken + "秒)");
                    }
                }
            }).fail(function (e) {
                log("get_fastest_assignment_times failed!");
                log(e);
            });


            // finally, retrieving the data from the server, and calling "showUserData" when done
            $.getJSON("/user_stuff", {
                job: "get_user_page_info",
                assignment_ids: getAllAssignmentIDs()
            }).done(d => {
                showUserData(d);
            }).fail(function (d) {
                log("get_use_page_info failed!");
                log(d);
            });


            function showUserData(d) {


                if (!d || !d.gambari_info) return false;


                // saving to storage so we can access in the assignment page
                sessionStorage.gambari_total = d.gambari_info.total;


                // showing user's total gambari time
                $("#gambari_total_text").text(tools.secondsToHMS(d.gambari_info.total, {
                    useHours: true,
                    hoursTag: "h ",
                    minutesTag: "m ",
                    secondsTag: "s",
                    useLeadingZeroes: false
                }));


                // showing the gakunen ranking in the "odometer"
                showGakunenRanking({ rank: d.gambari_info.ranking });
                showGambariBars(d);
                showCompletedAssignments(d.all_user_submitted, function () {
                    addCompletedInfo(d);
                });
            }


            function addCompletedInfo(d) {


                $("#stats-n-messages").fadeIn(100);


                // showing the completed graphs
                $(".chapter-title").each(function (index) {


                    const $this = $(this);


                    const percent = (function () {
                        const numAssignments = $this.closest(".chapter-holder").find(".assignment-button").length;
                        const numDone = $this.closest(".chapter-holder").find(".done").length;
                        let percent = 0.0001; // non-zero value for graphical reasons
                        if (numAssignments > 0 && numDone > 0) {
                            percent = numDone / numAssignments;
                        }
                        return percent;
                    }());


                    // showing the graphs on DESKTOP only!
                    if (tools.isMobile()) {
                        const text = Math.floor(percent * 100) + "% 完成"; // converting 0.87 to "87%"
                        $this.find(".chapter-finished-graph-holder").append(text).find("img").remove();
                    } else {
                        const id = "my-chapter-title-" + index;
                        $this.find(".chapter-finished-graph-holder").attr("id", id);
                        lessonCompletedGraph({
                            container: id,
                            percent: percent
                        });
                    }
                });


                // adding trophy marks to perfect chapters
                $(".chapter-holder").each(function () {
                    const numButtons = $(this).find(".assignment-button").length;
                    const numPerfect = $(this).find(".assignment-button.perfect-score").length;
                    numPerfect === numButtons && $(this).addClass("chapter-perfect");
                });
            }


            function adjustRowHeight(keysArray) {

                const combinedHeight = parseInt($(".weekly-update").outerHeight(true)) * keysArray.length;
                const holderHeight = $(".stats-centered").outerHeight(true);

                if (combinedHeight > holderHeight) {
                    const rowHeight = holderHeight / keysArray.length;
                    $(".weekly-update").find("td").css({ height: Math.max(rowHeight, 20) });
                }
            }


            function showCompletedAssignments(allSubmittedAssignments, callback) {


                $("body").removeClass("user-data-not-yet-loaded");


                // first, grouping assignments by ID, with total number and the number perfect
                let submitteds = {};
                allSubmittedAssignments.forEach(thisSubmitted => {
                    const db_id = thisSubmitted.assignment_id;
                    submitteds[db_id] = submitteds[db_id] || { all: 0, perfect: 0 };
                    submitteds[db_id].all += 1;
                    if (thisSubmitted.number_mistakes === 0 || thisSubmitted.number_mistakes === "0" || thisSubmitted.template === "video") { // adding the video thing is klugey
                        submitteds[thisSubmitted.assignment_id].perfect += 1;
                    }
                });


                function addStars(numberStars, $container, isPerfect) {


                    if (!numberStars) return;


                    $container = $container.find(isPerfect ? ".perfect-star-holder" : ".not-perfect-star-holder");
                    const stage = new Konva.Stage({ container: $container[0], width: 40, height: 40, });
                    const layer = new Konva.Layer().moveTo(stage);


                    const gradientFillStart = isPerfect ? "rgba(254, 241, 96, 1)" : "lightblue";
                    const gradientFillEnd = isPerfect ? "orange" : "navy";
                    const radius = stage.width() / 2;


                    const star = new Konva.Star({
                        x: radius,
                        y: radius,
                        innerRadius: radius * 0.5,
                        outerRadius: radius * 0.8,
                        stroke: "rgba(255, 255, 255, 0.3)",
                        strokeWidth: 0.5,
                        shadowColor: "black",
                        shadowBlur: 2,
                        shadowOffset: { x: 2, y: 2 },
                    });
                    star.fillLinearGradientStartPoint({ x: -star.width() / 2, y: -star.height() / 2 });
                    star.fillLinearGradientEndPoint({ x: star.width() / 2, y: star.height() / 2 });
                    star.fillLinearGradientColorStops([0, gradientFillStart, 1, gradientFillEnd]);


                    let numberText = new Konva.Text({
                        x: radius,
                        y: radius + 1, // slightly lowered 'cause it looks prettier
                        text: "x" + numberStars,
                        fill: "white",
                        fontSize: 24,
                    });
                    numberText.offsetX(numberText.width() / 2);
                    numberText.offsetY(numberText.height() / 2);


                    let correctScale = star.innerRadius() / (numberText.width() * numberText.scaleX());
                    correctScale *= 1.3; // x1.3 'cause it's a rectangular text inside a round radius
                    numberText.scaleX(correctScale).scaleY(correctScale);


                    layer.add(star, numberText).batchDraw();


                    // eye candy
                    tools.elementOnScreen($container, function () {
                        star.rotation(360 * 3).shadowOpacity(0).to({
                            rotation: 0,
                            duration: 2,
                            easing: Konva.Easings.EaseOut,
                            shadowOpacity: 0.6,
                        });
                    });
                }


                // adding the done-stars
                $(".assignment-button").each(function () {


                    const $this = $(this);
                    const assignmentID = $this.data("db_id");


                    const timesDone = submitteds[assignmentID] ? submitteds[assignmentID].all : 0;
                    const timesPerfect = submitteds[assignmentID] ? submitteds[assignmentID].perfect : 0;
                    const timesNotPerfect = timesDone - timesPerfect;


                    // optionally adding "done" and "perfect-score" classes to the button
                    timesDone > 0 && $this.addClass("done");
                    timesPerfect > 0 && $this.addClass("perfect-score");


                    addStars(timesPerfect, $this, true);
                    addStars(timesNotPerfect, $this, false);

                }).promise().done(function () {
                    //
                });


                assignmentTree().saveToSession();


                callback();
            }


            function showGakunenRanking(obj) {


                if (!obj || typeof obj !== "object" || !obj.rank) return false;


                $("#gambari_total_ranking").addClass("odometer");
                const od = new Odometer({
                    el: $("#gambari_total_ranking")[0],
                    value: "--"
                });


                setTimeout(function () {
                    od.update(obj.rank);
                }, 1000);
            }


            function showGambariBars(d) {


                // most recent to oldest
                const $weeklyUpdate = $("#stats-n-messages").find(".weekly-update.my-template").detach().removeClass("my-template");
                const keysArray = Object.keys(d.gambari_info.gambari_by_week);


                keysArray.forEach(function (key, index) {


                    // adding a bar for the current week
                    const $clone = $weeklyUpdate.clone().prependTo("#weekly-updates");
                    const seconds = d.gambari_info.gambari_by_week[key].total;
                    let percent = seconds / (d.gambari_info.gambari_minutes_per_week * 60) * 100;
                    percent = Math.min(percent, 100); // keeping the value <= 100
                    const date = {
                        label: "Week " + (index + 1),
                        tag: (function () {
                            if (d.gambari_info.gambari_by_week[key].days_left) {
                                return `(残り ${parseInt(d.gambari_info.gambari_by_week[key].days_left)} 日)`;
                            }
                            return "";
                        }()),
                    };
                    const secondsFormatted = tools.secondsToHMS(seconds, {
                        hoursTag: "h ",
                        minutesTag: "m ",
                        secondsTag: "s",
                        useLeadingZeroes: false
                    });


                    $clone.find(".date-holder").find(".date-text").append(date.label);
                    $clone.find(".date-holder").find(".date-tag").append(date.tag);
                    $clone.find(".minutes-seconds-holder").append(secondsFormatted);
                    $clone.find(".percent-holder").append(Math.round(percent) + "%");


                    setTimeout(function () {
                        $clone.find(".bar").animate({ width: percent + "%" }, 1000);
                    }, 1000);
                });


                adjustRowHeight(keysArray);
            }


            function getAllAssignmentIDs() {
                return $(".assignment-button").map(function () {
                    return $(this).data("db_id");
                }).toArray();
            }


            $.get("user_stuff", {
                job: "get_user_info",
            }).done(function (d) {
                tools.userInfo(tools.safeParseJSON(d));
            });
        });
    }
);
