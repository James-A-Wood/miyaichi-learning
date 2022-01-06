define(
        [
            "jquery",
            "libraries/dropzone",
        ],
    function($) {


        return function(obj) {


            if (!obj || typeof obj !== "object") {
                console.log("UserImage got some bad parameters!");
                return false;
            }


            //optional
            const maxWidth = obj.maxWidth || 1000;
            const url = "/user_stuff" || obj.url;
            const $imageHolder = obj.imageHolder; // ONE OF
            const $imageTag = obj.imageTag; //  THESE TWO required
            const imageClass = obj.imageClass;


            function newImgTag(path, user_id) {
                return $(`<img src="${path}" data-user_id="${user_id}" class="${imageClass}">`);
            }


            function upload($dropTarget, user_id) {


                new Dropzone($dropTarget[0], {
                    init: function() {
                        this.on("addedfile", function(file) {
                            $(".dz-file-preview").css("display", "none");
                        });
                    },
                    url: "/upload_user_photo" + (user_id ? ("/" + user_id) : ""),
                    createImageThumbnails: false,
                    resizeWidth: maxWidth,
                    error: function(e, f) {
                        console.log(e, f);
                    },
                    success: function(string) {
                        get(user_id);
                    }
                });


                return this;
            }


            function get(user_id) {


                $.getJSON("/user_stuff", {
                    job: "get_user_image",
                    user_id: user_id
                }).done(function(path) {
                    if (!path) return false;
                    if ($imageTag) {
                        $imageTag.attr("src", path);
                    } else if ($imageHolder) {
                        $imageHolder.empty().append(newImgTag(path, user_id));
                    } else {
                        console.log("either imageTag or imageHolder must be specified!");
                        return false;
                    }
                }).fail(function(e) {
                    console.log(e);
                });


                return this;
            }


            function remove($imgTag) {
                user_id = $imgTag.data("user_id");
                $.post("/user_stuff", {
                    job: "remove_user_image",
                    user_id: user_id
                }).done(function(e) {
                    $imgTag.remove();
                }).fail(function(e) {
                    console.log(e);
                });
                return this;
            }


            return {
                get,
                upload,
                remove,
            };
        };
    }
);