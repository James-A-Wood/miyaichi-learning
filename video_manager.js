/* jshint expr: true */

define(
    [
        "jquery",
        "tools",
        "libraries/clipboard.min",
        "jqueryui",
    ],
    function(
        $,
        tools,
        Clipboard
    ) {


        $(function() {


            let rowData = {};


            const clipboard = new Clipboard(".copy-to-clipboard-button", {
                text: function(trigger) {
                    return $(trigger).data("embed_code");
                }
            }).on("success", function(e) {
                $(".copy-to-clipboard-button").text("Copy to clipboard").removeClass("copied");
                $(e.trigger).text("Copied!").addClass("copied");
            });


            const newVideo = (function() {


                const $form = $("#new-video-form");
                const $messageWindow = $("#new-video-message-window");


                // extracting the embed code, if the whole URL string was pasted in (which is likely)
                $("#embed-code-input").change(function() {
                    if ($(this).val().indexOf("embed/") !== -1) {
                        const embedCode = $(this).val().split("embed/")[1].split("\"")[0];
                        $(this).val(embedCode);
                    }
                });


                $form.submit(e => {
                    e.preventDefault();
                    $.post("video_stuff", {
                        job: "new_video",
                        video: {
                            embed_code: $("#embed-code-input").val(),
                            title: $("#title-input").val(),
                            description: $("#description-input").val(),
                            keywords: $("#keywords-input").val(),
                        },
                    }).done(d => {
                        clearAll();
                        $("body").addClass("disabled");
                        location.reload();
                    }).fail(d => {
                        log("Failed!");
                        log(d);
                    });
                });


                function clearAll() {
                    $form.find("input").val("");
                    return this;
                }


                function message(text = "") {
                    $messageWindow.html(text);
                    return this;
                }


                function clearMessage() {
                    message("");
                }


                return {
                    message,
                    clearMessage,
                };
            }());


            $(".delete-button").click(function() {


                if (!confirm("Really delete?")) return false;


                const $row = $(this).closest(".video-holder");
                const id = $row.data("id");


                $.post("video_stuff", {
                    job: "delete_videos",
                    ids: [id],
                }).done(e => {
                    $row.fadeTo(400, 0, () => $row.remove());
                }).fail(e => {
                    log(e);
                });
            });
            $(".editable").click(updateValue);


            $(".youtube-holder").each(function() {
                const $holder = $(this);
                const src = $holder.data("src");
                tools.elementOnScreen($holder, function() {
                    $holder.find("iframe").attr("src", src);
                });
            });


            function updateValue() {


                const $row = $(this);
                const $holder = $row.closest(".video-holder");
                const id = $holder.data("id");
                const column = $row.data("column");
                const isCheckbox = $row.attr("type") === "checkbox";


                let newValue = null; // get below


                if (isCheckbox) {
                    newValue = $(this).is(":checked") ? 1 : 0;
                } else {
                    const currentValue = $row.html();
                    newValue = prompt("New Value?", currentValue);
                    if (newValue) {
                        newValue = newValue.trim();
                    }
                    if (newValue === currentValue) return;
                }


                $.post("video_stuff", {
                    job: "update_value",
                    id: id,
                    column: column,
                    new_value: newValue,
                }).done(d => {
                    !isCheckbox && $row.html(newValue).addClass("updated");
                }).fail(d => {
                    log(d);
                });
            }


            const keywords = (function() {


                const $keywordsHolder = $("#common-keywords-holder");
                const $keywordFilterInput = $("#keyword-filter-input");
                const $andOrRadios = $("input[type='radio'][name='and-or-radio']");
                const $clearButton = $("#clear-keywords-button");


                $clearButton.click(function() {
                    $keywordFilterInput.val("").change();
                });


                $andOrRadios.change(function() {
                    $keywordFilterInput.change();
                });


                // building an object in the format {keyword: numTimesPresent}
                const kwords = {};
                $(".video-holder").each(function() {
                    $(this).find(".keyword-holder").text().toLowerCase().replace(/\s{2+}/g, " ").replace(",", "").trim().split(" ").forEach(word => {
                        kwords[word] = kwords[word] ? kwords[word] + 1 : 1;
                    });
                });


                // building an array of those keywords, in order of frequency (most frequent first)
                const byOrder = Object.keys(kwords).sort((a, b) => kwords[b] - kwords[a]);


                getMostPopularKeywords().forEach(word => {
                    $keywordsHolder.append(`<span class="keyword-shortcut-button">${word}</span>`);
                });


                $(".keyword-shortcut-button").click(function() {


                    const currText = $keywordFilterInput.val();
                    const space = currText ? " " : "";
                    const newAddition = $(this).text();


                    if (tools.stringsIntersect(newAddition, currText)) return false; // no duplicate words


                    $keywordFilterInput.val(currText + space + newAddition).change();
                });


                $keywordFilterInput.change(function() {


                    $(".video-holder").show();


                    const filterKeywords = $(this).val().replace(/\s{2+}/g, " ").toLowerCase().trim().split(" ").filter(item => item !== ""); // array of words, removing empty strings
                    const everyOrSome = $("input[name='and-or-radio']:checked").val() === "any" ? "every" : "some";


                    if (!filterKeywords.length) return;


                    // hiding rows that do not apply
                    $(".video-holder").filter(function() {
                        const thisVideoKeywords = $(this).find(".keyword-holder").text().trim().toLowerCase().split(" ");
                        return filterKeywords[everyOrSome](word => thisVideoKeywords.indexOf(word) === -1);
                    }).hide();
                });


                function getMostPopularKeywords(numberToGet = 5) {
                    return byOrder.slice(0, numberToGet);
                }


                return {
                    getMostPopularKeywords,
                };
            }());
        });
    });