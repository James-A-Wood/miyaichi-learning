/* jshint expr: true */

define(
    [
        "jquery",
        "jqueryui"
    ],
    function($) {


        $(function() {


            $("#recommended-video-input").on("change", function() {


                // extracting the "embed" code, if we're pasting in the whole string (which is likely)
                if ($(this).val().indexOf("embed/") !== -1) {
                    const embedCode = $(this).val().split("embed/")[1].split("\"")[0];
                    $(this).val(embedCode);
                }


                $.post("active_assignment_stuff", {
                    job: "set_recommended_video",
                    kyoushitsu: $("#kyoushitsu-selector").val(),
                    url: $(this).val(),
                }, "json").done(function(d) {
                    $("#recommended-video-input").addClass("updated");
                }).fail(function(e) {
                    log(e);
                });
            });


            openAllActive();


            $(".section-name.toggle-button, .chapter-name.toggle-button").click(function() {
                const $nextFoldingDiv = $(this).next();
                const isCurrentlyOpen = $nextFoldingDiv.is(":visible");
                $(this).next().slideToggle(!!(isCurrentlyOpen));
                $(this).next().find(".folding-div").slideToggle(!!(isCurrentlyOpen));
            });


            const numberActiveDisplay = (function() {

                function refresh() {
                    const numberActive = $(".assignment-button.currently-active").length;
                    const numberSemester = $(".assignment-button.current-semester").length;
                    $("#number-active").text(numberActive);
                    $("#number-semester").text(numberSemester + numberActive);
                }

                // calling the function once on instantiation
                refresh();

                return {
                    refresh,
                };
            }());


            $("#texts-sortable-holder").sortable({
                item: ".text-holder",
                stack: ".text-holder",
                containment: "parent",
                stop: sendData
            });


            function sendData() {


                const allTextIDs = $(".text-holder").map(function() {
                    return $(this).data("text_id");
                }).get() || [];


                const recommendedTextIDs = $(".kyoushitsu-recommended").map(function() {
                    return $(this).closest(".text-holder").data("text_id");
                }).get() || [];


                $.post("active_assignment_stuff", {
                    job: "refresh_data",
                    item_key: "text_id",
                    ids: allTextIDs,
                    recommended_text_ids: recommendedTextIDs || [],
                }).fail(function(d) {
                    log("Failed!");
                    log(d);
                });
            }


            // making the chapter-holders sortable
            $(".text-holder").sortable({
                items: ".chapter-holder",
                stack: ".chapter-holder",
                axis: "y",
                containment: "parent",
                stop: function() {


                    const textID = $(this).data("text_id");
                    const chapterIDs = $(this).find(".chapter-holder").map(function() {
                        return $(this).data("chapter_id");
                    }).get();


                    $.post("active_assignment_stuff", {
                        job: "refresh_data",
                        ids: chapterIDs,
                        item_key: "chapter_id",
                        group: { name: "text_id", value: textID },
                    }).fail(d => log(d));
                }
            });


            // making sections sortable
            $(".chapter-holder").sortable({
                items: ".section-block",
                stack: ".section-block",
                axis: "y",
                containment: "parent",
                stop: function() {


                    const chapterID = $(this).data("chapter_id");
                    const sectionIDs = $(this).find(".section-block").map(function() {
                        return $(this).data("section_id");
                    }).get();


                    $.post("active_assignment_stuff", {
                        job: "refresh_data",
                        ids: sectionIDs,
                        item_key: "section_id",
                        group: {
                            name: "chapter_id",
                            value: chapterID
                        },
                    }).fail(d => log(d));
                }
            });


            $(".assignment-buttons-holder").sortable({
                items: ".assignment-button",
                stack: ".assignment-button",
                stop: function() {


                    const sectionID = $(this).data("section_id");
                    const assignmentIDs = $(this).find(".assignment-button").map(function() {
                        return $(this).data("assignment_id");
                    }).get();


                    $.post("active_assignment_stuff", {
                        job: "refresh_data",
                        ids: assignmentIDs,
                        item_key: "assignment_id",
                        group: {
                            name: "section_id",
                            value: sectionID
                        },
                    }).fail(d => log(d));
                }
            });


            // wiring up the .toggle-dot-holder
            $(".toggle-dot").click(function(e) {

                e.stopPropagation();

                const $this = $(this);
                const set_to = $this.data("set_to");

                const button_assignment_ids = $(this).closest(".section-name").next(".assignment-buttons-holder").find(".assignment-button").map(function() {
                    return $(this).data("assignment_id");
                }).get();

                const data = {
                    job: "toggle_active_state",
                    assignment_ids: button_assignment_ids,
                    set_to: set_to
                };

                // calling toggleActiveState, passing in ALL the assignment_ids from the enclosed assignment buttons
                toggleActiveState(data);
            });


            // wiring up the buttons to slide open stuff under them
            $(".text-name").click(function(e) {

                // not opening the div, but rather toggling "kyoushitsu-recommended" class if Shift is pressed
                if (e.shiftKey) {
                    $(this).toggleClass("kyoushitsu-recommended");
                    sendData();
                } else {
                    toggle({ button: this, slide: true });
                }
            });


            // wiring up the assignment-buttons
            // cycling:  ".current-semester" -> ".currently-active" -> nothing;
            $(".assignment-button").click(function(e) {

                // jump to admin on Shift-Click
                if (e.shiftKey) {
                    window.location = "admin?assignment_id=" + $(this).data("assignment_id");
                    return;
                }

                const array = [$(this).data("assignment_id")];
                const data = {
                    job: "toggle_active_state",
                    assignment_ids: array
                };

                toggleActiveState(data);
            });


            function toggleActiveState(data) {


                $.post("active_assignment_stuff", data).done(function(setValue) {


                    data.assignment_ids.forEach(function(id) {


                        const $button = $(".assignment-button[data-assignment_id=" + id + "]");
                        $button.removeClass("currently-active current-semester");


                        if (setValue === "semester") {
                            $button.addClass("current-semester");
                        } else if (setValue === "currently_active") {
                            $button.addClass("currently-active");
                        }
                    });


                    numberActiveDisplay.refresh();

                }).fail(function(d) {
                    log(d);
                });
            }


            function toggle(obj = {}) {
                $(obj.button).next().slideToggle();
                $(obj.button).next().find(".folding-div").slideToggle();
            }


            // wiring up the #kyoushitsu-selector
            $("#kyoushitsu-selector").change(function() {

                const kyoushitsu = $(this).val();
                const data = {
                    job: "set_selected_kyoushitsu_in_session",
                    kyoushitsu: kyoushitsu
                };

                // disabling and fading the #kyoushitsu-selector, until page reload
                $("body").addClass("now-ajaxing");

                // sending the ajax request
                $.post("active_assignment_stuff", data).done(function(d) {
                    sessionStorage.activeSections_hasJustReloaded = true;
                    localStorage.admin_current_selected_kyoushitsu = kyoushitsu;
                    location.reload();
                }, "json").fail(function(dataBack) {
                    localStorage.removeItem("admin_current_selected_kyoushitsu");
                    log("Error returning from active_section_stuff");
                    log(dataBack.responseText);
                });
            });


            // the open-all/close-all button
            (function() {

                const $closeAllButton = $("#close-all-button");
                const openText = $closeAllButton.text();
                const closedText = "Open Active";

                let nowOpen = true;

                function closeAll() {
                    $(".folding-div").slideUp();
                    nowOpen = false;
                    $closeAllButton.text(closedText);
                }

                function openAll() {
                    openAllActive();
                    $closeAllButton.text(openText);
                    nowOpen = true;
                }

                $closeAllButton.click(function() {
                    nowOpen ? closeAll() : openAll();
                });
            }());


            // pre-opening any .folding-divs which have ".current-semester" or ".currently-active" elements in them
            function openAllActive() {

                $(".folding-div").each(function() {

                    const $this = $(this);
                    const anyCurrentlyActive = $this.find(".assignment-button.currently-active").length;
                    const anyCurrentSemester = $this.find(".assignment-button.current-semester").length;

                    if (anyCurrentlyActive || anyCurrentSemester) {
                        $this.show("fast");
                    }
                });
            }


            // reloading automatically if localStorage says that something has changed
            $(window).focus(function() {
                if (localStorage.reloadActiveAssignments) {
                    localStorage.removeItem("reloadActiveAssignments");
                    window.location.reload();
                }
            });
        });
    });