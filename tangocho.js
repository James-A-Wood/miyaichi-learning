/* jshint expr: true */
/* jshint loopfunc: true */

/*
 *
 *
 *
 *      JavaScript for the tangocho PAGE!
 *
 *      NOTE that this also uses the SEPARATE helpers/tangocho.js file
 *
 *
 *
 *
 */


define(
    [
        "jquery",
        "tools",
        "helpers/playAudioOnClick",
        "helpers/tangocho",
        "jqueryui",
    ],
    function (
        $,
        tools,
        playAudioOnClick,
        tangocho
    ) {


        $(function () {


            const clearAllButton = (function () {


                const $button = $("#all-clear-button");
                $button.on("click", function () {
                    if (!tools.doubleConfirm("全ワードを削除しますか？")) return;
                    $.getJSON("tangocho_stuff", {
                        job: "clear_all_words_for_user",
                    }).done(e => {
                        getData();
                    }).fail(e => log(e));
                });


                function enable(setToValue = false) {
                    $button.prop("disabled", setToValue);
                }


                return { enable, };
            }());


            const voiceHandler = (function () {


                const voices = tools.getAudioVoices({ shuffle: true });


                let index = 0;


                const voiceSelector = tools.selectStateHandler({
                    select: $("#voice-selector"),
                    localStorageKey: "tangocho-voice-select",
                    options: voices,
                });


                function getVoice() {
                    if (voiceSelector.getValue() === "random") {
                        index++;
                        return voices[index % voices.length];
                    }
                    return voiceSelector.getValue();
                }


                return {
                    getVoice,
                };
            }());


            const exerciseButtons = (function () {


                const templatesRequringAudio = ["vocabulary", "sentence_choosing", "scrabble"];


                function numItemsRequired(template) {
                    if (templatesRequringAudio.indexOf(template) !== -1) {
                        return wordsTable.getNumRows("has-audio");
                    }
                    return wordsTable.getNumRows();
                }


                function show() {


                    $(".exercise-button").each(function () {


                        const $button = $(this);
                        const template = $button.data("template");
                        const numUsableRows = numItemsRequired(template);


                        if (numUsableRows >= $button.data("number_sentakushi")) {
                            $button.removeClass("inactive").on("click", function () {


                                // adding the folder_id to the url
                                const newURL = $button.data("href") + "/" + (folders.select.getCurrentFolder().id);
                                window.location = newURL;
                            });
                        } else {
                            $button.off("click").addClass("inactive");
                        }
                    });
                }


                function reset() {
                    $(".exercise-button").each(button => $(button).addClass("inactive").off("click"));
                }


                return {
                    show,
                    reset,
                };
            }());


            const wordsTable = new WordsTable();

            function WordsTable() {


                tools.page.restoreScroll();
                tools.page.rememberScroll();


                const $wordsTable = $("#words-table");
                const $numItemsDisplay = $("#num-items-display");
                const $rowTemplate = $wordsTable.find(".row-template").detach().removeClass("row-template");


                let tableData = []; // all the row data
                let trsUndisplayed = []; // undisplayed rows, whittled down as rows are added
                let trsDisplayed = []; // built up as rows are displayed


                // private function
                function displayTRs() {
                    while (trsUndisplayed.length && lastRowIsOnScreen()) {
                        $("body").addClass("has-words");
                        const $tr = tools.forceJQuery(trsUndisplayed.shift());
                        $wordsTable.append($tr);
                        trsDisplayed.push($tr);
                    }
                    return this;
                }


                // private function
                function lastRowIsOnScreen() {
                    return $wordsTable.find("tr").last().offset().top < $(window).scrollTop() + $(window).height();
                }


                function wireUpFolderSelect($row, thisPair, $options) {


                    const $localSelect = $row.find(".folder").find(".vocab-item-folder-select");
                    $localSelect.html($options);


                    // pre-selecting the appropriate folder.id, if specified
                    $localSelect.val(thisPair.folder ? thisPair.folder.id : "");


                    const startValue = $localSelect.val();


                    $localSelect.change(function () {
                        const newValue = $(this).val();
                        $.post("tangocho_stuff", {
                            job: "change_tangocho_folder",
                            id: thisPair.id,
                            folder_id: newValue
                        }).done(function (e) {
                            // log(e);
                        }).fail(function (e) {
                            // usually, we're here because the word already exists
                            $row.find(".folder").find(".vocab-item-folder-select").val(startValue);
                            setTimeout(function () { // slight delay so the select reverts back before the alert
                                alert("単語を写すことができませんでした！");
                            }, 100);
                        });
                    });


                    return this;
                }


                function newTR(thisRow) {


                    const $row = $rowTemplate.clone().data("vocab_id", thisRow.id).addClass("item-row");


                    $row.find(".english").text(thisRow.english);
                    $row.find(".japanese").text(thisRow.japanese);
                    $row.find(".updated-at").text(tools.readableDate(thisRow.created_at));
                    $row.find(".delete-button").click(() => removeRow(thisRow.id));


                    $row.data("english", thisRow.english);


                    $row.find(".audio-td").on("click", function () {
                        tools.simplePlayer.play($row.data("audio_file_name"), {
                            voice: voiceHandler.getVoice(),
                            onplay: () => $(this).addClass("audio-playing"),
                            onstop: () => $(this).removeClass("audio-playing"),
                        });
                    });


                    const $options = folders.select.getSelectHTML();
                    wireUpFolderSelect($row, thisRow, $options);


                    return $row;
                }


                function buildTable(data) {


                    tableData = data;


                    clearTable();


                    tableData.forEach(rowData => trsUndisplayed.push(newTR(rowData)));
                    $(".word-input").val("");
                    exerciseButtons && exerciseButtons.show();


                    displayTRs();
                    refreshAudio();
                    displayNumberItems();


                    return this;
                }


                function displayNumberItems() {
                    $numItemsDisplay.html("( x <b>" + getNumRows() + "</b> )");
                    return this;
                }


                function getNumRows(className) {
                    return tableData.length;
                }


                function removeRow(id, callback = null) {


                    $.getJSON("/tangocho_stuff", {
                        job: "delete",
                        id: id,
                    }).done(function () {
                        $wordsTable.find("tr").filter(function () {
                            return $(this).data("vocab_id") === id;
                        }).fadeTo(200, 0, function () {


                            $(this).remove();


                            // removing the data item from the tableData array
                            tableData = tableData.filter(function (row) {
                                return row.id !== id;
                            });


                            displayNumberItems();


                            // if there are no words at all, then removing "has-words" from the body
                            if ($wordsTable.find(".vocab-item").length < 1) {
                                $("body").removeClass("has-words");
                                loadingMessage.showNoWords();
                            }


                            callback && callback();
                        });
                    }).fail(function (d) {
                        log(d);
                    });
                }


                function allTRs() {
                    return trsDisplayed.concat(trsUndisplayed);
                }


                function removeAllRows() {
                    $(".vocab-item").remove();
                    $("body").removeClass("has-words");
                    exerciseButtons && exerciseButtons.show();
                    messageWindow.clear();
                    return this;
                }


                function setSortable() {
                    $wordsTable.toggleClass("sortable", !!folders.select.getCurrentFolder().id);
                    return this;
                }


                function clearTable() {
                    loadingMessage.empty();
                    trsUndisplayed.length = 0;
                    trsDisplayed.length = 0;
                    removeAllRows();
                    return this;
                }


                function refreshAudio(item = null) {


                    const allTheEnglishWords = tableData.map(row => row.english);


                    $.post("tangocho_stuff", { // NOTE have to use "post" because the data's too large for "get"
                        job: "get_audio_data",
                        items: item || allTheEnglishWords,
                    }).done(function (d) {
                        allTRs().forEach($row => {
                            const english = $row.find(".word.english").text();
                            if (d[english]) {
                                $row.attr("data-audio_file_name", d[english]).addClass("has-audio");
                            } else {
                                synthesizeAudio(english, function (d) {
                                    $row.attr("data-audio_file_name", d[english]).addClass("has-audio");
                                });
                            }
                        });
                    }).always(function (d) {
                        // log(d);
                    }).fail(function (d) {
                        log("get_audio_data failed!");
                        log(d);
                    });


                    return this;
                }


                $(window).on("scroll resize", displayTRs);


                $(".sort-arrow-holder").off("click").click(function () {
                    tableData.reverse();
                    buildTable(tableData);
                });


                this.clearTable = clearTable;
                this.buildTable = buildTable;
                this.removeAllRows = removeAllRows;
                this.getNumRows = getNumRows;
                this.removeRow = removeRow;
                this.setSortable = setSortable;
                this.refreshAudio = refreshAudio;
            }


            const messageWindow = (function () {


                tools.anyKeyDown(clear);


                const $messageWindow = $("#message-holder");


                function clearAllClasses() {
                    $messageWindow.removeClass("updated warning");
                }


                function show(text, klass) {
                    klass = klass || "warning";
                    clearAllClasses();
                    $messageWindow.empty().text(text).addClass(klass);
                }


                function clear() {
                    clearAllClasses();
                    show("");
                }


                return {
                    show,
                    clear
                };
            }());


            const loadingMessage = (function () {


                const $loadingMessage = $("#loading-message");
                const $loadingIcon = $loadingMessage.find("#now-loading-message").detach().removeClass("my-template");
                const $noWordsMessage = $loadingMessage.find("#no-words-message").detach().removeClass("my-template");


                function showNowLoading() {
                    $loadingMessage.empty().append($loadingIcon.clone());
                }


                function showNoWords() {
                    $loadingMessage.empty().append($noWordsMessage.clone());
                }


                function empty() {
                    $loadingMessage.empty();
                }


                showNowLoading();

                return {
                    showNowLoading,
                    showNoWords,
                    empty,
                };
            }());


            const folders = (function () {


                const controlButtons = (function () {


                    const buttons = [$("#folder-change-name-button"), $("#delete-folder-button")];

                    // private function
                    function setDisabledTo(value) {
                        buttons.forEach(function ($button) {
                            $button.attr({ disabled: value });
                        });
                    }


                    function disable() {
                        setDisabledTo(true);
                    }


                    function enable() {
                        setDisabledTo(false);
                    }


                    return {
                        disable,
                        enable,
                    };
                }());


                const select = (function () {


                    const $select = $("#tangocho-select");


                    $select.val(localStorage.last_tangocho_folder_opened);
                    $select.on("change", selectChangeHandler);


                    function selectChangeHandler() {
                        localStorage.last_tangocho_folder_opened = getCurrentFolder().id;
                        controlButtons[$select.val() ? "enable" : "disable"]();
                        wordsTable.clearTable();
                        getData();
                    }


                    function getAllFolders() {
                        return $select.find("option").map(function () {
                            return {
                                id: $(this).val(),
                                name: $(this).text()
                            };
                        }).get();
                    }


                    function getSelectHTML() {
                        return $select.html();
                    }


                    function getCurrentFolder() {


                        if ($select.find("option:selected").length === 0) {
                            $select.find("option").first().attr({ selected: true });
                        }


                        return $select.find("option:selected").map(function () {
                            return {
                                id: $(this).val(),
                                name: $(this).text()
                            };
                        }).get(0); // returning only the first member, 'cause there's only one
                    }


                    function changeSelectLabel(id, name) {
                        $select.find("option").filter(function () {
                            return $(this).val() === id;
                        }).text(name);
                    }


                    function reorderOptions(newOrder) {


                        const $optionTags = $select.find("option").filter(function () {
                            return $(this).val();
                        }).remove();


                        newOrder.forEach(function (id) {
                            $optionTags.filter(function () {
                                return $(this).val() === id;
                            }).appendTo($select);
                        });
                    }


                    function addOptionTag(obj) {
                        $("<option>").val(obj.id).text(obj.name).appendTo($select).attr({ selected: true });
                        $select.change();
                    }


                    function removeOptionTag(folder_id) {
                        $select.find("option").filter(function () {
                            return $(this).val() === folder_id;
                        }).remove();
                    }


                    function reset() {
                        $select.find("option").attr({ selected: false });
                        $select.find("option").filter(function () {
                            return $(this).val() === null;
                        }).attr({ selected: true });
                        $select.change();
                    }


                    return {
                        changeSelectLabel,
                        getAllFolders,
                        getCurrentFolder,
                        getSelectHTML,
                        reorderOptions,
                        addOptionTag,
                        reset,
                        removeOptionTag,
                    };
                }());


                const reorderBox = (function () {


                    $("#reorder-items-holder").sortable({
                        axis: "y",
                        stop: postNewOrder,
                        helper: "clone",
                        forceHelperSize: true
                    });


                    function postNewOrder() {
                        const idsInOrder = getIdsInOrder();
                        $.post("/tangocho_stuff", {
                            job: "change_order",
                            ids: idsInOrder
                        }).done(function () {
                            select.reorderOptions(idsInOrder);
                        }).fail(function (d) {
                            log(d);
                        });
                    }


                    function show() {
                        const folders = select.getAllFolders();
                        $("#reorder-items-holder").empty();
                        $("#reorderer").show();
                        $("#reorder-dismiss-button").off("click").click(hide);
                        $(window).on("keydown", function (e) {
                            e.which === 27 && hide();
                        });
                        folders.forEach(function (folder) {
                            if (folder.id) {
                                $("<p>").data({ id: folder.id }).text(folder.name).appendTo("#reorder-items-holder");
                            }
                        });
                    }


                    function getIdsInOrder() {
                        return $("#reorder-items-holder").find("p").map(function () {
                            return $(this).data("id") ? $(this).data("id") : null;
                        }).get();
                    }


                    function hide() {
                        $(window).off("keydown", function (e) {
                            e.which === 27 && hide();
                        });
                        $("#reorder-items-holder").empty();
                        $("#reorderer").hide();
                    }


                    return {
                        show,
                    };
                }());


                function createNewFolder() {


                    const newFolderName = tools.promptStringWithTrim({
                        label: "新しいフォルダー名は？",
                        placeholder: folders.select.getCurrentFolder().name
                    });


                    newFolderName && $.post("/tangocho_stuff", {
                        job: "create_new_folder",
                        name: newFolderName
                    }).done(function (d) {
                        d = JSON.parse(d);
                        select.addOptionTag(d);
                    }).fail(function (d) {
                        log(d);
                    });
                }


                function deleteFolder() {
                    if (!window.confirm("このフォルダーを削除しますか？\n\n単語は残ります。", "")) { return false; }
                    const folder_id = folders.select.getCurrentFolder().id;
                    $.post("/tangocho_stuff", {
                        job: "delete_folder",
                        folder_id: folder_id
                    }).done(function (d) {
                        folders.select.removeOptionTag(folder_id);
                        folders.select.reset();
                        wordsTable && wordsTable.removeAllRows();
                    }).fail(function (d) {
                        log(d);
                    });
                }


                function changeFolderName() {


                    const currentFolder = select.getCurrentFolder();
                    const newName = tools.promptStringWithTrim({
                        label: "新しいフォルダー名は？",
                        placeholder: currentFolder.name
                    });


                    newName && $.post("/tangocho_stuff", {
                        job: "change_folder_name",
                        id: currentFolder.id,
                        new_name: newName
                    }).done(function (e) {
                        select.changeSelectLabel(currentFolder.id, newName);
                    }).fail(function (e) {
                        log(e);
                    });
                }


                $("#new-folder-button").click(createNewFolder);
                $("#change-folder-order-button").click(reorderBox.show);
                $("#delete-folder-button").click(deleteFolder);
                $("#folder-change-name-button").click(changeFolderName);
                $("#reorderer-dismiss-button").click(reorderBox.hide);


                return {
                    select,
                };
            }());


            $("#words-input-form").submit(function (e) {


                e.preventDefault();


                const maxWordLength = 2000;
                const $input = $("#words-input");
                const text = tools.removeExtraWhiteSpace($input.val());
                if (!text) return log("No text to handle!");
                if (tools.countLanguageShifts(text) !== 1) return alert("Enter English and Japanese, in any order");


                const words = tools.splitAtLanguageShift(text);
                const english = words.english;
                const japanese = words.japanese;


                // checking to see if the words are too long
                if (english.length > maxWordLength || japanese.length > maxWordLength) {
                    messageWindow.show("英語または日本語が長すぎます！");
                    return;
                }


                /*
                 *
                 *      Beyond this point, the words are clean!
                 *
                 *
                 */


                $input.val(text); // overwriting the original input with the scrubbed text


                tangocho.add({
                    english: english,
                    japanese: japanese,
                    tangocho_folder: folders.select.getCurrentFolder().id,
                    callback: function () {
                        $input.focus();
                        messageWindow.show(`${english}・${japanese} が追加されました`, "updated");
                        synthesizeAudio(english, wordsTable.refreshAudio);
                        getData();
                    },
                    onFail: function (d) {
                        $input.focus().val("");
                        messageWindow.show("\"" + english + "\"" + " はすでに登録されているようです！");
                    }
                });
            });


            function synthesizeAudio(english, callback) {
                $.post("tangocho_stuff", {
                    job: "synthesize_audio",
                    english: english
                }).done(callback).fail(d => log(d));
            }


            function getData(folder_id) {


                loadingMessage.showNowLoading();


                $.getJSON("/tangocho_stuff", {
                    job: "get_tangocho_items",
                    folder_id: folders.select.getCurrentFolder().id,
                }).done(function (data) {
                    wordsTable.clearTable();
                    data.length ? wordsTable.buildTable(data).setSortable() : loadingMessage.showNoWords();
                    clearAllButton.enable(data.length === 0);
                    exerciseButtons.reset();
                }).fail(function (d) {
                    log("Error getting tangocho items!");
                    log(d);
                });
            }


            getData();
        });
    }
);
