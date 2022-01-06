/* jshint expr: true */
/* jshint loopfunc: true */


define(
    [
        "jquery",
        "libraries/dropzone",
    ],
    function (
        $
    ) {


        $(function () {


            const itemClass = ".dropzone-item";
            const selectedClass = "selected";
            const $dropZone = $("#dropzone");
            const $itemMaster = $dropZone.find(itemClass).detach().removeClass("my-template");


            $("#delete-all-button").click(deleteAllHandler);


            const myDropzone = new Dropzone("#dropzone", {
                clickable: false,
                url: "/upload_my_dropbox_file",
                success: retrieveData,
                error: (e, f) => {
                    log("Error!");
                    log(e, f);
                },
                init: function () { // disabling the thumbnail that appears after upload
                    this.on("addedfile", function (file) {
                        $(".dz-file-preview").css("display", "none");
                    });
                }
            });


            function retrieveData() {
                $.getJSON("my_dropbox_stuff", {
                    job: "get_files",
                }).fail(d => {
                    log("Couldn't retrieve data!");
                    log(d);
                }).done(generateFileIcons);
            }


            function generateFileIcons(obj) {
                $dropZone.empty();
                for (const key in obj) newItem(obj[key]);
            }


            function newItem(text) {
                const $item = $itemMaster.clone().appendTo($dropZone);
                $item.on("click", selectionHandler).find(".text-holder").text(text);
                $item.find(".download-button").on("click", downloadHandler);
                $item.find(".delete-button").on("click", deleteHandler);
            }


            function selectionHandler(event) {
                if ($(event.target).hasClass("btn")) return false;
                $(this).toggleClass(selectedClass).siblings().removeClass(selectedClass);
                return true;
            }


            function getText($btn) {
                return $btn.closest(itemClass).find(".text-holder").text();
            }


            function getAllFilenames() {
                return $(".text-holder").map(function () {
                    return $(this).text();
                }).get();
            }


            function downloadHandler() {
                const name = getText($(this));
                const link = document.createElement("a");
                link.download = name;
                link.href = `my_dropbox_folder/${name}`;
                link.click();
            }


            function deleteHandler() {
                const $row = $(this).closest(itemClass);
                const name = getText($(this));
                $.getJSON("my_dropbox_stuff", {
                    job: "delete_files",
                    file_names: [name],
                }).done(() => $row.fadeOut(400, () => $row.remove()));
            }


            function deleteAllHandler() {
                $.getJSON("my_dropbox_stuff", {
                    job: "delete_files",
                    file_names: getAllFilenames(),
                }).done(function () {
                    $(itemClass).fadeOut(400, function () {
                        $(this).remove();
                    });
                }).fail(d => log(d));
            }


            retrieveData();
        });
    });
