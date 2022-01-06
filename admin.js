/* jshint expr: true */


define(
    [
        "jquery",
        "helpers/lineNumbering",
        "admin/assignmentBlock",
        "admin/templateDefaults",
        "tools",
        "helpers/audioRecorder",
        "jqueryui"
    ],
    function(
        $,
        lineNumbering,
        assignmentBlockFactory,
        templateDefaults,
        tools,
        newAudioRecorder
    ) {


        $(function() {


            tools.page.rememberScroll();


            // making numbering (and renumbering) easier
            const problemNumbers = lineNumbering(".assignment-number");
            const $createNewAssignmentButton = $("#create-new-assignment-button");


            let newAssignmentBlock;


            // common funcionality for all of the text/chapter/section buttons
            const buttonFactory = (function() {


                const $folderIcon = tools.makeTemplate(".my-template.folder-icon");


                return function(params) {


                    /*

                     params = {
                     -   parent: the jQuery object to append the new icon to,
                     -   class: class for the new icon to have,
                     -   localStorageKey: the local storage thing in which to store the value
                     -   onClick: a function (like "retrieveDataFor") to execute when clicked
                     }

                     */


                    if (!params || !params.parent || !params.class || !params.localStorageKey) {
                        log("buttonFactory got some bad parameters!");
                        return false;
                    }


                    return function(inputs) {


                        if (!inputs) {
                            log("buttonFactory requires an object with properties id, activeState, and name!");
                            return false;
                        }


                        const id = inputs.id;
                        const activeState = inputs.activeState;
                        const name = inputs.name;


                        const $button = $folderIcon.clone().addClass(params.class).addClass(activeState).text(name).data({
                            value: id,
                            table: params.table,
                            column: "name"
                        }).appendTo(params.parent);


                        // pre-selecting the icon, if it's stored in localStorage
                        const localKey = localStorage[params.localStorageKey];
                        localKey === id.toString() && $button.addClass("open").siblings().removeClass("open");


                        $button.click(function() {


                            // when clicked, adding the "open" class, and removing "open" from all siblings
                            $(this).addClass("open").siblings().removeClass("open");


                            // emptying any .folders-rows AFTER the one clicked
                            const $thisSection = $(this).closest(".folders-row");
                            const thisSectionIndex = $(".folders-row").index($thisSection); // getting the number of this .section
                            $(".folders-row").filter(function(index) {
                                return index > thisSectionIndex;
                            }).empty();


                            // saving the id in localStorage, so we can open it again after reloading the page
                            localStorage[params.localStorageKey] = id;


                            params.onClick && params.onClick();
                        });


                        return $button;
                    };
                };
            }());


            const newTextButton = buttonFactory({
                parent: $("#texts-row"),
                class: "text-icon",
                localStorageKey: "last_text_selected",
                table: "Text",
                column: "name",
                onClick: function() {
                    $("main").removeClass("show-assignments");
                }
            });


            const newChapterButton = buttonFactory({
                parent: $("#chapters-row"),
                class: "chapter-icon",
                localStorageKey: "last_chapter_selected",
                table: "Chapter",
                column: "name",
                onClick: function() {
                    $("#chapter-subtitle").removeClass("updated");
                    $("main").removeClass("show-assignments");
                }
            });


            const newSectionButton = buttonFactory({
                parent: $("#sections-row"),
                class: "section-icon",
                localStorageKey: "last_section_selected",
                table: "Section",
                column: "name",
                onClick: function() {
                    $("main").addClass("show-assignments");
                }
            });


            retrieveDataFor({
                table: "Text",
                id: null,
                onFinish: function(data) {


                    // log(data);


                    newAssignmentBlock = assignmentBlockFactory.makeNew(data, templateDefaults);


                    data.texts.forEach(function(text) {

                        const $folder = newTextButton({
                            id: text.id,
                            activeState: null,
                            name: text.name
                        });

                        $folder.click(function() {
                            retrieveDataFor({
                                table: "Chapter",
                                id: $(this).data("value"),
                                onFinish: addChapters
                            });
                        });
                    });

                    // triggering the click event on the open one, so the next chapters are retrieved
                    $(".text-icon.open").click();
                }
            });


            const addChapters = (function() {


                let subtitlesFor = {};


                $("#chapter-subtitle").focus(function() {
                    $(this).removeClass("updated");
                }).change(function() {


                    const $this = $(this);
                    const newValue = $this.val();
                    const id = $(this).closest(".folders-holder").find(".open").data("value");


                    const data = {
                        job: "update_value",
                        changes: [
                            {
                                table: "Chapter",
                                column: "subtitle",
                                newValue: newValue,
                                id: id
                                }
                            ]
                    };


                    $.post("/admin_stuff", data, function() {
                        subtitlesFor[id] = newValue;
                        $this.addClass("updated").blur();
                    }, "json").fail(function(d) {
                        log("Couldn't change the chapter subtitle!");
                        log(d);
                    });
                });


                return function(chapters) {


                    // cycling through all of the chapter data that was returned and building the chapter icons
                    chapters.forEach(function(thisChapter) {


                        const activeState = (thisChapter.active === "on") ? "" : "inactive";


                        // saving subtitle stuff
                        subtitlesFor[thisChapter.id] = thisChapter.subtitle;


                        // building the little button-icon for the current chapter
                        const $chapterIcon = newChapterButton({
                            id: thisChapter.id,
                            activeState: activeState,
                            name: thisChapter.name
                        });


                        $chapterIcon.click(function() {


                            const thisChapterID = $(this).data("value");
                            retrieveDataFor({
                                table: "Section",
                                id: thisChapterID,
                                onFinish: addSections
                            });


                            // placing the subtitle in the #chapter-subtitle input
                            $("#chapter-subtitle").val(subtitlesFor[thisChapterID]);
                        });
                    });


                    // triggering click event on any file that already has the "open" class
                    $(".chapter-icon.open").click();
                };
            }());


            function addSections(data) {


                // appending the options to the #section-selector
                Object.keys(data).forEach(function(i) {


                    const id = data[i].id;
                    const activeState = data[i].active === "off" ? "inactive" : "";


                    let name = data[i].name;


                    if (!name || name === " ") {
                        name = "(unnamed section)";
                    }


                    const $section = newSectionButton({
                        id: id,
                        activeState: activeState,
                        name: name
                    });


                    $section.click(function() {
                        const value = $(this).data("value");
                        retrieveDataFor({
                            table: "Assignment",
                            id: value,
                            onFinish: addAssignments
                        });
                    });
                });


                // pre-clicking the opened section icon
                $(".section-icon.open").click();
            }


            function addAssignments(data) {


                data.forEach(function(thisAssignment) {
                    newAssignmentBlock(thisAssignment);
                });


                assignmentBlockFactory.setOpenState();
                problemNumbers.renumber();
                tools.page.restoreScroll();
            }


            function toggleFolderActive() {


                const $folder = $(this).closest(".folders-holder").find(".open");
                const table = $(this).closest(".folders-holder").data("table");
                const id = $folder.data("value");
                const newValue = $folder.hasClass("inactive") ? "on" : "off"; // turning it "on" if it's inactive


                const changes = {
                    table: table,
                    id: id,
                    column: "active",
                    newValue: newValue
                };


                $.post("/admin_stuff", {
                    job: "update_value",
                    changes: [changes]
                }, function() {
                    $folder.toggleClass("inactive", newValue !== "on");
                }, "json").fail(function(d) {
                    log("Failed updaging the active state");
                    log(d);
                });
            }


            $(".folders-row").sortable({
                revert: 100,
                helper: "clone",
                start: function(event, ui) {
                    // adding a little to the width of the cloned item so text doesn't slide around
                    ui.helper.css("width", ui.item.outerWidth() + 1);
                },
                stop: reorder
            });


            function reorder() {


                // getting the db_ids of the .assignment-holders IN THEIR NEW ORDER!
                const ids = $(this).find(".folder-icon").map(function() {
                    return $(this).data("value");
                }).get();


                $.post("/admin_stuff", {
                    job: "reorder_junban",
                    ids: ids,
                    table: $(this).closest(".folders-holder").data("table")
                }, "json").fail(function(errorData) {
                    log("Reordering failed!");
                    log(errorData);
                });
            }


            // wiring up the create-new-section-button
            $("#create-new-section-button").off("click").click(function() {


                const chapter_id = $("#chapters-holder").find(".open").data("value");


                if (!chapter_id) return;


                const currentSectionName = $(this).closest(".folders-holder").find(".open").text();
                const name = window.prompt("What's the new section's name?", currentSectionName || "");
                const currentNumberSections = $(this).closest(".folders-holder").find(".folder-icon").length;


                if (!name) return;


                $.post("/admin_stuff", {
                    job: "create_new_section",
                    chapter_id: chapter_id,
                    name: name,
                    junban: currentNumberSections + 1
                }, function(d) {
                    const $newIcon = newSectionButton({
                        id: d.id,
                        activeState: (d.active === "off") ? "inactive" : "",
                        name: d.name
                    });
                    $newIcon.click();
                }, "json");
            });


            function createNewAssignment() {


                $createNewAssignmentButton.off("click", createNewAssignment); // temporarily disabling the button

                // checking that we have a section_id
                const section_id = $(".sections-holder").find(".open").data("value");
                if (!section_id) {
                    log("No section selected");
                    return false;
                }


                $.post("/admin_stuff", {
                    job: "create_new_assignment",
                    section_id: section_id,
                    junban: $(".assignment-holder").length + 1
                }, function(d) {
                    newAssignmentBlock(d, { slideDown: true });
                    checkForNewGroups();
                    problemNumbers.renumber();
                    $createNewAssignmentButton.off("click", createNewAssignment).click(createNewAssignment);
                }, "json").fail(function(d) {
                    log("Error creating the new assignment!");
                    log(d);
                });
            }


            function retrieveDataFor(inputs) {


                if (!inputs || typeof inputs !== "object" || !inputs.table || !inputs.onFinish || typeof inputs.onFinish !== "function") {
                    log("Function requires an object with properties 'table', 'id' and a callback 'onFinish'!");
                }


                $.getJSON("/admin_get_data", {
                    table: inputs.table,
                    id: inputs.id
                }).done(function(returnedData) {
                    inputs.onFinish(returnedData);
                }).fail(function(returnedData) {
                    log("retrieveDataFor failed!");
                    log(returnedData);
                });
            }


            $("#create-new-text-button").off("click").on("click", function() {


                const newTextName = window.prompt("New text's name?", "");


                if (!newTextName || !newTextName.trim()) return;


                $.post("/admin_stuff", {
                    job: "create_new_text",
                    name: newTextName.trim(),
                }, function(returnedData) {
                    localStorage.last_text_selected = returnedData;
                    localStorage.last_chapter_selected = "";
                    localStorage.last_section_selected = "";
                    tools.fadeAndReload();
                }, "json");
            });


            $("#create-new-chapter-button").off("click").click(function() {


                const text = $(".texts-holder").find(".open").data("value");
                const numberCurrentChapters = $(this).closest(".folders-holder").find(".folder-icon").length;


                if (!text) return;


                // saving reference to the text, and getting a name from the user
                const currentChapterName = $(this).closest(".folders-holder").find(".open").text();
                const newName = window.prompt("What's the new chapter's name?", currentChapterName || "");


                if (!newName) return;


                const data = {
                    job: "create_new_chapter",
                    text: text,
                    name: newName,
                    junban: numberCurrentChapters + 1
                };


                $.post("/admin_stuff", data, function(d) {
                    localStorage.last_chapter_selected = d;
                    tools.fadeAndReload();
                }, "json");
            });


            function renameItem($folder) {


                const id = $folder.data("value");
                const oldName = $folder.text();
                const table = $folder.closest(".folders-holder").data("table");
                const column = $folder.data("column");
                const newValue = window.prompt("Enter new name:", oldName);


                if (!newValue) return;


                const data = {
                    job: "update_value",
                    changes: [
                        {
                            table: table,
                            id: id,
                            column: column,
                            newValue: newValue
                            }
                        ]
                };


                $.post("/admin_stuff", data, "json").done(function() {
                    $folder.text(newValue);
                }).fail(function(e) {
                    log("Couldn't make the change!");
                    log(e);
                });
            }


            // NEW TEST Left off here!
            $(".copy-to-button").off("click").on("click", function() {
                //
            });


            // moving chapters to different texts
            $(".move-button").off("click").on("click", function() {


                if ($(".move-select").length) {
                    $(".move-select").remove();
                    return;
                }


                const $moveSelect = $("<select class='move-select' />");
                const $texts = $("#texts-holder").find(".text-icon");


                $texts.each(function() {


                    const title = $(this).text();
                    const value = $(this).data("value");
                    const $option = $("<option />").text(title).val(value);
                    $moveSelect.append($option);


                    if ($(this).hasClass("open")) {
                        $option.attr("selected", true);
                    }
                });


                $moveSelect.off("change").on("change", function() {


                    $moveSelect.prop("disabled", true);


                    const $chapterIcon = $("#chapters-holder").find(".chapter-icon.open");
                    const chapter_id = $chapterIcon.data("value");
                    const chapter_name = $chapterIcon.text();
                    const text_id = $(this).val();
                    const text_name = $(this).find("option:selected").text();


                    const confirmed = window.confirm("Really move \n\n" + chapter_name + " to " + text_name + " ?");
                    if (!confirmed) return;


                    const data = {
                        job: "move_element",
                        chapter_id: chapter_id,
                        text_id: text_id
                    };


                    $.post("/admin_stuff", data, function(d) {


                        if (d) {
                            window.location.reload();
                            return;
                        }


                        log(d);
                    }, "json");
                });


                // appending the selector AFTER the Move button
                $(this).after($moveSelect);
                return;
            });


            $("#delete-text-button").off("click").click(function() {


                const $thisIcon = $(this).closest(".folders-holder").find(".open");
                const id = $thisIcon.data("value");


                if ($thisIcon.length === 0 || !tools.doubleConfirm("Really delete this text?")) return;


                $.post("/admin_stuff", {
                    job: "delete_text",
                    id: id
                }, function() {
                    $thisIcon.remove();
                    tools.fadeAndReload();
                }, "json").fail(function(d) {
                    log("Couldn't delete the text!");
                    log(d);
                });
            });


            $("#delete-chapter-button").off("click").click(function() {


                const $thisIcon = $(this).closest(".folders-holder").find(".open");
                const id = $thisIcon.data("value");


                if ($thisIcon.length === 0) return;
                if (!tools.doubleConfirm("Really delete this chapter?")) return;


                $.post("/admin_stuff", {
                    job: "delete_chapter",
                    id: id
                }, function() {
                    $thisIcon.remove();
                    tools.fadeAndReload();
                }, "json").fail(function(d) {
                    log("Couldn't delete the chapter!");
                    log(d);
                });
            });


            $("#delete-section-button").off("click").click(function() {


                const $thisIcon = $(this).closest(".folders-holder").find(".open");
                const id = $thisIcon.data("value");


                if ($thisIcon.length === 0) return;
                if (!tools.doubleConfirm("Really delete this section?")) return;


                $.post("/admin_stuff", {
                    job: "delete_section",
                    id: id
                }, function() {
                    $thisIcon.remove();
                }, "json").fail(function(d) {
                    log("Couldn't delete the section!");
                    log(d);
                });
            });


            // wiring up reordering & activation for the chapters
            $(".rename").off("click").click(function() {
                let $folder = $(this).closest(".folders-holder").find(".open");
                renameItem($folder);
            });


            $("#assignments-holder").sortable({
                items: ".assignment-holder",
                revert: 100,
                axis: "y",
                handle: ".assignment-number",
                helper: "clone",
                stop: function() {


                    const ids = $(this).find(".assignment-holder").map(function() {
                        return $(this).data("db_id");
                    }).get();


                    $.post("/admin_stuff", {
                        job: "reorder_junban",
                        ids: ids,
                        table: "Assignment"
                    }, function() {
                        problemNumbers.renumber();
                    }, "json").fail(function(errorData) {
                        log("Reordering failed!");
                        log(errorData);
                    });
                }
            });


            $createNewAssignmentButton.off("click", createNewAssignment).click(createNewAssignment);


            $(".toggle-active").click(toggleFolderActive);


            function checkForNewGroups() {


                if (!localStorage.newlyCreatedGroups) return;


                const newGroups = JSON.parse(localStorage.newlyCreatedGroups);
                const thisText = $(".text-icon.open").data("value");


                if (!newGroups || !thisText) return;


                const createdGroups = newGroups[thisText] ? newGroups[thisText].created : {};
                const deletedGroups = newGroups[thisText] ? newGroups[thisText].deleted : {};


                $(".data-group-selector").each(function() {


                    // finding whether the option already exists (it shouldn't), and
                    // saving the currently selected option - because it's lost down below
                    const $thisSelector = $(this);
                    const $selectedOption = $thisSelector.find("option:selected");


                    // adding the NEWLY CREATED groups for THIS TEXT
                    for (let groupId in createdGroups) {
                        const optionNotThere = $thisSelector.find("option[value='" + groupId + "']").length === 0;
                        if (optionNotThere) {
                            const groupName = createdGroups[groupId];
                            const $newOptionTag = $("<option />").val(groupId).text(groupName);
                            $thisSelector.append($newOptionTag);
                        }
                    }


                    // removing the DELETED GROUPS for THIS TEXT
                    for (let groupId in deletedGroups) {
                        $thisSelector.find("option[value='" + groupId + "']").remove();
                    }


                    // SORTING THE OPTIONS (including any newly added ones) - cool!
                    const $options = $thisSelector.find("option").detach().sort(function(a, b) {
                        const text1 = $(a).text();
                        const text2 = $(b).text();
                        return (text1 > text2) ? 1 : ((text1 < text2) ? -1 : 0);
                    });
                    $thisSelector.append($options);


                    // re-selecting the previously selected option
                    $selectedOption.prop("selected", true);
                });
            }


            // retrieving any newly created groups from localStorage, so
            // we can add <options> tags dynamically when returning to the page!
            // NOTE this only works after the page has been CLICKED at least once!
            window.onfocus = checkForNewGroups;
        });
    });