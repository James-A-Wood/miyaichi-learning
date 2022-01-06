/* jshint expr: true */
/* jshint loopfunc: true */


define(
    [
        "jquery",
        "tools",
        "libraries/dropzone",
    ],
    function (
        $,
        tools
    ) {


        $(function () {


            const itemClass = ".dropzone-item";
            const textHolderClass = ".text-holder";
            const selectedClass = "selected";
            const $dropZone = $("#dropzone");
            const $itemMaster = $dropZone.find(itemClass).detach().removeClass("my-template");


            $("#delete-all-button").click(deleteAllHandler);


            const dataCenter = (function () {

                const $numFilesDisplay = $("#total-files-number-holder");

                function displayNumberFiles() {
                    const num = getAllFilenames().length;
                    $numFilesDisplay.text(num);
                    $("#delete-all-button")[num ? "show" : "hide"]();
                }

                return {
                    displayNumberFiles,
                };
            }());


            const myDropzone = (function () {

                function checkForDuplicates(f) {
                    if (!f || !f.upload || !f.upload.filename) return false;
                    if (getAllFilenames().includes(f.upload.filename)) log("That file is already uploaded!");
                }

                return new Dropzone("#dropzone", {
                    clickable: false,
                    url: "/upload_user_file",
                    success: retrieveData,
                    dragover: () => $dropZone.addClass("now-dragging"),
                    dragend: () => $dropZone.removeClass("now-dragging"),
                    drop: () => $dropZone.removeClass("now-dragging"),
                    dragleave: () => $dropZone.removeClass("now-dragging"),
                    sending: checkForDuplicates,
                    uploadprogress: (file, progress, bytesSent) => {
                        $("#progress-bar").css("width", progress + "%");
                        log(progress);
                        if (progress === 100) {
                            $("#progress-bar").fadeOut(200, function () {
                                setTimeout(() => $("#progress-bar").css({
                                    opacity: 1,
                                    display: "block",
                                    width: "3%"
                                }), 400)
                            });
                        }
                    },
                    error: (e, f) => {
                        log("Error on drop!");
                        log(e, f);
                    },
                    init: function () { // disabling the thumbnail that appears after upload
                        this.on("addedfile", function (file) {
                            $(".dz-file-preview").css("display", "none");
                        });
                    }
                })
            }());


            function retrieveData() {
                $.getJSON("user_files_stuff", {
                    job: "get_user_files",
                }).fail(d => {
                    log("Couldn't retrieve data!");
                    log(d);
                }).done(generateFileIcons);
            }


            function generateFileIcons(obj) {
                $dropZone.empty();
                for (const key in obj) newItem(obj[key]);
                dataCenter.displayNumberFiles();
            }


            function newItem(text) {
                const $item = $itemMaster.clone().appendTo($dropZone);
                $item.on("click", selectionHandler).find(textHolderClass).text(text);
                $item.find(".download-button").on("click", downloadHandler);
                $item.find(".delete-button").on("click", deleteHandler);
            }


            function selectionHandler(event) {
                if ($(event.target).hasClass("btn")) return false;
                $(this).toggleClass(selectedClass).siblings().removeClass(selectedClass);
                return true;
            }


            function getText($btn) {
                return $btn.closest(itemClass).find(textHolderClass).text();
            }


            function getAllFilenames() {
                return $(textHolderClass).map(function () {
                    return $(this).text();
                }).get();
            }


            function downloadHandler() {
                const link = document.createElement("a");
                const name = getText($(this));
                const user_id = tools.userInfo("id"); // cool...
                if (!user_id || !name) return false;
                link.download = name;
                link.href = `user_files/id_${user_id}/${name}`;
                link.click();
            }


            function deleteHandler() {
                const $row = $(this).closest(itemClass);
                const name = getText($(this));
                $.getJSON("user_files_stuff", {
                    job: "delete_files",
                    file_names: [name],
                }).done(() => {
                    $row.fadeOut(200, () => {
                        $row.remove();
                        dataCenter.displayNumberFiles();
                    });
                });
            }


            function deleteAllHandler() {
                if (getAllFilenames().length === 0) return false;
                if (!confirm("全部削除するのか？まじで？")) return false;
                $.getJSON("user_files_stuff", {
                    job: "delete_files",
                    file_names: getAllFilenames(),
                }).done(function () {
                    $(itemClass).fadeOut(400, function () {
                        $(this).remove();
                        dataCenter.displayNumberFiles();
                    });
                }).fail(d => log(d));
            }


            retrieveData();
        });
    });
