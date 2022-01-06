
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


        $("#all-texts-holder").find("span").draggable({ revert: true, revertDuration: 100, });


        tools.elementOnScreen($("#all-texts-holder"), function () {
            $.getJSON("settings_stuff", {
                job: "get_navbar_texts",
            }).done(function (object) {
                for (let section in object) {
                    object[section].forEach(obj => newTextSpan(section, obj.id, obj.textName));
                }
            }).fail(e => log(e));
        });


        $(".texts-holder").sortable({
            stop: updateNavbarTexts
        }).droppable({
            accept: ".all-text-text",
            drop: addTextToTOC
        });


        const newTextSpan = (function () {

            const $spanMaster = tools.makeTemplate($(".texts-holder .my-template"));

            return function (section, text_id, textName) {

                const $span = $spanMaster.clone().data("text_id", text_id).text(textName);
                const $parent = $(`.texts-holder[data-section='${section}']`);

                $parent.append($span);

                $span.dblclick(function () {
                    $(this).fadeOut(200, () => {
                        $(this).remove();
                        updateNavbarTexts();
                    });
                });

                return true;
            };
        }());


        function addTextToTOC(e, ui) {

            const text_id = $(ui.draggable).data("text_id");
            const section = $(e.target).data("section");
            const textName = $(ui.draggable).text();
            const textAlreadyThere = $(e.target).find("span").filter(function () {
                return $(this).data("text_id") === text_id;
            }).length;

            if (!textAlreadyThere) {
                newTextSpan(section, text_id, textName);
                updateNavbarTexts();
            }
        }


        function updateNavbarTexts() {

            const text_info = {};

            $(".texts-holder").each(function () {

                const section = $(this).data("section");

                $(this).find("span").each(function () {
                    const id = $(this).data("text_id");
                    const textName = $(this).text();
                    text_info[section] = text_info[section] || [];
                    text_info[section].push({ id, textName });
                });
            });

            $.post("settings_stuff", {
                job: "update_navbar_texts",
                text_info: text_info,
            }, function (e) {
                // log(e);
            }, "json").fail(function (e) {
                log("Failed");
                log(e);
            });
        }


        // retrieving revolving images
        const rotatingImageHandler = (function () {

            const $imagesHolder = $("#images-holder");

            $imagesHolder.sortable({
                stop: set_junban
            });

            // adding some styling
            $imagesHolder
                .on("dragover", () => $(this).addClass("dragover"))
                .on("dragleave drop", () => $(this).removeClass("dragover"));

            loadImages();

            const myDropzone = new Dropzone("#images-holder", {
                clickable: false,
                url: "/upload_rotating_image",
                createImageThumbnails: false,
                resizeWidth: 1000, // pixels
                success: () => loadImages(true), // true = loading only the most recent image
                error: (e, f) => log(e, f),
                init: function () { // disabling the thumbnail that appears after upload
                    this.on("addedfile", file => $(".dz-file-preview").css("display", "none"));
                }
            });

            // adds a single image thumbnail to the $imagesHolder
            function addImageThumbnail(file_name) {
                const $imgTag = $(`<img data-src="storage/${file_name}" data-file_name="${file_name}">`);
                $imgTag.on("dblclick", deleteImage).appendTo($imagesHolder);
                tools.elementOnScreen($imgTag, () => $imgTag.prop("src", $imgTag.data("src")));
            }

            function deleteImage() {

                const file_name = $(this).data("file_name");
                const $image = $(this);

                $.post("settings_stuff", {
                    job: "delete_image",
                    file_name: file_name
                }).done(function (e) {
                    $image.remove();
                }).fail(function (e) {
                    log(e);
                });
            }

            function loadImages(lastOnly) {

                if (!lastOnly) $imagesHolder.empty();

                $.getJSON("settings_stuff", {
                    job: lastOnly ? "get_last_rotating_image" : "get_all_rotating_images"
                }).done(function (image) {
                    image.forEach(addImageThumbnail);
                }).fail(function (e) {
                    log(e);
                });
            }

            function getAllImageFileNames() {
                return $imagesHolder.find("img").map((index, img) => $(img).data("file_name")).get();
            }

            function set_junban() {
                $.post("settings_stuff", {
                    job: "set_junban",
                    file_names: getAllImageFileNames(),
                }).fail(e => log(e));
            }

            return {
                //
            };
        }());


        $("#year-start-date-input").datepicker({ dateFormat: 'yy-mm-dd' });
        wireUpInput({
            input: $("#year-start-date-input"),
            key: "year_start_date",
            callback: d => $("#year-start-date-input").addClass("updated"),
        });


        // wiring up checkboxes
        wireUpInput({ input: $("#hide-user-names-checkbox"), key: "hide_user_names" });
        wireUpInput({ input: $("#allow-admin-user-login-checkbox"), key: "allow_admin_user_login" });
        wireUpInput({ input: $("#show-desktop-notifications-checkbox"), key: "show_desktop_notifications" });


        // wiring up text/number inputs
        wireUpInput({
            input: $("#poll-interval-input"),
            key: "poll_interval",
            callback: () => $("#poll-interval-input").addClass("updated"),
        });


        wireUpInput({
            input: $("#honkou-seito-registration-code-input"),
            key: "honkou_seito_registration_code",
            callback: () => $("#honkou-seito-registration-code-input").addClass("updated"),
        });


        wireUpInput({
            input: $("#backdoor-user-login-password-input"),
            key: "backdoor_user_login_password",
            callback: () => $("#backdoor-user-login-password-input").addClass("updated"),
        });


        wireUpInput({
            input: $("#clear-cache-button"),
            job: "clear_cache",
            callback: date => $("#current-cache").addClass("updated").text(date),
        });


        // NEW TEST
        wireUpInput({
            input: $("#user-registration-default-school"),
            key: "user_registration_default_school",
            callback: () => $("#user-registration-default-school").addClass("updated"),
        });


        wireUpInput({
            input: $("#user-registration-default-course"),
            key: "user_registration_default_course",
            callback: () => $("#user-registration-default-course").addClass("updated"),
        });


        wireUpInput({
            input: $("#user-registration-default-nen"),
            key: "user_registration_default_nen",
            callback: () => $("#user-registration-default-nen").addClass("updated"),
        });


        wireUpInput({
            input: $("#user-registration-default-kumi"),
            key: "user_registration_default_kumi",
            callback: () => $("#user-registration-default-kumi").addClass("updated"),
        });


        // password change is special...
        (function () {

            $("#new-password-input").on("focus", clearMessage).on("change", function () {

                let new_password = $("#new-password-input").val();
                new_password.trim();
                if (new_password === "") return passwordMessage("Password's blank!");

                $.post("settings_stuff", {
                    job: "change_admin_password",
                    new_password: new_password
                }).done(function () {
                    passwordMessage("Password updated!");
                    $("#new-password-input").val("");
                }).fail(function (e) {
                    passwordMessage("Update failed!");
                    log(e);
                });
            });

            function passwordMessage(text) {
                $("#password-message-window").text(text);
            }

            function clearMessage() {
                passwordMessage("");
            }
        }());


        function wireUpInput(obj) {

            const $input = tools.forceJQuery(obj.input);
            const appropriateChangeEvent = $input.getInputChangeEvent(); // from tools

            $input.on(appropriateChangeEvent, function () {

                if (obj.first) obj.first();

                $.post("settings_stuff", {
                    job: obj.job || "set_value",
                    key: obj.key,
                    value: $input.getInputValue(),
                }).done(function (e) {
                    if (obj.callback) obj.callback(e);
                }).fail(e => log(e));
            });
        }
    });
