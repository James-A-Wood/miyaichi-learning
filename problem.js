/* jshint expr: true */


define(
    [
        "jquery",
        "tools",
        "helpers/tabFocusByArrowKey",
        "helpers/lineNumbering",
        // "helpers/ajaxNotifications",
        "helpers/ctrlIJKLswapsTextInput",
        // "helpers/audioFileUploader",
        // "helpers/replaceStraightQuotesWithSlanted",
        // "helpers/audioRecorder",
        "helpers/AudioPlayer",
        "jqueryui",
        "bootstrap",
        "libraries/dropzone",
        "howler",
    ],
    function (
        $,
        tools,
        tabFocusByArrowKey,
        lineNumbering,
        //AjaxNotifications,
        ctrlIJKLswapsTextInput,
        // audioFileUploader,
        // replaceStraightQuotesWithSlanted,
        // newAudioRecorder,
        AudioPlayer
    ) {


        $(function () {


            const $allProblemsTable = $("#all-problems-holder");
            const $textSelector = $("#text-selector");
            const $groupSelector = $("#group-selector");


            const audio = (function () {


                const $batchDeleteButton = $("#batch-delete-button");
                const $convertButton = $("#batch-convert-button");
                const $voiceRadios = $("input[name='voice-radio']");
                const $shuffleVoicesCheckbox = $("#do-shuffle-voices-checkbox");
                const $voiceRadiosHolder = $("#voice-radios-holder");
                const voice_radio_local_storage_key = "problem_voice_radio_selection";
                const player = new AudioPlayer();


                let currentVoiceIndex = 0;


                const voices = tools.shuffle($voiceRadios.map(function () {
                    return $(this).val();
                }).get());


                const shuffleVoicesCheckbox = tools.checkboxStateHandler({
                    checkbox: $("#do-shuffle-voices-checkbox"),
                    localStorageKey: "problem_do_shuffle_voices_checkbox",
                    defaultToChecked: true,
                    onChange: function () {
                        $voiceRadiosHolder.toggleClass("inactive", $shuffleVoicesCheckbox.is(":checked"));
                    },
                });


                setVoice(localStorage[voice_radio_local_storage_key] || "Matthew");


                $voiceRadios.on("change", function () {
                    localStorage[voice_radio_local_storage_key] = $(this).val();
                });


                $batchDeleteButton.click(function () {
                    confirm("Really delete all audio?") && removeAudio(problemHolder.getAllEnglish());
                });


                $convertButton.click(function () {
                    const allEnglish = problemHolder.getAllEnglish();
                    generateAudio(allEnglish, true);
                });


                function refreshAudio(callback) {
                    $.getJSON("/problem_stuff", {
                        job: "refresh_audio_data",
                        group_id: $groupSelector.val(),
                    }).done(function (audioJSON) {
                        problemHolder.allInputs().removeClass("has-audio").each(function () {
                            const audiotext = $(this).val();
                            if (audioJSON.includes(audiotext)) $(this).addClass("has-audio");
                        });
                        selectedRows.deselectAll();
                        callback && callback();
                    }).fail(e => log(e));
                    return this;
                }


                function removeAudio(text) {
                    $.getJSON("problem_stuff", {
                        job: "delete_audio",
                        item: text,
                    }).done(function (d) {
                        d => log(d);
                        refreshAudio();
                    }).fail(e => log(e));
                    return this;
                }


                function generateAudio(text, doDisableButton = false) {
                    if (!text) return;
                    text = tools.forceArray(text);
                    text = text.map(text => text.trim());
                    if (!text.length) return;
                    doDisableButton && disableConvertButton();
                    $.post("audio_manager_stuff", {
                        job: "synthesize_speech",
                        text: text,
                    }).done(function () {
                        enableConvertButton();
                        refreshAudio();
                    }).fail(e => log(e));
                    return this;
                }


                function generateSingleAudio(text) {
                    tools.isEnglish(text) && $allProblemsTable.hasClass("auto-generate-audio") && generateAudio(text, false);
                    return this;
                }


                function playAudio(text) {
                    if (!text || !tools.isEnglish(text)) return;
                    $.getJSON("problem_stuff", {
                        job: "get_audio",
                        item: text,
                    }).done(function (d) {
                        d && tools.simplePlayer.play(`${d}.mp3`, { voice: getVoice() }); // don't have to specify folder or voice, because "simplePlayer" does that for us!
                    }).fail(function (e) {
                        log(e);
                    });
                    return this;
                }


                function getVoice() {
                    return shuffleVoicesCheckbox.isChecked() ? getRandomVoice() : getSelectedVoice();
                }


                function getSelectedVoice() {
                    return $("input[name='voice-radio']:checked").val();
                }


                function getRandomVoice() {
                    return voices[currentVoiceIndex++ % voices.length];
                }


                function setVoice(newValue) {
                    $(`input[name='voice-radio'][value='${newValue}']`).prop("checked", true);
                    return this;
                }


                function disableConvertButton() {
                    $convertButton.prop("disabled", true);
                    return this;
                }


                function enableConvertButton() {
                    $convertButton.prop("disabled", false);
                    return this;
                }


                function doShuffleVoices() {
                    return $shuffleVoicesCheckbox.is(":checked");
                }


                return {
                    player,
                    removeAudio,
                    generateAudio,
                    refreshAudio,
                    playAudio,
                    generateSingleAudio,
                    getVoice,
                    setVoice,
                    disableConvertButton,
                    enableConvertButton,
                };
            }());


            const controlPanel = (function () {


                const $controlPanel = $("#control-panel"),
                    hideRCButtonKey = "problem_control_panel_do_hide_record_buttons",
                    autoGenerateAudio = "problem_control_panel_synthesize_auto_on_input_blur",
                    hidePlayAudioKey = "problem_control_panel_do_hide_audio_playback_icon",
                    autoPlaybackKey = "problem_control_panel_auto_playback_recorded_audio",
                    hideButtonsHolder = "problem_control_panel_do_hide_buttons_holder",
                    defaultNumColumns = "problem_control_panel_start_number_columns_to_show",
                    playAudioOnFocus = "problem_control_panel_play_audio_on_focus",
                    numRowsForNewGroup = "problem_contrrol_panel_default_number_rows_for_new_group";


                $controlPanel.dblclick(toggleControlPanel);


                function toggleControlPanel() {
                    $(this).toggleClass("show-control-panel");
                }


                tools.keydown(27, () => $controlPanel.removeClass("show-control-panel"));


                wireUpTextInput({
                    $input: $("#start-number-columns-input"),
                    localStorageKey: defaultNumColumns,
                });


                wireUpTextInput({
                    $input: $("#num-rows-in-new-group-input"),
                    localStorageKey: numRowsForNewGroup,
                });


                wireUpCheckbox({
                    $input: $("#hide-record-buttons-checkbox"),
                    localStorageKey: hideRCButtonKey,
                    classToToggle: "hide-record-button",
                });


                wireUpCheckbox({
                    $input: $("#auto-generate-checkbox"),
                    localStorageKey: autoGenerateAudio,
                    classToToggle: "auto-generate-audio",
                    // callback: function() {
                    //     log("Value changed");
                    // },
                });


                wireUpCheckbox({
                    $input: $("#play-audio-on-focus-checkbox"),
                    localStorageKey: playAudioOnFocus,
                    // classToToggle: "auto-generate-audio",
                    // callback: function() {
                    //     // log("Value changed");
                    // },
                });


                wireUpCheckbox({
                    $input: $("#hide-buttons-holder-checkbox"),
                    localStorageKey: hideButtonsHolder,
                    classToToggle: "hide-buttons-holder"
                });


                wireUpCheckbox({
                    $input: $("#auto-playback-recorded-audio-checkbox"),
                    localStorageKey: autoPlaybackKey,
                });


                function wireUpCheckbox(obj = {}) {


                    if (!obj.$input) {
                        log("wireUpCheckbox requires an object with '$input' property (yeah, with the dollar sign)!");
                        return false;
                    }


                    const $parent = obj.parent || $allProblemsTable;
                    const $checkbox = obj.$input;


                    toggleClass($parent, obj);


                    $checkbox.prop("checked", !!localStorage[obj.localStorageKey]).on("change", function () {
                        localStorage.removeItem(obj.localStorageKey);
                        $(this).is(":checked") && localStorage.setItem(obj.localStorageKey, "true");
                        toggleClass($parent, obj);
                        obj.callback && obj.callback($checkbox);
                    }).trigger("change");
                }


                function toggleClass($parent, obj) {
                    obj.classToToggle && $parent.toggleClass(obj.classToToggle, !!localStorage[obj.localStorageKey]);
                }


                function wireUpTextInput(obj) {


                    const $input = obj.$input;
                    const key = obj.localStorageKey;
                    const value = localStorage[key];


                    !!localStorage[key] && $input.val(parseInt(localStorage[key]));

                    $input.on("change", function () {
                        localStorage[key] = $(this).val();
                        obj.onChange && obj.onChange();
                    });
                }


                function getHidePlayIcon() {
                    return localStorage[hidePlayAudioKey];
                }


                function getStartNumColumns() {
                    return parseInt(localStorage[defaultNumColumns]);
                }


                function getNumRowsForNewGroup() {
                    return parseInt(localStorage[numRowsForNewGroup]);
                }


                // NEW TEST
                $("#whittle-number-problems-button").click(function () {
                    table.getStartNumColumns;
                });


                $("#batch-replace-1").on("focus keyup", function () {
                    const str = $(this).val();
                    problemHolder.clearFormatting().markContainsString(str);
                });


                $("#batch-replace-form").submit(function (e) {
                    e.preventDefault();
                    let fromThis = $("#batch-replace-1").val();
                    let withThis = $("#batch-replace-2").val();
                    if (!fromThis) {
                        $(".replace-input").val("");
                        return false;
                    }
                    problemHolder.batchReplace(fromThis, withThis);
                });


                return {
                    // getAutoPlayback,
                    getHidePlayIcon,
                    getStartNumColumns,
                    getNumRowsForNewGroup,
                    doPlayAudioOnFocus: function () {
                        return $("#play-audio-on-focus-checkbox").is(":checked");
                    }
                };
            }());


            // switching between "words" and "sentences" layouts
            const displayMode = (function () {


                const buttonText_words = "単語モード";
                const buttonText_sentences = "文章モード";


                function nowLoading(value) {
                    $allProblemsTable.toggleClass("now-loading", !!value);
                }


                function toggleDisplayMode() {


                    // preserving the number of columns showing
                    const currentNumberRowsShowing = numberColumnsSelector.value();


                    if (sessionStorage.forceFullWidth === "true") {
                        sessionStorage.removeItem("forceFullWidth");
                    } else {
                        sessionStorage.forceFullWidth = "true";
                        numberColumnsSelector.value(1);
                    }


                    set();
                    hideEmptyColumns(currentNumberRowsShowing);
                }


                function set() {


                    const numColumns = parseInt(numberColumnsSelector.value());
                    let newWidth = null; // default


                    if (sessionStorage.forceFullWidth) {
                        $allProblemsTable.addClass("full-width-mode");
                        newWidth = "100%";
                    } else {
                        $allProblemsTable.removeClass("full-width-mode");
                        newWidth = (100 / numColumns) + "%";
                    }


                    problemHolder.allInputs().css({ width: newWidth });
                    $("#toggle-display-mode-button").text(newWidth === "100%" ? buttonText_sentences : buttonText_words);
                    arrowKeyNavigation.setStep(sessionStorage.forceFullWidth ? 1 : numColumns);


                    return this;
                }


                function hideEmptyColumns(number) {


                    const numberRowsWithValues = number || (function () {


                        // cycling through all the problems, getting the highest index of any input that has a value
                        let number = 0;
                        $(".individual-problem-holder").each(function () {
                            $(this).find(".problem-input").each(function (index) {
                                if ($(this).val()) {
                                    number = Math.max(number, index);
                                }
                            });
                        });


                        return number + 1; // adding 1 'cause it's 0-indexed
                    }());


                    numberColumnsSelector.value(numberRowsWithValues);
                    set();


                    return this;
                }


                return {
                    set,
                    toggleDisplayMode,
                    hideEmptyColumns,
                    nowLoading
                };
            }());


            function currentGroupId(setValue) {
                if (setValue) {
                    sessionStorage.current_problems_group = setValue;
                    if (setValue === "clear") { sessionStorage.removeItem("current_problems_group"); }
                }
                return parseInt(sessionStorage.current_problems_group);
            }


            const images = (function () {


                const $imagesHolder = $("#images-holder");
                const $imageMaster = $imagesHolder.find(".my-template").detach().removeClass("my-template");


                // adding some styling
                $imagesHolder.on("dragover", function () {
                    $(this).addClass("dragover");
                }).on("dragleave drop", function () {
                    $(this).removeClass("dragover");
                });


                const myDropzone = new Dropzone("#images-holder", {
                    clickable: false,
                    url: `/upload_problem_group_image/${currentGroupId()}`,
                    createImageThumbnails: false,
                    resizeWidth: 1000, // pixels
                    success: function (d) {
                        refresh(d);
                    },
                    init: function () {
                        this.on("addedfile", function (file) {
                            $(".dz-file-preview").css("display", "none");
                        });
                    },
                    error: function (e, f) {
                        log(e, f);
                    }
                });


                $imagesHolder.sortable({
                    update: function () {
                        $.post("/problem_stuff", {
                            job: "change_image_junban",
                            images: getImagePaths()
                        }).fail(function (e) {
                            log(e);
                        });
                    }
                });


                // clears and reloads
                // NOTE currently loads all images, with no option to load only the most recent one
                function refresh() {
                    clear();
                    $.getJSON(`/get_problem_group_images/${currentGroupId()}`).done(show).fail(function (e) {
                        log(e);
                    });
                }


                function clear() {
                    $imagesHolder.empty();
                }


                // returns the "data-src" property from each of the images in the $imageHolder
                function getImagePaths() {
                    return $imagesHolder.find("img").map(function () {
                        return $(this).attr("data-src");
                    }).get();
                }


                function createNewImage(data) {


                    const $image = $imageMaster.clone().attr({
                        src: `storage/${data.image}`,
                        "data-src": data.image
                    });


                    $image.dblclick(function () {
                        $image.addClass("selected");
                        setTimeout(function () {
                            if (confirm("Really delete?")) {
                                $.post("problem_stuff", {
                                    job: "delete_selected",
                                    problem_group_id: currentGroupId(), // for reordering
                                    images: [$image.attr("data-src")] // must be array
                                }).done(function (e) {
                                    $image.removeClass("selected").fadeOut(400, function () {
                                        $image.remove();
                                    });
                                }).fail(function (e) {
                                    log(e);
                                });
                            } else {
                                $image.removeClass("selected");
                            }
                        });
                    });
                    return $image;
                }


                function show(array) {
                    $imagesHolder.empty();
                    array.forEach(item => {
                        let $image = createNewImage(item);
                        $imagesHolder.append($image);
                    });
                }


                function setActiveTo(trueOrFalse) {
                    $imagesHolder.toggleClass("active", trueOrFalse);
                }


                return {
                    refresh,
                    setActiveTo,
                };
            }());


            // audioFileUploader({
            //     url: "/upload_audio_files/",
            //     text_id: function() {
            //         return $textSelector.val() || "0";
            //     },
            //     problem_group_id: function() {
            //         return $groupSelector.val() || "0";
            //     },
            //     onUpload: audio.refreshAudio,
            // });


            // setting sessionStorage.current_problems_group IF localStorage.current_problems_group is set!
            // NOTE: this can only happen if this page has been opened from the admin.js page!
            if (localStorage.current_text_id_from_admin_js) {
                sessionStorage.problem_text_id = localStorage.current_text_id_from_admin_js;
                localStorage.removeItem("current_text_id_from_admin_js");
            }


            if (localStorage.current_problems_group_from_admin_js) {
                currentGroupId(localStorage.current_problems_group_from_admin_js);
                // sessionStorage.current_problems_group = localStorage.current_problems_group_from_admin_js;
                localStorage.removeItem("current_problems_group_from_admin_js");
            }


            // first off, setting the #text-selector to the saved value
            if (sessionStorage.problem_text_id) {
                $textSelector.val(sessionStorage.problem_text_id);
            }

            currentGroupId() && $groupSelector.val(currentGroupId());


            let group = currentGroupId() || 0;


            loadProblemsForThisGroup(group);


            // wiring up navigation by arrow key
            // * returns a function arrowKeyNavigation.setStep() to change how many inputs to skip (different for "words" and "sentences")
            const arrowKeyNavigation = tabFocusByArrowKey({
                class: "problem-input",
                step: (sessionStorage.forceFullWidth === "true") ? 2 : 1
            });


            const lineNumbers = lineNumbering(".line-number", {
                callback: function () {
                    selectedRows.deselectAll();
                }
            });


            const numberColumnsSelector = (function () {


                const $element = $("#number-columns-to-show");


                $element.change(function () {


                    const numberToShow = parseInt($(this).val());
                    const newWidth = sessionStorage.forceFullWidth ? "100%" : (100 / numberToShow) + "%";
                    arrowKeyNavigation.setStep(sessionStorage.forceFullWidth ? 1 : numberToShow);


                    problemHolder.allInputs().css({ width: newWidth });
                    $(".individual-problem-holder").each(function () {
                        let $inputs = $(this).find(".problem-input");
                        for (let i = 0; i < 5; i++) {
                            if (i < numberToShow) {
                                $($inputs[i]).removeClass("hidden");
                            } else {
                                $($inputs[i]).addClass("hidden");
                            }
                        }
                    });
                });


                function value(number) {
                    number && $element.val(number);
                    change();
                    return parseInt($element.val());
                }


                function change() {
                    $element.trigger("change");
                }


                return {
                    value,
                    change,
                };
            }());


            const selectedRows = (function () {


                // marking the class designating selected rows
                const rowSelectedClass = "row-selected";
                const rowClass = "individual-problem-holder";


                let temporarilyPreventSelectability; // set to TRUE to temporarily prevent selectability


                function getSelectedRows() {
                    return $("." + rowSelectedClass);
                }


                function preventSelection() {
                    temporarilyPreventSelectability = true;
                }


                function allowSelection() {
                    temporarilyPreventSelectability = false;
                }


                // deselecting all
                function clearSelected() {
                    getSelectedRows().removeClass(rowSelectedClass);
                }


                function getFirstSelectedRow() {
                    return getSelectedRows().first();
                }


                function toggleSelected($row) {
                    if (!temporarilyPreventSelectability) {
                        $row.toggleClass(rowSelectedClass);
                    }
                }


                function selectAll() {
                    $("." + rowClass).addClass(rowSelectedClass);
                }


                function selectThis($holder) {
                    $holder.addClass(rowSelectedClass);
                }


                function getSelectedRowIDs() {
                    let selected = {};
                    getSelectedRows().each(function () {
                        let id = $(this).attr("data-id");
                        selected[id] = true;
                    });
                    return selected;
                }


                function deselectThis($holder) {
                    $holder.removeClass(rowSelectedClass);
                }


                function deselectAll() {
                    getSelectedRows().removeClass(rowSelectedClass);
                }


                function toggleAll() {
                    // if any are checked, then removing the check from all
                    // or else checking them all
                    let anyRowsAreSelected = getSelectedRows().length;
                    anyRowsAreSelected ? clearSelected() : selectAll();
                }


                return {
                    getSelectedRowIDs,
                    clearSelected,
                    toggleSelected,
                    getFirstSelectedRow,
                    selectThis,
                    deselectThis,
                    toggleAll,
                    deselectAll,
                    preventSelection,
                    allowSelection,
                };
            }());


            function cloneProblemButtonHandler() {


                const $this = $(this);
                const pageScroll = $("body").scrollTop();
                const group = currentGroupId();


                if (!group) {
                    alert("Choose a group first!");
                    return;
                }


                $.post("/clone_problem", {
                    id: $this.closest(".individual-problem-holder").attr("data-id"),
                    group: currentGroupId(),
                    text: $textSelector.val()
                }).done(function (d) {


                    const $newProblemHolder = problemHolder.addNew({
                        data: d,
                        insertAfter: $this.closest(".individual-problem-holder")
                    });


                    lineNumbers.renumber(function () {
                        numberColumnsSelector.change();
                        disableTabIndex();
                        displayMode.set();
                        $("body").scrollTop(pageScroll);
                    });
                }).fail(function (dataBack) {
                    log("Error in the clone_problem post request!");
                    log(dataBack);
                });
            }


            const problemHolder = (function () {


                const $problemRowMaster = $(".my-problem-holder-template").detach().removeClass("my-problem-holder-template");


                $("#copy-table-to-clipboard-button").on(tools.clickOrTouch, copyTableContents);


                let lastColumnFocused = null;

                function markColumnFocused(event) {
                    lastColumnFocused = $(event.target).index();
                    return this;
                }


                function addNew(inputs) {


                    if (!inputs || !inputs.data || !inputs.data.id) {
                        log("addNew got some bad params!");
                        return false;
                    }


                    const $problemRow = $problemRowMaster.clone().attr("data-id", inputs.data.id);


                    // escaping any single quotes using HTML entities, 'cause quotes break the syntax below
                    for (let i = 1; i <= 5; i++) {
                        $problemRow.find(".problem-input").eq(i - 1).val(inputs.data["word" + i] || "");
                    }


                    $(".problem-input:visible").filter(function () {
                        return $(this).val() === "";
                    }).eq(0).focus();


                    if (inputs.insertAfter) {
                        $problemRow.hide().insertAfter(inputs.insertAfter).slideDown("fast");
                        setNewProblemHolderOrder();
                    } else {
                        $allProblemsTable.append($problemRow);
                    }


                    $problemRow.find(".problem-input")
                        .on("change", updateHandler.registerChange)
                        .on("change", function () {
                            audio.generateSingleAudio($(this).val());
                        })
                        .on("keydown", function (e) {
                            const val = $(this).val();
                            if (e.shiftKey && e.ctrlKey && e.which === 88) { audio.removeAudio(val); } // X key
                            if (e.shiftKey && e.ctrlKey && e.which === 32) { audio.playAudio(val); }
                        })
                        .on("keyup", function (e) {
                            tools.toggleBrackets($(this), e);
                            tools.toggleUnderscores($(this), e);
                        })
                        .on("focus", markColumnFocused)
                        .on("focus", function () {
                            const val = $(this).val();
                            controlPanel.doPlayAudioOnFocus() && audio.playAudio(val);
                        })
                        .on("paste", pasteToMultipleInputs);


                    $problemRow.find(".clone-problem-button").click(cloneProblemButtonHandler);


                    $problemRow.find(".delete-problem-button").click(function () {
                        deleteProblems({
                            button: $(this),
                            warn: true
                        });
                    });


                    $problemRow.find(".line-number-td").click(function () {
                        selectedRows.toggleSelected($problemRow);
                    }).on("mouseover", function (e) {
                        // NOTE that child elements need "pointer-events: none;" in css
                        // to prevent them from interfering with the mouseover event
                        // EXCEPT this doesn't seem to work in IE or Edge
                        e.ctrlKey && selectedRows.toggleSelected($problemRow);
                    });


                    // wiring up mic recording
                    const $recordButton = $problemRow.find(".record-button").eq(0);
                    // const audioRecorder = newAudioRecorder({
                    //     // playbackAudio: controlPanel.getAutoPlayback, // function that returns True or False
                    //     player: audio.player,
                    //     onRecordStart: function() {
                    //         $recordButton.addClass("now-recording");
                    //     },
                    //     bitRate: 320,
                    //     onRecordStop: function(file) {
                    //
                    //
                    //         $recordButton.removeClass("now-recording");
                    //
                    //
                    //         let formData = new FormData();
                    //         if (!file.type.match(".mp3") || file.size > 5 * 1000000) { // max 5 megabytes
                    //             alert("File too large or not .mp3!");
                    //             return false;
                    //         }
                    //
                    //
                    //         const fileName = $recordButton.closest(".individual-problem-holder").find(".problem-input").eq(0).val();
                    //         if (!fileName || fileName.length < 1) { return false; }
                    //         formData.append("files[]", file, fileName + ".mp3"); // have to add ".mp3" because the server checks for this file extension!
                    //
                    //
                    //         let ajax = new XMLHttpRequest();
                    //         ajax.onreadystatechange = function() {
                    //             if (ajax.status && ajax.status === 200 && ajax.readyState === 4) {
                    //                 audio.refreshAudio(function() {
                    //                     // if (controlPanel.getAutoPlayback()) {
                    //                     //     $problemRow.find("has-audio-td").click();
                    //                     // }
                    //                 });
                    //             }
                    //         };
                    //
                    //
                    //         // adding the text_id & problem_group_id to the URL, so we can save that info
                    //         // in the database along with the file name
                    //         ajax.open("POST", `/upload_audio_files/${$textSelector.val()}/${$groupSelector.val()}`, true);
                    //         ajax.send(formData);
                    //     }
                    // });


                    return $problemRow;
                }


                function copyTableContents() {


                    // NOTE apparently, the table has to be on the page and visible in order to be "selected"
                    const $ta = $("<textarea style='position: fixed; top: 100%; opacity: 0;'/>").appendTo("body");


                    // copying cell values, separated alternately by \t and \n
                    $(".individual-problem-holder").each(function () {


                        $inputs = $(this).find(".problem-input");
                        $inputs.each(function (index) {
                            const $input = $(this);
                            if ($input.val()) {
                                const currentString = $ta.val();
                                const inputValue = $input.val();
                                $ta.val(currentString + inputValue + "\t");
                            }
                        });


                        // removing the last two characters (the \t) on the end, and adding a \n
                        const currVal = $ta.val();
                        const adjustedValue = currVal.substring(0, currVal.length - 1) + "\n";
                        $ta.val(adjustedValue);
                    });


                    $ta.select();
                    document.execCommand("copy"); // cool syntax
                    $ta.remove();
                    alert("Copied to clipboard!");
                }


                function getAllValues(obj = {}) {
                    return allInputs().map(function () {
                        const val = $(this).val().trim();
                        const isVisible = $(this).is(":visible");
                        if (val && isVisible) {
                            if (obj.onlyEnglish) {
                                if (tools.isEnglish(val)) { return val; }
                            } else {
                                return val;
                            }
                        }
                    }).get();
                }


                function allInputs() {
                    return $(".problem-input");
                }


                function allVisibleInputs() {
                    return $(".problem-input:visible");
                }


                function batchReplace(str1, str2) {
                    if (str1 === "" || str1 === str2) return false;
                    allInputs().each(function () {
                        const originalValue = $(this).val();
                        let newValue = originalValue.replace(str1, str2);
                        if (originalValue !== newValue) {
                            $(this).val(newValue).change();
                        }
                    });
                    markContainsString(str1);
                    return true;
                }


                function markContainsString(str) {
                    clearFormatting();
                    str && allVisibleInputs().filter(function () {
                        return $(this).val().indexOf(str) !== -1;
                    }).addClass("contains-search-string");
                    return this;
                }


                function clearFormatting() {
                    allInputs().removeClass("contains-search-string");
                    return this;
                }


                return {
                    addNew,
                    copyTableContents,
                    getAllValues,
                    allInputs,
                    allVisibleInputs,
                    batchReplace,
                    markContainsString,
                    clearFormatting,
                    getAllEnglish: function () {
                        return getAllValues({ onlyEnglish: true });
                    },
                    getLastColumnFocused: function () {
                        return lastColumnFocused;
                    },
                };
            }());


            function removeBlanksHandler() {


                // check-marking any .individual-problem-holders in which all .problem-inputs's are completely
                $(".individual-problem-holder").each(function () {


                    const $thisInput = $(this).find(".problem-input");
                    const totalNumInputs = $thisInput.length;
                    const numBlanks = $thisInput.filter(function () {
                        return $(this).val() === "";
                    }).length;


                    if (totalNumInputs === numBlanks) {
                        selectedRows.selectThis($(this));
                    }
                });


                // finally, triggering the click event on the first of the .delete-buttons
                const $this = selectedRows.getFirstSelectedRow().find(".delete-button");


                deleteProblems({
                    button: $this,
                    warn: false
                });
            }


            const updateHandler = (function () {


                let unsentChanges = {};
                let saveChangesToSendAtOnce = false; // set to TRUE to send all changes at once


                function registerChange() {


                    const $this = $(this);
                    const newValue = $this.val();
                    const column = $this.attr("data-column");
                    const id = $this.closest(".individual-problem-holder").attr("data-id");


                    if (!column || !id) return; // not checking for !newValue, because it may be empty, which is okay


                    // saving the (unsent) changes to the unsentChanges object - a three-tiered object!
                    unsentChanges[id] = unsentChanges[id] || {};
                    unsentChanges[id][column] = unsentChanges[id][column] || {};
                    unsentChanges[id][column].newValue = newValue;


                    $this.addClass("updatePending"); // for formatting...


                    $("#upload-changes-button").removeClass("btn-success disabled").addClass("btn-warning").text("Send changes");


                    !saveChangesToSendAtOnce && sendChangesToServer();
                }


                function sendChangesToServer(callback) {


                    saveChangesToSendAtOnce = false;


                    if (Object.keys(unsentChanges).length === 0) return;


                    const object = {
                        changes: [],
                        text_id: sessionStorage.problem_text_id,
                        group_id: currentGroupId()
                    };


                    // cycling through values in the unsentChanges object, building an array of
                    // objects with properties "id", "column", and "newValue",
                    // e.g. {1902: {word1: "Hello!"}}
                    for (let id in unsentChanges) {
                        for (let column in unsentChanges[id]) {
                            const newValue = unsentChanges[id][column].newValue;
                            const thisChange = {
                                id: id,
                                column: column,
                                newValue: newValue
                            };
                            object.changes.push(thisChange);
                        }
                    }


                    $.post("/update_problem_value", object).done(function (d) {


                        d = JSON.parse(d);
                        if (!d || !d.savedChanges) {
                            log("Error updating the problem value!");
                            log(d);
                        }


                        d.savedChanges.forEach(function (thisChange) {


                            const id = thisChange.id;
                            const column = thisChange.column;
                            const newValue = thisChange.newValue;
                            const $row = $(`.individual-problem-holder[data-id='${id}']`);


                            $row.find(`.problem-input[data-column='${column}']`)
                                .val(newValue)
                                .removeClass("updatePending")
                                .addClass("updated");


                            audio.refreshAudio();
                        });


                        $("#upload-changes-button").removeClass("btn-warning").addClass("btn-success disabled").text("No Changes");
                        unsentChanges = {};
                        callback && callback();
                    }, "json").fail(function (data) {
                        log("update_problem_value failed!");
                        log(data);
                    });
                }


                return {
                    registerChange,
                    sendChangesToServer,
                    saveChangesToSendAtOnceModeOn: function () {
                        saveChangesToSendAtOnce = true;
                    }
                };
            }());


            function deleteProblems(inputs) {


                if (!inputs || !inputs.button) {
                    log("deleteProblems requires an object with property 'item'!");
                    return false;
                }


                const $this = inputs.button;
                $this.attr("disabled", true);


                const $holder = $this.closest(".individual-problem-holder");


                selectedRows.selectThis($holder);


                const data = selectedRows.getSelectedRowIDs();


                // confirming, after a slight delay (so that the background color takes effect)
                setTimeout(function () {


                    if (inputs.warn && !confirm("Really delete this?")) {
                        selectedRows.deselectThis($holder);
                        $this.attr("disabled", false);
                        return;
                    }


                    // posting the data, then fading out and removing the row
                    $.post("/delete_problem", data).done(function () {


                        for (let id in data) {


                            // specifying the element by its data-db attribute!  Cool!
                            // deleting the PARENT'S PARENT - kinda klugey
                            $(`.individual-problem-holder[data-id='${id}']`).fadeTo(100, 0, function () {
                                $(this).slideUp("fast", function () {
                                    $(this).remove();
                                    lineNumbers.renumber();
                                });
                            });
                        }
                    });
                }, 50);
            }


            function tabMakesNewRow(e) {


                // if it's the tab key, and the shiftKey is not pressed (meaning we're NOT tabbing BACKWARDS),
                // and the last DISPLAYED .problem-input has focus...
                if (e.keyCode === 9 && !e.shiftKey && $(".problem-input:visible").last().is(":focus")) {
                    e.preventDefault();
                    editor.newProblem({
                        setFocusOn: "last",
                        numberRows: 1
                    });
                }
            }


            function createNewGroupHandler() {


                let name = window.prompt("New Group name?", $("#group-selector option:selected").html());
                if (!name) return;


                name = name.trim();
                if (!name || !isNaN(name)) return;


                const data = {
                    name: name,
                    text_id: $textSelector.val()
                };


                log(data);


                $.post("/new_problem_group", data, function (group) {


                    if (group === -1) return alert("Couldn't create group! Duplicate name?");


                    // adding the new option element to the selector
                    $groupSelector.append(`<option value='${group.id}'>${group.name}</option>`);
                    currentGroupId(group.id); // saving the value in session
                    newGroup.update("created", group.id, group.name); // saving the newly-created info in localStorage
                    $groupSelector.val(group.id); // forcing refresh by fake-clicking the selector
                    groupSelectorChangeHandler({ isNewGroup: true }); // same as triggering "change" event on $groupSelector
                }, "json").fail(function (data) {
                    log("Failed?");
                    log(data);
                });
            }


            function loadProblemsForThisGroup(group, object) {


                images.refresh(); // loading any images for this group
                displayMode.nowLoading(true); // formatting


                group && images.setActiveTo(true);


                // retrieving:
                // 1) data.problems for the specified group, and
                // 2) data.all group names for the drop-down menu
                $("body").addClass("fetching-problem-data");
                $.getJSON("/get_all_problems", {
                    text: $textSelector.val(),
                    group: group
                }).done(function (data) {


                    // appending the default, 'Nothing selected!' option
                    $groupSelector.empty().append("<option value='0' selected>(Select a group)</option>");


                    tools.naturallySort(data.groups, "name");


                    $("body").removeClass("fetching-problem-data");


                    // adding the group names to the drop-down menu
                    data.groups.forEach(function (thisGroup) {
                        $groupSelector.append(`<option value='${thisGroup.id}' >${thisGroup.name}</option>`);
                        $("#import-selector").append(`<option value='${thisGroup.id}' >${thisGroup.name}</option>`);
                    });


                    // pre-selecting the proper option
                    if ($(`#group-selector [value='${sessionStorage.current_problems_group}']`).length === 1) {
                        $groupSelector.val(currentGroupId());
                    }


                    $allProblemsTable.empty();


                    data.problems.forEach(function (thisRow) {
                        problemHolder.addNew({
                            data: thisRow,
                            audioFileName: data.audioFileNames[thisRow.id],
                        });
                    });


                    lineNumbers.renumber();
                    displayMode.hideEmptyColumns().set().nowLoading(false);


                    $(window).scroll(function () {
                        sessionStorage.scrollPosition = $("body").scrollTop();
                    });


                    // restoring previous page scroll position and fading in the body
                    $("body").scrollTop(sessionStorage.scrollPosition);


                    // adding a new, blank row if specified in the parameters
                    object && object.isNewGroup && editor.newProblem({
                        isNewGroup: true,
                        numberRows: controlPanel.getNumRowsForNewGroup()
                    });


                    audio.refreshAudio();

                }).fail(function (data) {
                    log("Problem getting the json data!");
                    log(data);
                });
            }


            function groupSelectorChangeHandler(object) {
                audio.enableConvertButton();
                const group = $groupSelector.val() ? $groupSelector.val() : 0;
                images.setActiveTo(false); // NEW TEST
                $groupSelector.find("option[value='0']").remove();
                currentGroupId(group);
                images.refresh();
                loadProblemsForThisGroup(group, object || {});
            }


            function deleteGroupButtonHandler() {


                const session = currentGroupId();
                const selectedGroup = $groupSelector.val();


                // exiting if group has been chosen
                if (!session || !selectedGroup || session !== parseInt(selectedGroup)) {
                    alert("Can't delete the group!");
                    return;
                }


                // if not empty, double-checking that we can really throw away the words
                if (problemHolder.allInputs().length > 0) {
                    if (!window.confirm("Really delete, words and all?")) return;
                    if (!window.confirm("Really R E A L L Y delete? You'll lose all the words!")) return;
                }


                $.post("/delete_problem_group", { id: selectedGroup }, function (data) {


                    if (data !== 0) {
                        log("Couldn't delete the group!");
                        return;
                    }


                    localStorage.newlyCreatedGroups = "";
                    currentGroupId("clear");


                    newGroup.update("deleted", selectedGroup, false);


                    // removing the option for the deleted value
                    $(`#group-selector option[value='${selectedGroup}']`).remove();

                    $groupSelector.val(0);
                    $allProblemsTable.empty();

                }, "json").fail(function (data) {
                    log("Error in delete_problem_group!");
                    log(data);
                });
            }


            function changeGroupNameButtonHandler() {


                const oldName = $groupSelector.find(":selected").text();
                const name = window.prompt("New name?", oldName);


                if (!name ||
                    name === oldName ||
                    name.trim().length === 0 ||
                    name.trim().length !== name.length) return;


                const data = {
                    id: $groupSelector.val(),
                    name: name
                };


                $.post("/change_group_name", data, function (dataBack) {

                    if (dataBack === -1) {
                        log("Error in change_group_name!");
                        return;
                    }


                    // updating the select-box's option's text
                    $groupSelector.find(":selected").text(dataBack.name);
                }, "json").fail(function (data) {
                    log(data);
                });
            }


            // making problems sortable
            $allProblemsTable.sortable({
                handle: ".line-number-td",
                revert: 100,
                start: function (event, ui) {
                    selectedRows.preventSelection($(ui.item));
                },
                stop: function () {
                    selectedRows.allowSelection();
                    setNewProblemHolderOrder();
                }
            });


            function setNewProblemHolderOrder() {


                let idsAndJunbansArray = [];
                $(".individual-problem-holder").each(function () {
                    idsAndJunbansArray.push({
                        id: $(this).attr("data-id"),
                        newJunban: $(this).index() + 1
                    });
                });


                const data = {
                    category: "Problem", // which table to change
                    items: idsAndJunbansArray // the array of ids & newJunbans
                };


                $.post("/change_junban", data).done(function () {
                    ajax.hideBox();
                }).fail(function (dataBack) {
                    log("Error in change_junban");
                    log(dataBack);
                });


                lineNumbers.renumber();
            }


            function disableTabIndex() {
                $(".btn").prop({ tabIndex: "-1" });
            }


            function cloneGroupButtonHandler(passedInTextID, callback) {


                const group_id = $groupSelector.val();
                const text_id = passedInTextID || $textSelector.val();


                let newGroupName;


                if (!group_id) return;


                // reusing the same text name, if we're cloning to another text
                if (passedInTextID) {
                    newGroupName = $("#group-selector option:selected").html();
                } else {
                    newGroupName = window.prompt("New group name?", $("#group-selector option:selected").html());
                }


                if (!newGroupName) return;


                const data = {
                    new_group_name: newGroupName,
                    source_group_id: group_id,
                    text_id: text_id
                };


                $.post("/clone_group", data).done(function (group) {


                    if (callback) {
                        callback();
                        return;
                    }


                    $groupSelector.append(`<option value='${group.id}'>${group.name}</option>`);
                    currentGroupId(group.id);


                    // marking the group so admin.js can access it immediately
                    newGroup.update("created", group.id, group.name);


                    $groupSelector.val(group.id).trigger("change");

                }).fail(function (dataBack) {
                    log("Error!");
                    log(dataBack);
                });
            }


            const underscores = (function () {


                const originalButtonText = $("#remove-underscores-button").text();


                function remove() {


                    $(this).blur();


                    let numChanged = 0;


                    problemHolder.allInputs().each(function () {


                        const $thisInput = $(this);
                        const oldValue = $thisInput.val();
                        const newValue = oldValue.replace("_", " ");


                        // doing nothing if there are no underscores to be removed
                        if (oldValue.indexOf("_") === -1) {
                            $thisInput.removeData("underscores-removed");
                            return;
                        }


                        numChanged++;
                        $thisInput.data("old-value", oldValue);


                        $thisInput.val(newValue);
                        $thisInput.change();
                    });


                    if (numChanged > 0) {
                        $("#remove-underscores-button").text("Restore underscores");
                        $("#remove-underscores-button").off("click").click(restore);
                    }
                }


                function restore() {


                    $(this).blur();


                    problemHolder.allInputs().each(function () {


                        const $thisInput = $(this);
                        const oldValue = $thisInput.data("old-value");


                        if (oldValue) {
                            $thisInput.val(oldValue);
                            $thisInput.removeData("old-value");
                            $thisInput.change();
                        }
                    });


                    $("#remove-underscores-button").text(originalButtonText);
                    $("#remove-underscores-button").off("click").click(remove);
                }


                return {
                    remove,
                };
            }());


            const editor = (function () {


                let clipboard; // holds the .problem-input's "data-column" attribute (word1, word2, etc.)
                let $activeInput = null;


                // toggling the #copy-column-button
                $(document).on("focus", ".problem-input", function () {
                    $("#copy-column-button").attr("disabled", false);
                    $activeInput = $(document.activeElement);
                });


                $(document).on("blur", ".problem-input", function () {
                    $("#copy-column-button").attr("disabled", true);
                });


                function newProblem(inputs = {}) {


                    // momentarily disabling the buttons
                    $("#new-problem-button, #new-problem-x10-button, #new-problem-x100-button").prop("disabled", true);


                    makeTheseChanges({
                        job: "new_individual_problem",
                        data: { number: inputs.numberRows },
                        ignoreActiveColumn: true,
                        onFinish: function ($selectedData, dataBack) {


                            dataBack = JSON.parse(dataBack);


                            // reenabling the buttons
                            $("#new-problem-button, #new-problem-x10-button, #new-problem-x100-button").prop("disabled", false);


                            inputs.isNewGroup && $("#number-columns-to-show").val(controlPanel.getStartNumColumns());


                            // adding the new row(s), one for each element in the dataBack array
                            dataBack.forEach(function (newProblemData) {
                                problemHolder.addNew({ data: newProblemData });
                            });


                            // setting focus on the LAST .problem-input, if specified (actually, the FIRST .problem-input of the last ROW)
                            if (inputs.setFocusOn === "last") {
                                problemHolder.allInputs().last().siblings(".problem-input").first().focus();
                            } else {
                                $(".problem-input:visible").filter(function () {
                                    return $(this).val() === "";
                                }).first().focus();
                            }


                            lineNumbers.renumber(function () {
                                numberColumnsSelector.change();
                                disableTabIndex();
                            });
                        }
                    });
                }


                function swapColumns_1_2() {


                    makeTheseChanges({
                        job: "swap_columns",
                        thisButton: $(this),
                        confirmMessage: null,
                        ignoreActiveColumn: true,
                        onFinish: swapped
                    });


                    function swapped($selectedCells, returnedAudioData) {


                        // swapping the column values without reloading the whole page
                        $(".problem-holder-td").each(function () {


                            const $holder1 = $(this).find(".problem-input").eq(0);
                            const $holder2 = $(this).find(".problem-input").eq(1);
                            const oldVal1 = $holder1.val();
                            const oldVal2 = $holder2.val();


                            $holder1.val(oldVal2);
                            $holder2.val(oldVal1);
                        });


                        // JSONifying the returned audio data
                        const audioJSON = JSON.parse(returnedAudioData);


                        // assigning audio stuff
                        $(".individual-problem-holder").each(function () {
                            const $row = $(this);
                            const audioFileName = audioJSON[$row.data("id")];
                        });


                        audio.refreshAudio();
                    }
                }


                function deleteColumn() {
                    makeTheseChanges({
                        job: "delete_column",
                        thisButton: $(this),
                        confirmMessage: "Really empty column ",
                        onFinish: function ($selectedCells) {
                            $selectedCells.val("");
                        }
                    });
                }


                function copyColumn() {


                    if ($(".column-copied").length) {
                        $(".column-copied").removeClass("column-copied");
                        clipboard = null;
                        $("#paste-button").attr("disabled", true);
                        return;
                    }


                    clipboard = $activeInput.data("column");
                    $(`.problem-input[data-column="${clipboard}"]`).addClass("column-copied");
                    $("#paste-button").attr("disabled", false);
                }


                function pasteColumn() {
                    let pasteTo = $activeInput.data("column");
                    makeTheseChanges({
                        job: "copy_column_to",
                        confirmMessage: `Copy ${clipboard} to ${pasteTo} ?`,
                        data: {
                            pasteTo: pasteTo,
                            copyFrom: clipboard
                        },
                        onFinish: function ($selectedCells, d) {
                            $selectedCells.each(function () {
                                let newValue = $(this).siblings(`[data-column='${clipboard}']`).val();
                                $(this).val(newValue);
                            });
                            $(".column-copied").removeClass("column-copied");
                            clipboard = null;
                            $("#paste-button").attr("disabled", true);
                        }
                    });
                }


                // private
                function makeTheseChanges(obj) {


                    // making sure we check that at least one column is active, optionally
                    if (!obj.ignoreActiveColumn && !$activeInput) {
                        alert("No input box is active!");
                        return false;
                    }


                    // checking parameters
                    if (!obj || typeof obj !== "object" || !obj.job || !obj.onFinish) {
                        log("makeTheseChanges requires object with properties .job and .onFinish!");
                        return false;
                    }


                    // temporarily disabling the button
                    const $button = obj.thisButton;
                    $button && $button.attr("disabled", true);
                    const column = $activeInput ? $activeInput.data("column") : null;
                    const $selectedCells = $(`.problem-input[data-column='${column}']`);


                    // highlighting selected rows IF necessary
                    if (!obj.ignoreActiveColumn) {
                        $selectedCells.addClass("column-selected");
                    }


                    // adding slight delay using setTimeout, just so
                    // the formatting is visible BEFORE the confirm
                    const sendDataDelay = obj.ignoreActiveColumn ? 0 : 50;


                    // slight delay, so that the .selected-column formatting
                    // appears before the "confirm" message pops up!
                    setTimeout(function () {


                        const data = {
                            job: obj.job,
                            column: column,
                            data: obj.data,
                            text_id: $textSelector.val(),
                            group_id: $groupSelector.val()
                        };


                        if (obj.confirmMessage) {
                            if (!window.confirm(obj.confirmMessage + " " + column + " ?")) {
                                $selectedCells.removeClass("column-selected");
                                $button && $button.attr("disabled", false);
                                return;
                            }
                        }


                        $.post("/problem_stuff", data).done(function (returnedData) {
                            obj.onFinish($selectedCells, returnedData);
                        }).always(function () {
                            $selectedCells.removeClass("column-selected");
                            $button && $button.attr("disabled", false);
                        });
                    }, sendDataDelay);
                }


                return {
                    deleteColumn,
                    swapColumns_1_2,
                    newProblem,
                    copyColumn,
                    pasteColumn,
                };
            }());


            function importProblemsHandler() {


                const appendGroupID = parseInt($("#import-selector").val());
                const baseGroupID = parseInt($groupSelector.val());
                const appendGroupName = $("#import-selector :selected").text();


                if (!appendGroupID || !baseGroupID) return;


                if (appendGroupID === baseGroupID) {
                    alert("Can't append a group to itself!");
                    return;
                }


                if (!window.confirm(`Really append ${appendGroupName} to this group?`)) return;


                $.getJSON("/problem_stuff", {
                    job: "import_problems",
                    data: {
                        baseGroupID,
                        appendGroupID,
                    }
                }).done(function (d) {
                    window.location.reload();
                }).fail(function (d) {
                    log("Failed to append the problems!");
                    log(d);
                });
            }


            function cloneToDifferentText() {


                $(window).keydown(dismissCloneToTextStuffViaEscape);


                function dismissCloneToTextStuffViaEscape(e) {
                    (e.keyCode === 27) && dismissCloneToTextStuff(); // Escape key
                }


                function dismissCloneToTextStuff() {
                    $("#new-text-selector-holder").empty();
                    $(window).off("keydown", dismissCloneToTextStuffViaEscape);
                }


                // cloning and appending the #text-selector
                const $selectorClone = $textSelector.clone().attr({ id: "new-text-selector" });
                const currentSelected = $textSelector.val();
                const currentGroupName = $groupSelector.find("option:selected").html();
                const currentTextName = $selectorClone.find("option:selected").html();
                $selectorClone.find(`option[value=${currentSelected}]`).attr("selected", true);
                $("#new-text-selector-holder").empty().append($selectorClone);


                $selectorClone.change(function () {


                    if (!window.confirm("Copy group \n'" + currentGroupName + "' to \n'" + currentTextName + "'?")) {
                        dismissCloneToTextStuff();
                        return;
                    }


                    const textID = $("#new-text-selector").val();


                    cloneGroupButtonHandler(textID, function () {
                        dismissCloneToTextStuff();
                        alert("Group copied to that text!");
                    });
                });
            }

            /*
             *
             * Putting these last so we can use a slightly cleaner syntax inside the '.click( ~ )' parens
             *
             */


            // wiring up various buttons and inputs
            $(document).keydown(tabMakesNewRow);
            $groupSelector.change(groupSelectorChangeHandler);
            $("#remove-blanks-button").click(removeBlanksHandler);
            $("#remove-underscores-button").click(underscores.remove);
            $("#create-new-group-button").click(createNewGroupHandler);
            $("#change-group-name-button").click(changeGroupNameButtonHandler);
            $("#delete-group-button").click(deleteGroupButtonHandler);
            $("#new-problem-button").click(editor.newProblem);
            $("#new-problem-x10-button").click(function () {
                editor.newProblem({
                    numberRows: 10
                });
            });
            $("#new-problem-x100-button").click(function () {
                editor.newProblem({
                    numberRows: 100
                });
            });
            $("#toggle-all-rows").click(selectedRows.toggleAll);
            $("#toggle-display-mode-button").click(displayMode.toggleDisplayMode);
            $("#clone-group-button").click(function () {
                cloneGroupButtonHandler(); // have to do this here, so the event doesn't get passed in!
            });
            $textSelector.change(textSelectorChangeHandler);
            $("#import-problems-button").click(importProblemsHandler);
            $("#swap-columns-button").click(editor.swapColumns_1_2);
            $("#delete-column-button").click(editor.deleteColumn);
            $("#clone-to-different-text-button").click(cloneToDifferentText);

            $("#copy-column-button").click(editor.copyColumn);
            $("#paste-button").click(editor.pasteColumn);



            // wiring up the #import-problems-button to only be enabled when some group is selected
            $("#import-selector").change(function () {
                if ($(this).val()) {
                    $("#import-problems-button").attr("disabled", false);
                } else {
                    $("#import-problems-button").attr("disabled", true);
                }
            });


            function pasteToMultipleInputs(e) {



                /*
                 *
                 *
                 *      Getting the text data from the clipboardEvent - funky syntax!
                 *
                 *      Pasting the data into a <textarera>, then copying it back out
                 *      as a way to get the unformatted text while preserving
                 *      the tab and new-line marks
                 *
                 *      NOTE that the textarea is never actually added to the DOM
                 *
                 *
                 */



                // getting the clipboard data, pasting it into the textarea, and then copying it back out
                let textData = e.originalEvent.clipboardData.getData("text");
                const $textArea = $("<textarea />").val(textData);
                textData = $textArea.val();


                // exiting here if there are no line breaks, meaning that
                // we're not pasting from Excel, or it's a single cell
                if (textData.indexOf("\n") === -1 && textData.indexOf("\t") === -1) {
                    return true;
                }


                // telling updateHandler NOT to send changes individually,
                // so we have to call updateHandler.sendChangesToServer() MANUALLY down below
                updateHandler.saveChangesToSendAtOnceModeOn();


                // deleting the originally pasted value
                // seems to display better when we blur it first (why?)
                $(this).blur().val("");


                // saving the current row and the index at which to start
                const cellStartIndex = $(this).index(); // the which COLUMN to start in (not always 0)
                let $currentRow = $(this).closest(".individual-problem-holder");
                let currentIndex = cellStartIndex;


                // cycling through and adding the data to cells, in rows and columns
                textData.split("\n").forEach(function (thisRow) {
                    thisRow.split("\t").forEach(function (thisCell) {


                        // removing extraneous characters
                        thisCell = thisCell.replace(/\･/g, ""); // 半角 dot
                        thisCell = thisCell.replace(/\・/g, ""); // 全角 dot
                        thisCell = thisCell.replace(/(\[.+\])/g, ""); // anything between square brackets
                        thisCell = thisCell.replace(/\s{1,}\?/g, "?"); // space(s) before question marks
                        thisCell = thisCell.replace(/\s{1,}\./g, "."); // space(s) before periods
                        thisCell = thisCell.replace(/\s{1,}\!/g, "!"); // space(s) before exclamation marks


                        $currentRow.find(".problem-input").eq(currentIndex).val(thisCell).change();


                        // setting pointer to next cell
                        currentIndex += 1;
                    });


                    // resetting the cell index, so we start at the left-most one,
                    // and moving the row to the next row
                    currentIndex = cellStartIndex;
                    $currentRow = $currentRow.next();
                });


                // sending changes to server MANUALLY
                updateHandler.sendChangesToServer();
            }


            function textSelectorChangeHandler() {
                sessionStorage.problem_text_id = $(this).val();
                sessionStorage.current_problems_group = "";
                window.location.reload();
            }


            const newGroup = (function () {


                // 例えば...
                //
                // let baseArray = {
                //     textID: {
                //         created: {
                //             groupID: "Chapter 7 Vocabulary",
                //             groupID: "Chapter 9 Sentences"
                //         },
                //         deleted: {
                //             groupID: true
                //         }
                //     }
                // };


                function update(createdOrDeleted, groupId, value) {


                    const textId = $textSelector.val();
                    const object = (function () {
                        if (localStorage.newlyCreatedGroups) { return JSON.parse(localStorage.newlyCreatedGroups); }
                        return {};
                    }());


                    // building our object if it doesn't exist already
                    object[textId] = object[textId] || {};
                    object[textId].created = object[textId].created || {};
                    object[textId].deleted = object[textId].deleted || {};


                    // saving the data
                    object[textId][createdOrDeleted][groupId] = value;


                    // writing the object back to localStorage
                    localStorage.newlyCreatedGroups = JSON.stringify(object);
                    localStorage.reloadActiveAssignments = 1;


                    return object;
                }


                return {
                    update,
                };
            }());


            // enabling swapping
            ctrlIJKLswapsTextInput({
                className: "problem-input",
                updateHandler: updateHandler
            });
        });
    });
