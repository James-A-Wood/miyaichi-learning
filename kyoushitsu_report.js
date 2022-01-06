/* jshint expr: true */


define(
    [
        "jquery",
        "helpers/chatManager",
        // "helpers/UserImage",
        "libraries/clipboard.min",
        "tools",
        "Konva"
    ],
    function (
        $,
        myChatManager,
        // UserImage,
        Clipboard,
        tools,
        Konva
    ) {


        $(function () {


            const $buttonsHolder = $("#buttons-holder");
            const $reportTable = $("#reportTable");
            const chatManager = myChatManager();
            const isMobile = tools.isMobile();
            const clipboardable = [
                ".ban",
                ".lastname",
                ".num_user_unique_submitted_in_active",
                ".num_user_unique_submitted_in_semester",
                ".overall_grade"
            ];


            let myJSON;


            const batchAddUsers = (function () {


                const $button = $("#batch-add-users-button");
                const $textArea = $("#batch-add-users-textarea");


                $button.click(function () {

                    $textArea.val().split("\n").forEach(item => {

                        item = item.split("\t");

                        const userData = {
                            nen: item[0],
                            kumi: item[1],
                            ban: item[2],
                            lastname: item[3],
                            firstname: item[4],
                            username: item[5],
                            password: item[6],
                            password_again: item[6],
                            honkou_seito: 1,
                            school: "中学校", // hardcoded, klugey...
                            course: kyoushitsuSelector.getValue(),
                            code: 999,
                        };


                        $.post("/register_new_user", userData).done(d => {
                            log(d);
                        }, "json").fail(d => {
                            log("Failed!");
                            log(d);
                        });
                    });
                });


                return {
                    //
                };
            }());


            const settings = (function () {


                $(".datepicker").datepicker();


                $("#kyoushitsu-settings-holder input").on("focus", function () {
                    $(this).removeClass("updated");
                }).on("change", function () {
                    const $this = $(this);
                    $.post("/kyoushitsu_stuff", {
                        job: "set_settings",
                        kyoushitsu_id: kyoushitsuSelector.getValue(),
                        value: $this.val(),
                        column: $this.data("column")
                    }).done(function (e) {
                        $this.addClass("updated");
                    }).fail(function (d) {
                        console.log("set_settings failed!");
                        console.log(d);
                    });
                });


                function set(obj) {
                    for (let column in obj) {
                        let id = column;
                        let value = obj[column];
                        $("#" + id).val(value);
                    }
                }


                return {
                    set,
                };
            }());


            new Clipboard("#copy-to-clipboard-button", {
                text: function (trigger) { // "trigger" is the button itself - not used here!
                    const $textArea = $("<textarea />");
                    $reportTable.find(".clipboardable:visible").each(function () {
                        const $td = $(this);
                        const value = $td.text().trim();
                        const separator = ($td.nextAll(".clipboardable").length) ? "\t" : "\n";
                        $textArea.val($textArea.val() + value + separator);
                    });
                    return $textArea.val();
                }
            });


            // names and labels, in the order they are to appear
            // "process" (optional) is a function that gets called when the cell value is added
            const columns = (function () {


                const timeSettings = {
                    hoursTag: "h ",
                    minutesTag: "m ",
                    secondsTag: "s",
                    useLeadingZeroes: false
                };


                const $trophyMaster = $(".perfect-trophy").detach().removeClass("my-template");


                return [
                    {
                        name: "nen",
                        process: (function () {
                            // adding numbers so we can sort by the original order (nen-kumi-ban)
                            let counter = 0;
                            return function (value, $cell) {
                                $cell.data({ sort_by: counter++ });
                            };
                        }())
                    },
                    { name: "kumi" },
                    { name: "ban" },
                    { name: "level", hideAtStartup: true },
                    { name: "honkou_seito", hideAtStartup: true },
                    { name: "lastname" },
                    { name: "firstname" },
                    { name: "username", hideAtStartup: isMobile },
                    {
                        name: "num_user_unique_submitted",
                        hideAtStartup: true,
                        process: function (value, $cell) {
                            $cell.data({ sort_by: value });
                        }
                    },
                    {
                        name: "num_user_total_submitted",
                        hideAtStartup: true,
                        process: function (value, $cell) {
                            $cell.data({ sort_by: value });
                        }
                    },
                    {
                        name: "overall_grade",
                        process: function (value, $cell, thisUser) {

                            const avgTime = (function () {

                                const minutesPerWeek = myJSON.settings.gambari_minutes_per_week;
                                const numWeeks = Object.keys(thisUser.gambari_by_week).length;
                                let totalMinutes = 0;

                                for (let key in thisUser.gambari_by_week) {
                                    let minutesDone = thisUser.gambari_by_week[key].total / 60; // convert second to minutes
                                    minutesDone = Math.min(minutesPerWeek, minutesDone); // discarding any minutes over 20 over the limit
                                    totalMinutes += minutesDone;
                                }

                                if (!minutesPerWeek) return 0;
                                const average = (totalMinutes / numWeeks) / minutesPerWeek;
                                return Math.min(average, 1);
                            }());

                            const avgAssignmentsCompleted = (function () {
                                let userNumDone = thisUser.num_user_unique_submitted_in_semester;
                                let total = myJSON.total_num_assignments_in_semester;
                                return total ? (userNumDone / total) : 0;
                            }());

                            let average = (avgTime + avgAssignmentsCompleted) / 2;
                            average = Math.min(average, 1);
                            const finalPercent = Math.round(average * 100) / 100;

                            $cell.text(finalPercent);
                        }
                    },
                    {
                        name: "trophy",
                        hideAtStartup: false,
                        process: function (isTrophy, $cell) {
                            $cell.data({ sort_by: isTrophy ? 0 : 1 }).text("");
                            isTrophy && $cell.addClass("all-perfect").append($trophyMaster.clone());
                        }
                    },
                    {
                        name: "bar_graph_holder",
                        hideAtStartup: false,
                        process: function (totalSeconds, $cell, thisUser) {

                            // getting the formatted time, via the tools function
                            $cell.data({ sort_by: totalSeconds });

                            // cycling through the weekly data, adding one bar for each week
                            const weeksData = thisUser.gambari_by_week;

                            // NEW TEST doing this with Konva
                            const containerWidth = 300;
                            const containerHeight = 40;

                            const stage = new Konva.Stage({
                                height: containerHeight,
                                width: containerWidth,
                                container: $cell[0]
                            });
                            const layer = new Konva.Layer().moveTo(stage);
                            const numWeeks = Object.keys(weeksData).length;
                            const barWidth = containerWidth / numWeeks;

                            for (const thisWeeksData in weeksData) {

                                const data = weeksData[thisWeeksData];
                                const barCounter = Object.keys(weeksData).indexOf(thisWeeksData);
                                const weekTotalSeconds = data.total;
                                const minutes = weekTotalSeconds / 60; // converting to minutes
                                const minutesPerWeek = myJSON.settings.gambari_minutes_per_week;
                                let barHeight = (minutes / minutesPerWeek) * containerHeight;
                                barHeight = Math.min(barHeight, containerHeight); // keeping it under 100%

                                const bar = new Konva.Rect({
                                    x: barCounter * barWidth,
                                    y: containerHeight - barHeight,
                                    height: barHeight,
                                    width: barWidth,
                                    fill: "lightblue"
                                });

                                const background = new Konva.Rect({
                                    x: barCounter * barWidth,
                                    y: 0,
                                    width: barWidth,
                                    height: containerHeight,
                                    fill: "white",
                                    stroke: "rgb(240, 240, 240)",
                                    strokeWidth: 1
                                });

                                const label = new Konva.Text({
                                    text: parseInt(barHeight / containerHeight * 100) + "%",
                                    fontSize: 10,
                                    fill: "darkblue",
                                    x: barCounter * barWidth + (barWidth / 2)
                                });
                                while (label.width() > barWidth * 0.9) {
                                    label.fontSize(label.fontSize() * 0.95);
                                }
                                label.y(containerHeight - label.height());
                                label.offsetX(label.width() / 2);

                                layer.add(background, bar, label).draw();

                                // let imgURL = $($cell[0]).find("canvas").toDataURL("png");
                                // $($cell[0]).find("canvas").replaceWith("<img src='" + imgURL + "'>");
                                //
                                //
                                //
                                // let data = weeksData[thisWeeksData];
                                // let weekTotalSeconds = data.total;
                                // let minutes = weekTotalSeconds / 60; // converting to minutes
                                // let minutesPerWeek = myJSON.settings.gambari_minutes_per_week;
                                // let barHeightPercent = (minutes / minutesPerWeek) * 100;
                                // barHeightPercent = Math.min(barHeightPercent, 100); // keeping it under 100%
                                //
                                //
                                // // cloning a bar, setting its width, and appending it to the $cell
                                // let $barClone = $barHolderMaster.clone().css({
                                //     width: (100 / Object.keys(weeksData).length) + "%"
                                // }).appendTo($cell);
                                //
                                //
                                // // adding the raw percent (e.g. "87%") to the bottom of the bar
                                // $barClone.find(".number-holder").text(Math.round(barHeightPercent) + "%");
                                //
                                //
                                // // adding the bar itself, and the text to the little hover-window
                                // let text = "Total: " + tools.secondsToHMS(weekTotalSeconds, timeSettings) + "<br>Week of:<br>" + thisWeeksData.split(" ")[0];
                                // $barClone.find(".bar").css({
                                //     height: barHeightPercent + "%"
                                // }).find(".text-holder").html(text);
                            }

                            tools.konvaLayerToImage(layer);
                        }
                    },
                    { name: "controls", hideAtStartup: isMobile },
                    { name: "change_kyoushitsu", hideAtStartup: true },
                    { name: "id", hideAtStartup: true },
                    {
                        name: "num_user_unique_submitted_in_active",
                        process: function (value, $cell) {
                            $cell.data({ sort_by: value });
                        }
                    },
                    {
                        name: "num_user_unique_submitted_in_semester",
                        process: function (value, $cell) {
                            $cell.data({ sort_by: value });
                        }
                    },
                    {
                        name: "gambari_time",
                        process: function (value, $cell) {
                            $cell.data({ sort_by: value }).text(tools.secondsToHMS(value, timeSettings));
                        }
                    }
                ];
            }());


            const kyoushitsuSelector = (function () {


                const $kyoushitsuSelector = $("#kyoushitsu-selector");
                const $kyoushitsuLoading = $("#kyoushitsu-loading");
                const $kyoushitsuSelectorForm = $("#kyoushitsu-selector-form");
                const $changeOrderButton = $kyoushitsuSelectorForm.find(".change-order-button");
                const $reorderStuff = $("#select-box-option-reorder-stuff");
                const $reorderItemsHolder = $reorderStuff.find(".items-holder");


                $(document).on("keydown", e => {
                    if (e.which === 27) {
                        $reorderItemsHolder.empty();
                        $reorderStuff.removeClass("showing");
                    }
                });


                // adding sortability top options
                $changeOrderButton.on("click", function () {
                    $reorderStuff.addClass("showing");
                    $reorderItemsHolder.empty().sortable({
                        axis: "y",
                        stop: sendOptionsReorderRequest,
                    });
                    kyoushitsuSelector.getIdsAndValues().forEach(function (item) {
                        const $option = $(`<p data-value="${item.value}">${item.text}</p>`);
                        item.value && $option.appendTo($reorderItemsHolder);
                    });
                });


                function sendOptionsReorderRequest() {
                    $.post("kyoushitsu_stuff", {
                        job: "reorder_kyoushitsus",
                        ids_in_order: $reorderItemsHolder.find("p").map(function () {
                            return $(this).data("value");
                        }).get(),
                    }).done(reorderOptions).fail(d => log(d));
                }


                function reorderOptions() {
                    $reorderItemsHolder.find("p").each(function () {
                        const value = parseInt($(this).data("value"));
                        $kyoushitsuSelector.find("option").filter(function () {
                            return parseInt($(this).val()) === value;
                        }).appendTo($kyoushitsuSelector);
                    });
                }


                // wiring up the #kyoushitsu-selector to submit the form on change, and saving its value in localStorage
                $kyoushitsuSelector.change(function (e) {


                    if (!getValue()) {
                        table.empty();
                        return;
                    }


                    e.preventDefault();
                    localStorage.admin_current_selected_kyoushitsu = getValue();


                    // showing the little "loading" GIF, and disabling the picker
                    $kyoushitsuLoading.show();
                    $kyoushitsuSelectorForm.find("select").prop({ disabled: true });
                    $("#num-user-rows").text("");


                    const data = { kyoushitsu: getValue() };
                    if (!data.kyoushitsu) return false;
                    $reportTable.empty();


                    $.getJSON("/get_submitted_by_kyoushitsu", data).done(function (d) {


                        if (!d || !d.usersData) {
                            $reportTable.append("<tr><td>No data for that kyoushitsu!</td></tr>");
                            return false;
                        }


                        myJSON = d;
                        $("body").removeClass("hide-some-stuff");


                        // setting values of the "active_from", "active_to", and "gambari_minutes_per_week" inputs
                        settings.set(myJSON.settings);


                        // building the table if any data was returned, or else displaying a message
                        myJSON.usersData.length > 0 ? table.build(myJSON) : $reportTable.append("<tr><td>No data for that kyoushitsu!</td></tr>");


                        // in any case, hiding the little "loading" icon
                        $kyoushitsuLoading.hide();
                        $("#kyoushitsu-selector-form select").prop({ disabled: false });


                        displayManager.refreshDisplay();

                    }).fail(function (d) {
                        console.log("get_submitted_by_kyoushitsu failed!");
                        console.log(d);
                    });
                });


                function change() {
                    $kyoushitsuSelector.change();
                }


                function getOptions() {
                    return $kyoushitsuSelector.find("option").clone();
                }


                function getValue() {
                    return $kyoushitsuSelector.val();
                }


                function setValue(newValue) {
                    $kyoushitsuSelector.val(newValue);
                }


                function disable() {
                    $kyoushitsuSelector.prop("disabled", true);
                }


                function enable() {
                    $kyoushitsuSelector.prop("disabled", false);
                }


                function updateSelectedOption(newText) {
                    $kyoushitsuSelector.find("option:selected").text(newText);
                }


                function getIdsAndValues() {
                    return $kyoushitsuSelector.find("option").map(function () {
                        return {
                            value: $(this).prop("value"),
                            text: $(this).prop("text"),
                        };
                    }).get();
                }


                return {
                    getValue,
                    setValue,
                    disable,
                    enable,
                    updateSelectedOption,
                    change,
                    getOptions,
                    getIdsAndValues,
                };
            }());


            const table = (function () {


                const $rowTemplate = $reportTable.find(".my-row-template").detach().removeClass("my-row-template");
                const $headerTemplate = $("#header-row").detach().removeClass("my-template");
                const $buttonTemplate = $buttonsHolder.find(".my-template").detach().removeClass("my-template");


                // adding the buttons
                $headerTemplate.find("th").each(function () {
                    const text = $(this).text();
                    const column_to_toggle = $(this).data("column_to_toggle");
                    const $button = $buttonTemplate.clone();
                    $button.text(text).data({ column_to_toggle: column_to_toggle }).addClass(column_to_toggle);
                    $buttonsHolder.append($button);
                });


                // private function
                function getNumDisplayedRows() {
                    return $reportTable.find(".user-row:visible").length;
                }


                function build(d) {


                    const users = d.usersData;
                    const total_num_active_assignments = d.total_num_active_assignments;
                    const total_num_assignments_in_semester = d.total_num_assignments_in_semester;


                    $reportTable.append($headerTemplate);


                    // adding the numbers to headers
                    $reportTable.find("th.num_user_unique_submitted_in_active .number").text(total_num_active_assignments);
                    $reportTable.find("th.num_user_unique_submitted_in_semester .number").text(total_num_assignments_in_semester);


                    users.forEach(thisUser => {


                        const $newRow = $rowTemplate.clone();
                        clipboardable.forEach(thisClass => {
                            $newRow.find(thisClass).addClass("clipboardable");
                        });


                        $newRow.find(".lastname, .firstname, .username").on("click", function (event) {


                            const lastname = $(this).parent().find(".lastname").text();
                            const firstname = $(this).parent().find(".firstname").text();
                            const username = $(this).parent().find(".username").text();


                            chatManager.uploadAdminMessage({
                                event: event,
                                user_id: thisUser.id,
                                lastname: lastname,
                                firstname: firstname,
                                username: username
                            });
                        });


                        // changing the value when double-clicking the cell
                        $newRow.find("td.nen, td.kumi, td.ban, td.honkou_seito, td.level").dblclick(function () {
                            updateUserData($(this), thisUser.id);
                        });


                        // adding options to the "change_kyoushitsu" selector, and wiring up the change event listener
                        $newRow.find(".change_kyoushitsu select").append(kyoushitsuSelector.getOptions()).val(kyoushitsuSelector.getValue()).on("change", function () {
                            const $this = $(this);
                            $.post("admin_update_user_info", {
                                user_id: thisUser.id,
                                column: "kyoushitsu_id",
                                new_value: $this.val()
                            }, function (d) {
                                $this.val(d.new_value);
                            }, "json");
                        });


                        // adding the content to each cell
                        columns.forEach(thisColumn => {


                            const contentForThisUser = thisUser[thisColumn.name];
                            const $cell = $newRow.find("." + thisColumn.name);


                            $cell.text(contentForThisUser);
                            thisColumn.process && thisColumn.process(contentForThisUser, $cell, thisUser);
                        });


                        if ($newRow.find(".honkou_seito").text() !== "1") {
                            $newRow.addClass("not-honkou-seito");
                        }


                        $newRow.find(".change-password-button").on("click", function () {


                            const name = $(this).closest("tr").find(".lastname").text();
                            let newPassword = window.prompt("New password for " + name + "?");
                            if (!newPassword) { return; }


                            newPassword = newPassword.trim();
                            if (!newPassword) return false;


                            let confirm = window.confirm("New password for " + name + " :\n\n" + newPassword + "\n\nOkay?");
                            if (!confirm) return false;


                            $.post("/admin_change_user_password", {
                                new_password: newPassword,
                                user_id: thisUser.id
                            }, "json").done(function (d) {
                                alert("New password for " + name + " is: \n\n" + newPassword);
                            }).fail(function (d) {
                                alert("Failed?");
                            });
                        });


                        $newRow.find(".login-user-button").on("click", function () {
                            $.post("/login_user_from_kyoushitsu_report", {
                                user_id: thisUser.id
                            }).done(function () {
                                window.open(window.location.protocol + "//" + window.location.host);
                            }).fail(function (d) {
                                console.log(d);
                            });
                        });


                        $reportTable.append($newRow);
                    });


                    // hiding some columns on startup, if specified
                    // doing this by triggering the click event on each one
                    columns.forEach(thisColumn => {
                        if (thisColumn.hideAtStartup) {
                            $reportTable.find("th").filter(function () {
                                return ($(this).data("column_to_toggle") === thisColumn.name);
                            }).each(function (e) {
                                displayManager.thClickHandler($(this), e, false); // false => don't refresh the display
                            });
                        }
                    });


                    displayManager.refreshDisplay();
                }


                function empty() {
                    $reportTable.empty();
                }

                return {
                    build,
                    empty,
                    getNumDisplayedRows
                };
            }());


            const trophyHandler = (function () {


                function getNumberTrophies() {
                    return $("td.trophy.all-perfect").length;
                }


                function displayNumberTrophies() {
                    let number = getNumberTrophies();
                    $("th.trophy .number").text(number);
                }


                return { displayNumberTrophies };
            }());


            // wiring up the new-kyoushitsu-button
            $("#new-kyoushitsu-button").on("click", function () {
                $("#new-kyoushitsu-inputs-holder").find("input").val("");
                $("#new-kyoushitsu-inputs-holder").slideToggle();
            });


            $("#create-new-kyoushitsu-form").submit(function (e) {


                e.preventDefault();


                $("#server-messages").empty();


                const code = $("#new-kyoushitsu-code").val();
                const title = $("#new-kyoushitsu-title").val();
                const description = $("#new-kyoushitsu-description").val();


                const onlyNumbers = /^[0-9]+$/; // same as new RegExp('^\\d+$');
                if (!onlyNumbers.test(code)) {
                    alert("Code must be a number!");
                    $("#new-kyoushitsu-code").val("");
                    return false;
                }


                const data = {
                    job: "create_new_kyoushitsu",
                    code: parseInt(code)
                };


                // appending title and description, if present
                if (title) { data.title = title; }
                if (description) { data.description = description; }


                $.getJSON("/kyoushitsu_stuff", data).done(function (d) {

                    // displaying any errors and exiting
                    for (const field in d) {
                        d[field].forEach(thisMessage => $("#server-messages").append($("<p/>").text(thisMessage)));
                        return;
                    }


                    window.location.reload();
                }).fail(function (d) {
                    console.log("Failed making the new kyoushitsu!");
                    console.log(d);
                    d.code.forEach(messages => {
                        console.log(messages);
                    });
                });
            });


            function updateUserData($thisCell, userID) {


                $thisCell.addClass("now-changing");


                const currentValue = $thisCell.text();
                let newValue = window.prompt("New value?", currentValue);
                newValue && newValue.trim();


                $.post("admin_update_user_info", {
                    user_id: userID,
                    column: $thisCell.data("column"),
                    new_value: newValue
                }, function (d) {
                    $thisCell.removeClass("now-changing");
                    if (d && d.new_value) {
                        $thisCell.text(d.new_value);
                        return false;
                    }
                }, "json").fail(function (d) {
                    console.log("admin_update_user_info failed!");
                    console.warn(d);
                });
            }


            let displayManager = (function () {


                // to hold the names of the hidden columns
                const showForPrinting = ["ban", "lastname", "num_user_unique_submitted_in_active", "num_user_unique_submitted_in_semester"];
                let columnsToHide = {};
                let topToBottom = "up";


                // wiring up the various inputs to change values and refresh the display
                $buttonsHolder.find("button").on("click", showThisColumn);
                $(document).on("click touchend", "#reportTable th", function (e) {
                    thClickHandler($(this), e, true);
                });
                $("#show-hidden-users").on("change", refreshDisplay);


                // showing only those columns to copy and paste into Excel
                function printMode() {
                    columnsToHide = {};
                    columns.forEach(thisColumn => {
                        if (showForPrinting.indexOf(thisColumn.name) === -1) {
                            columnsToHide[thisColumn.name] = true;
                        }
                    });
                    refreshDisplay();
                }


                function refreshDisplay() {


                    // (1 of 3)  showing all rows and columns, before hiding selected data below
                    showEverything();


                    // (2 of 3) hiding any COLUMNS that should be hidden, and displaying the corresponding button
                    for (const thisColumn in columnsToHide) {
                        $reportTable.find("." + thisColumn).hide();
                        $buttonsHolder.find("button").filter(function () {
                            return $(this).data("column_to_toggle") === thisColumn;
                        }).show();
                    }


                    // (3 of 3) hiding non-students, depending on checkbox
                    hideNonStudents();
                    showNumberUsers();
                    trophyHandler.displayNumberTrophies();
                }


                function showNumberUsers() {
                    $("#num-user-rows").text("Rows: " + (table.getNumDisplayedRows() ? table.getNumDisplayedRows() : "-"));
                }


                function showEverything() {
                    $reportTable.find("tr, td, th").show();
                    $reportTable.find("#header-row").show();
                    $buttonsHolder.find("button").hide();
                }


                function sortRows($target) {


                    const $parentTable = $("#reportTable");
                    const cellClassToSort = "." + $target.data("column_to_toggle");


                    $(".sorted").removeClass("sorted");


                    // building an array of all the table cells (have to convert to a real array, not jQuery collection...)
                    // NOTE that we're ignoring hidden cells -- usually non-students, which are hidden by default
                    const array = $parentTable.find("tr:visible").not("#header-row").toArray();
                    const sortDirection = (topToBottom) ? [-1, 1] : [1, -1];
                    topToBottom = !topToBottom;


                    array.sort(function (a, b) {
                        const val1 = parseInt($(a).find(cellClassToSort).data("sort_by"));
                        const val2 = parseInt($(b).find(cellClassToSort).data("sort_by"));
                        return (val1 < val2) ? sortDirection[0] : (val1 > val2) ? sortDirection[1] : 0;
                    });


                    // finally, appending the rows in their new order
                    array.forEach(thisTR => {
                        $("#reportTable").append($(thisTR));
                    });


                    // formatting the newly-ordered cells
                    $(cellClassToSort).addClass("sorted");


                    return true;
                }


                function thClickHandler($this, e, doRefreshDisplay) {

                    const $target = $(e.target);

                    // if it was the "sort-trigger" that was clicked, then sorting and exiting here
                    if ($target.parents(".sort-trigger").length) return sortRows($target.closest("th"));

                    // beyond this point, we're not sorting but toggling the column
                    const thisColumn = $this.data("column_to_toggle");
                    columnsToHide[thisColumn] = true;
                    doRefreshDisplay && refreshDisplay();
                }


                function showThisColumn() {
                    const thisColumn = $(this).data("column_to_toggle");
                    delete columnsToHide[thisColumn];
                    refreshDisplay();
                }


                function hideNonStudents() {
                    if (!$("#show-hidden-users").is(":checked")) {
                        $reportTable.find("tr").filter(function () {
                            return $(this).find("td.honkou_seito").text() === "0";
                        }).hide();
                    }
                    showNumberUsers();
                }


                return {
                    refreshDisplay,
                    printMode,
                    thClickHandler
                };
            }());


            // wiring up the toggleHiddenUsers checkbox
            $("#show-hidden-users").on("change", displayManager.toggleHiddenUsers);


            $("#kyoushitsu-selector-form .change-name-button").click(change_kyoushitsu_title);

            function change_kyoushitsu_title() {


                let id = kyoushitsuSelector.getValue();
                let previousTitle = $("#kyoushitsu-selector option:selected").text();
                let $this = $(this);


                if (!id) return;


                let title = window.prompt("New kyoushitsu name?", previousTitle);
                if (!title) return false;
                title = title.trim();
                if (!title || title === previousTitle) return false;


                // temporarily disabling the button and selector
                $this.off("click", change_kyoushitsu_title);
                kyoushitsuSelector.disable();


                const data = {
                    job: "change_kyoushitsu_title",
                    id: id,
                    title: title
                };


                // sending the request
                $.post("/kyoushitsu_stuff", data).done(function () {
                    kyoushitsuSelector.enable();
                    kyoushitsuSelector.updateSelectedOption(title);
                }).fail(function (d) {
                    console.log(d);
                }).always(function () {
                    $this.off("click", change_kyoushitsu_title).on("click", change_kyoushitsu_title);
                });
            }


            // reloading the old value from localStoage, if present
            if (localStorage.admin_current_selected_kyoushitsu) {
                kyoushitsuSelector.setValue(parseInt(localStorage.admin_current_selected_kyoushitsu));
                kyoushitsuSelector.change();
            }


            $("#clear-gambari-jikan").on("click", clearGambariJikan);

            function clearGambariJikan() {
                $("#clear-gambari-jikan").prop("disabled", true);
                if (tools.doubleConfirm("Clear gambari jikann for this kyoushitsu?")) {
                    $.post("report_stuff", {
                        job: "clear_gambari_jikan_for_kyoushitsu",
                        kyoushitsu: kyoushitsuSelector.getValue()
                    }).done(function (d) {
                        location.reload();
                    }).always(function () {
                        $("#clear-gambari-jikan").prop("disabled", false);
                    });
                } else {
                    $("#clear-gambari-jikan").prop("disabled", false);
                }
            }



            // NEW TEST
            $("#show-group-change-form").on("click", function () {
                $(this).next().toggle();
            });


            $("#group-change-form").on("submit", function (e) {


                e.preventDefault();
                let rawData = $("#data-input").val();
                const students = rawData.split("\n");


                const studentData = students.map(function (string) {

                    const pieces = string.split("\t");
                    const name = pieces[3].replace(/\s+/gi, " "); // replace 全角 space with 半角, also multiple spaces with a single one
                    const lastname = name.split(" ")[0];
                    const firstname = name.split(" ")[1];

                    return {
                        firstname,
                        lastname,
                        nen: pieces[0],
                        kumi: pieces[1],
                        ban: pieces[2],
                    };
                });


                $.post("user_stuff", {
                    job: "update_class_nen_kumi_ban",
                    student_data: studentData
                }).done(function (e) {
                    window.location.reload();
                }).fail(function (e) {
                    console.log("Failed?");
                    console.log(e);
                });
            });


            $("#print-button").on("click", function () {
                $(".bar_graph_holder").find("canvas").each(function () {
                    let imgURL = this.toDataURL("png");
                    console.log(imgURL);
                    $(this).parent().empty().append("<img src='" + imgURL + "'>");
                });
            });
        });
    }
);
