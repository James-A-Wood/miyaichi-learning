/* jshint expr: true */

define(
        [
            "jquery",
            "tools",
            "jqueryui"
        ],


    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     *
     *      Creates a new block for holding an assignment -
     *      the name, button, template selector, data group selector, etc.
     *
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


    function($, tools) {


        const setOpenState = (function() {


            const $openAllButton = $("#open-all-button");


            $openAllButton.click(function() {
                sessionStorage.all_assignments_open ? closeAllAssignments() : openAllAssignments();
            });


            function setAll() {
                sessionStorage.all_assignments_open === "true" ? openAllAssignments() : closeAllAssignments();
            }


            // private
            function openAllAssignments() {
                $openAllButton.addClass("all-open");
                sessionStorage.all_assignments_open = "true";
                $(".assignment-holder").not(".all-items-showing").find(".show-all-options-button").click();
            }


            // private
            function closeAllAssignments() {
                $openAllButton.removeClass("all-open");
                sessionStorage.removeItem("all_assignments_open");
                $(".assignment-holder.all-items-showing").find(".show-all-options-button").click();
            }


            return setAll;
        }());


        function makeNew(global, templateDefaults) {


            const $miscInputMaster = tools.makeTemplate(".misc-inputs-holder .my-template"); // have to do this first
            $(".misc-inputs-holder").empty(); // NEW TEST necessary to make css :empty work, cause otherwise (for whatever reason) it's not really empty
            const $assignmentHolderMaster = tools.makeTemplate(".assignment-holder.my-template");


            return function(assignmentInfo, options) {


                options = options || {};


                // retrieving the text_id
                const text_id = $(".texts-holder").find(".open").data("value");
                if (!text_id) { return false; }


                const $newAssignment = $assignmentHolderMaster.clone().appendTo("#assignments-holder");


                let miscJSON = assignmentInfo.misc;


                // adding the db_id attribute to it - necessary for .sortable to work
                $newAssignment.data({ db_id: assignmentInfo.id });


                // adding values to the newly-cloned assignmentHolder
                $newAssignment.find(".button-label-input").val(assignmentInfo.button_label);
                $newAssignment.find(".number-problems-input").val(assignmentInfo.number_problems);
                $newAssignment.find(".number-sentakushi-input").val(assignmentInfo.number_sentakushi);
                $newAssignment.find(".mistakes-limit").val(assignmentInfo.mistakes_limit);
                $newAssignment.find(".time-limit-input").val(assignmentInfo.time_limit);
                $newAssignment.find(".time-limit-warning-input").val(assignmentInfo.time_limit_warning);
                $newAssignment.find(".directions-input").val(assignmentInfo.directions);
                $newAssignment.find(".video-id-input").val(assignmentInfo.video_id);
                $newAssignment.find(".db_id").text(assignmentInfo.id);


                // setting all checkbox check-states
                // NOTE have to convert string numbers, e.g. "0", to Integers
                const $checkboxes = $newAssignment.find(".checkboxes-holder").find("input[type='checkbox']");
                $checkboxes.each(function() {
                    const column = $(this).data("column");
                    const checkedOrNot = parseInt(assignmentInfo[column]) ? true : false;
                    $(this).prop("checked", checkedOrNot);
                });


                // wiring up change and click events on the various inputs
                $newAssignment.find(".goto-problem-group").click(openProblemGroup);
                $newAssignment.find(".goto-assignment").click(() => window.open(`/assignment/${assignmentInfo.id}`));
                $newAssignment.find(".show-all-options-button").click(showAllOptions);
                $newAssignment.find(".assignment-input").change(function() {
                    updateValue($(this), assignmentInfo.id);
                });
                $newAssignment.find(".assignment-number").click(function() {
                    toggleActiveState($(this), assignmentInfo.id);
                });
                $newAssignment.find(".delete-assignment-button").click(function() {
                    deleteAssignment($(this), assignmentInfo.id);
                });
                $newAssignment.find(".template-selector").on("change", templateSelectorChangeHandler).each(function() {
                    addTemplateSelectorOptions({
                        thisSelector: $(this),
                        assignmentInfo: assignmentInfo
                    });
                });
                $newAssignment.find(".data-group-selector").on("change", dataGroupChangeHandler).each(function() {
                    addGroupSelectorOptions({
                        thisSelector: $(this),
                        assignmentInfo: assignmentInfo,
                        groups: global.problemGroups[text_id]
                    });
                });


                // changing ANY input triggers reformatting of the whole assignmentHolder
                $newAssignment.find("input").change(function() {
                    setAssignmentHolderFormatting($newAssignment);
                });


                // making it visible, 'cause it was hidden by default
                $newAssignment.show();


                assignmentInfo.active !== "on" && $newAssignment.addClass("inactive");
                setAssignmentHolderFormatting($newAssignment);
                options.slideDown && $newAssignment.hide().slideDown("fast");


                // adding some new inputs specific to different templates
                if (templateDefaults.miscInputs && templateDefaults.miscInputs[assignmentInfo.template]) {


                    // an array of objects, like [{ key: "doShowHints", label: "Do Show Hints", type: "checkbox"}]
                    const inputs = templateDefaults.miscInputs[assignmentInfo.template];
                    const inputValues = tools.safeParseJSON(assignmentInfo.misc);
                    const $miscInputsHolder = $newAssignment.find(".misc-inputs-holder");


                    inputs && inputs.forEach(function(obj) {


                        const $clone = $miscInputMaster.clone().appendTo($miscInputsHolder);
                        const $input = $clone.find("input");
                        const label = obj.label;
                        const type = obj.type;
                        const key = obj.key; // the key for the key-value pair for the JSON
                        const inputValue = inputValues[key];


                        obj.newLine && $clone.before("<br>");


                        $clone[type === "text" ? "prepend" : "append"](label); // before or after, depending on input type
                        $input.prop("type", type).data("key", key);


                        // setting either the value or the checked state, if there's a value to add
                        if (inputValue) {
                            type === "checkbox" ? $input.prop("checked", !!inputValue) : $input.val(inputValue);
                        }


                        $input.on("change", function() {


                            let parsedJSON = tools.safeParseJSON(miscJSON);


                            const thisKey = $input.data("key");
                            const thisValue = $input.is("input[type='checkbox']") ? ($input.is(":checked") ? 1 : 0) : $input.val();


                            parsedJSON[thisKey] = thisValue;
                            miscJSON = JSON.stringify(parsedJSON);


                            $.post("/admin_stuff", {
                                job: "update_value",
                                changes: [ // NOTE changes is ARRAY, meaning we can update multiple models at once
                                    {
                                        table: "Assignment",
                                        id: assignmentInfo.id,
                                        column: "misc",
                                        newValue: miscJSON,
                                    }
                                ]
                            }, function() {
                                $input.addClass("updated");
                            }, "json").fail(function(e) {
                                log(e);
                            });
                        });
                    });
                }
            };



            /*
             *
             *
             *      Miscellaneous functions that are called from above
             *
             *
             */



            function addGroupSelectorOptions(d) {


                const $thisSelector = d.thisSelector;
                $thisSelector.append("<option value=''/>"); // appending at least one blank option tag
                tools.naturallySort(d.groups, "name");


                // adding options
                d.groups.forEach(function(group) {


                    const isSelected = (group.id === d.assignmentInfo.problems_group_id) ? "selected" : null;
                    $(`<option value="${group.id}">${group.name}</option>`).prop("selected", isSelected).appendTo($thisSelector);


                    // saving selected option in sessionStorage
                    if (isSelected) {
                        sessionStorage.lastDataGroupSelected = group.id;
                    }
                });
            }


            function dataGroupChangeHandler() {
                sessionStorage.lastDataGroupSelected = $(this).val();
            }


            function addTemplateSelectorOptions(d) {


                const $thisSelector = d.thisSelector;


                global.templates.forEach(function(fileName) {
                    const selectedOrNot = (d.assignmentInfo.template === fileName) ? " selected " : null;
                    const userFriendlyName = (function() {
                        if (fileName in templateDefaults.templateAliases) {
                            return templateDefaults.templateAliases[fileName];
                        }
                        return fileName;
                    }());
                    $("<option/>").val(fileName).prop("selected", selectedOrNot).text(userFriendlyName).appendTo($thisSelector);
                });

                hideExtraneousFieldsFor($thisSelector);
            }


            function templateSelectorChangeHandler() {


                const $this = $(this);
                const thisTemplate = $this.val();


                // hiding the fields that are seldom used for this type of assignment
                hideExtraneousFieldsFor($this);


                // assigning default values, like number sentakushi and problems
                if (templateDefaults.defaultValuesFor[thisTemplate]) {
                    for (let selector in templateDefaults.defaultValuesFor[thisTemplate]) {
                        const value = templateDefaults.defaultValuesFor[thisTemplate][selector];
                        $this.closest(".assignment-holder").find(selector).val(value).change();
                    }
                }


                // automatically populating the data-group-selector, if it's not populated already, and
                // there's a value in sessionStorage
                const $dataGroupSelector = $(this).closest(".assignment-holder").find(".data-group-selector");
                if (!$dataGroupSelector.val() && sessionStorage.lastDataGroupSelected) {
                    $dataGroupSelector.val(sessionStorage.lastDataGroupSelected).change();
                }


                // setting any checkboxes to their default values for template, and
                // triggering the "change" event
                for (let checkbox in templateDefaults.checkboxesToShowFor[thisTemplate]) {
                    const value = templateDefaults.checkboxesToShowFor[thisTemplate][checkbox];
                    $this.closest(".assignment-holder").find("input:checkbox[data-column='" + checkbox + "']").prop("checked", value).change();
                }
            }


            // setting which fields are visible for which types
            function hideExtraneousFieldsFor($selector, doSlideUp) {


                // NEW TEST erasing this so we can close hideExtraneousFields even when sessionStorage.all_assignments_open
                // if (sessionStorage.all_assignments_open) { return; }

                const thisTemplate = $selector.val();
                const checkboxesToShow = templateDefaults.checkboxesToShowFor[thisTemplate] || {};
                const $parent = $selector.closest(".assignment-holder");
                const $checkboxesHolder = $parent.find(".checkboxes-holder");
                const slideSpeed = 200;


                // hiding all the checkboxes; then, showing only the specified checkboxes
                $parent.find(".checkbox-holder-span").hide();


                // showing all those checkboxes to be shown for all assignment types
                for (let thisCheckbox in templateDefaults.checkboxesToShowForAll) {
                    const $thisCheckbox = $checkboxesHolder.find(`input[data-column='${thisCheckbox}']`);
                    $thisCheckbox.closest(".checkbox-holder-span").show();
                }


                for (let checkbox in checkboxesToShow) {
                    const $thisCheckbox = $checkboxesHolder.find(`input[data-column='${checkbox}']`);
                    $thisCheckbox.closest(".checkbox-holder-span").show();
                }


                // displaying all fields, before hiding some of them
                $parent.find(".assignment-holder-item").each(function() {
                    $(this).css({ display: "block" });
                });


                // hiding all those that are hidden for ALL templates
                // NOTE right now this is only the .checkboxes-holder
                templateDefaults.hideForAll.forEach(function(thisClass) {
                    $parent.find(thisClass).slideUp(slideSpeed);
                });


                // ... if there are any fieldsToHide for this particular template type...
                if (templateDefaults.fieldsToHideFor[thisTemplate]) {
                    const fields = templateDefaults.fieldsToHideFor[thisTemplate];
                    fields.forEach(function(element) {
                        $parent.find(element).slideUp(doSlideUp ? slideSpeed : 0); // was : $parent.children(element).slideUp(doSlideUp ? 200 : 0);
                    });
                }
            }


            function deleteAssignment($this, id) {


                if (!id) { return false; }


                const $parent = $this.closest(".assignment-holder");


                if (!window.confirm("Really delete this assigment?")) { return; }


                $.getJSON("/admin_stuff", {
                    job: "delete_assignment",
                    id: id
                }).done(function() {
                    $parent.slideUp(function() {
                        $parent.remove();
                    });
                });
            }


            function updateValue($this, id) {


                if (arguments.length < 2) return false;


                // ERASE THIS LATER because we're no longer using the embed_code
                // extracting the "embed" code if it's a full-length YouTube embed URL
                if ($this.hasClass("video-id-input") && $this.val().indexOf("embed/") !== -1) {
                    const embedCode = $this.val().split("embed/")[1].split("\"")[0];
                    $this.val(embedCode);
                }


                const table = $this.closest(".assignment-holder").data("table");
                let newValue = $this.val();


                // if the input is a CHECKBOX, then sending 1 or 0, depending
                if ($this.is("input[type='checkbox']")) {
                    newValue = $this.is(":checked") ? 1 : 0;
                }


                $.post("/admin_stuff", {
                    job: "update_value",
                    changes: [ // changes is ARRAY, so we could update multiple models at once
                        {
                            table: table,
                            id: id,
                            column: $this.data("column"),
                            newValue: newValue
                        }
                    ]
                }, function(returnedData) {
                    if (returnedData !== 0) {
                        log("Error updating some values!");
                        return;
                    }
                    $this.addClass("updated"); // formatting
                }, "json").fail(function(e) {
                    log(e);
                });
            }


            // show/hide all the assignment options
            function showAllOptions() {
                const $assignmentHolder = $(this).closest(".assignment-holder");
                if ($assignmentHolder.hasClass("all-items-showing")) {
                    const $selector = $(this).closest(".assignment-holder").find(".template-selector");
                    hideExtraneousFieldsFor($selector, true); // NEW TEST adding "true" to force elents to slide up
                    $(this).closest(".assignment-holder").removeClass("all-items-showing");
                } else {
                    $assignmentHolder.children().slideDown("fast");
                    $assignmentHolder.addClass("all-items-showing");
                }
            }


            function openProblemGroup() {


                const problemGroupID = $(this).siblings(".data-group-selector").val();
                const text_id = $(".texts-holder").find(".open").data("value");


                // saving the current_problems_group id in LOCAL storage so that "problem.js" can access it (otherwise couldn't, 'cause it's in the next tab)
                // NOTE this gets erased immediately after use
                if (problemGroupID) {
                    localStorage.current_problems_group_from_admin_js = problemGroupID;
                    localStorage.current_text_id_from_admin_js = text_id;
                }

                window.open("/problems");
            }


            function toggleActiveState($this, id) {


                const $closestAssignmentHolder = $this.closest(".assignment-holder");
                const newValue = $closestAssignmentHolder.hasClass("inactive") ? "on" : "off";


                $.getJSON("/admin_stuff", {
                    job: "update_value",
                    changes: [
                        {
                            table: "Assignment",
                            column: "active",
                            newValue: newValue,
                            id: id
                            }
                        ]
                }, function() {
                    $closestAssignmentHolder.toggleClass("inactive", newValue !== "on");
                }).fail(function(d) {
                    log("Couldn't change the active state!");
                    log(d);
                });
            }


            function setAssignmentHolderFormatting($assignmentHolder) {


                const isLocked = $assignmentHolder.find(".locked").is(":checked");


                $assignmentHolder.find(".assignment-input:not(.locked)").prop("disabled", !!isLocked);
                $assignmentHolder.toggleClass("assignment-locked", !!isLocked);

                // showing/hiding the quiz badge
                const mistakesLimit = $assignmentHolder.find(".mistakes-limit").val();
                const timeLimit = $assignmentHolder.find(".time-limit-input").val();


                $assignmentHolder.toggleClass("quiz", !!(mistakesLimit || timeLimit));
            }
        }

        return {
            makeNew,
            setOpenState,
            getOpenState: function() {
                return !!sessionStorage.all_assignments_open;
            },
        };
    }
);