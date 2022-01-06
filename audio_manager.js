/* jshint expr: true */

define(
    [
        "jquery",
        "tools",
        "helpers/replaceStraightQuotesWithSlanted",
        "helpers/playAudioOnClick",
        "jqueryui",
    ],
    function(
        $,
        tools,
        replaceStraightQuotesWithSlanted,
        playAudioOnClick
    ) {


        $(function() {


            const $audioManagerTable = $("#audio-manager-table");
            const $rowMaster = $audioManagerTable.find(".my-template").removeClass("my-template").detach();
            const $triggerMaster = $("#load-next-trigger").removeClass("my-template").detach();


            let lastIDloaded = null;


            retrieveData();


            function retrieveData(input = {}) {


                $("#load-next-trigger").remove();


                $.getJSON("/audio_manager_stuff", {
                    job: "retrieve_data",
                    below: input.belowID,
                    searchText: $("#search-text-input").val()
                }).done(d => {
                    d.forEach(buildNewRow);
                }).fail(d => {
                    console.log("Load error!");
                    console.log(d);
                });
            }


            function buildNewRow(thisAudio, index, array) {


                const $newRow = $rowMaster.clone();


                $newRow.find(".text_name").text(thisAudio.text_name);
                $newRow.find(".problem_group_name").text(thisAudio.problem_group_name);
                $newRow.data("audio_id", thisAudio.id);


                // wiring up the ID to click select the whole row when double-clicked
                $newRow.find(".audio-id").text(thisAudio.id).dblclick(function() {
                    $(this).closest("tr").toggleClass("selected");
                });


                // adding the English text to the text input
                $newRow.find(".audio-name").text(thisAudio.name);


                $newRow.find(".audio-delete").click(function() {


                    if (!window.confirm("Really delete this?")) return;


                    const ids_array = [thisAudio.id];


                    $.post("/audio_manager_stuff", {
                        job: "delete_audio",
                        ids_array: ids_array // can be single number or an array of numbers
                    }).done(function(d) {
                        ids_array.forEach(function(thisId) {
                            $(".data-row").filter(function() {
                                return $(this).data("audio_id") === thisId;
                            }).fadeTo(200, 0, function() {
                                $(this).remove();
                            });
                        });
                    }).fail(e => log(e));
                });


                // // adding a download button for the file
                // $newRow.find(".audio-download").find("a").attr({
                //     href: `/audio/${thisAudio.id}.mp3`,
                //     download: thisAudio.name + ".mp3",
                // });


                // wiring up the text input
                // $newRow.find(".audio-name").dblclick(function() {
                //
                //
                //     const $thisCell = $(this);
                //     $thisCell.addClass("selected");
                //
                //
                //     setTimeout(function() {
                //
                //
                //         // getting the new value, via prompt
                //         const newValue = window.prompt("New Value?", $thisCell.text());
                //         if (!newValue) {
                //             $thisCell.removeClass("selected");
                //         }
                //
                //
                //         log(thisAudio);
                //
                //
                //         editText({
                //             newValue: newValue,
                //             audio: thisAudio,
                //             onSuccess: function(returnedText) {
                //                 $thisCell.removeClass("updating selected").addClass("updated").text(returnedText);
                //             },
                //             onFail: function() {
                //                 $thisCell.removeClass("updating selected");
                //                 alert("Failed!");
                //             }
                //         });
                //     }, 50);
                // });


                $audioManagerTable.append($newRow);
                playAudioOnClick($newRow.find(".audio-sound"), thisAudio.id);
                lastIDloaded = thisAudio.id;


                // if it's the LAST row in this AJAX query, then adding new loadTrigger at the bottom
                if (index >= array.length - 1) {
                    addLoadTrigger();
                }
            }


            // function editText(p) {
            //
            //
            //     log(p);
            //
            //
            //     const thisAudio = p.audio,
            //         onSuccess = p.onSuccess,
            //         onFail = p.onFail;
            //
            //
            //     let newValue = p.newValue;
            //
            //
            //     if (!newValue || !thisAudio || !onSuccess) return false;
            //
            //
            //     newValue = newValue.trim();
            //     if (!newValue) {
            //         onFail();
            //         return;
            //     }
            //
            //
            //     newValue = newValue.replace(/\'/g, "’");
            //     newValue = newValue.replace(/\"/g, "”");
            //
            //
            //     $.post("/audio_manager_stuff", {
            //         job: "edit_text",
            //         new_text: newValue,
            //         id: thisAudio.id
            //     }).done(onSuccess).fail(onFail);
            // }


            function addLoadTrigger() {


                const $trigger = $triggerMaster.clone().appendTo($audioManagerTable);


                tools.elementOnScreen($trigger, function() {
                    retrieveData({ belowID: lastIDloaded });
                });
            }


            $("#search-text-input").change(function() {


                const text = $(this).val();
                $("tr.data-row").remove();


                if (text) {
                    $("body").addClass("searching-by-text");
                    lastIDloaded = null; // clearing the last ID loaded, so we reload everything from the top
                    retrieveData({ searchText: text });
                } else {
                    $("body").removeClass("searching-by-text");
                    retrieveData();
                }


                $(this).blur();
            });


            // whenever the search-text-input has focus, adding ".now-inputing-text" to the body
            // so that the page is grayed out
            $("#search-text-input").on("focus", function() {
                $("body").addClass("now-inputing-text");
            }).on("blur", function() {
                $("body").removeClass("now-inputing-text");
            });
        });
    }
);