define(
        [
            "jquery",
            "tools"
        ],
    function($, tools) {


        return function(settings) {


            if (!settings || typeof settings !== "object" || !settings.dropTarget) {
                console.log("imageFileUploader got some bad parameters!");
                return false;
            }


            settings = $.extend({
                url: null, // REQUIRED
                dropTarget: null, // REQUIRED, jQuery object
                fileType: "image", // may be "audio", too!
                fileExtension: "jpeg",
                maxWidth: null,
                maxHeight: null,
                maxFileSize: 1000 * 1000, // == 1Mb
                disablePageDrop: true,
                onUpload: function() {
                    //
                }
            }, settings);


            // disabling droppability on the HTML page as a whole
            if (settings.disablePageDrop) {
                $("html").on("dragover dragenter", function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                }).on("drop", function() {
                    return false;
                });
            }


            // wiring up the DOM element to receive the drop target
            // NOTE that we have to disengage a lot of default behaviors
            settings.dropTarget.on("dragover dragenter drop", function(e) {
                e.preventDefault();
                e.stopPropagation();
            }).on("drop", function(e) {
                var rawImage = e.originalEvent.dataTransfer.files[0]; // funky syntax
                uploadImage(rawImage);
            });


            function uploadImage(rawImage) {


                // checking for the correct file type
                if (!rawImage.type.match((settings.fileType + ".*"))) {
                    alert("File is not: " + settings.fileType + "!");
                    return false;
                }


                // resizing and, if a url is specified, sending the image
                processImage(rawImage, function(imageURI) {
                    if (settings.url) {
                        $.post(settings.url, {
                            image: imageURI
                        }).done(function() {
                            // we're all done, so do something useful
                        });
                    }
                });
            }


            function processImage(rawImage, callback) {


                if (arguments.length !== 2 || typeof callback !== "function") {
                    console.log("processImage takes an image and a callback function!");
                    return false;
                }


                // have to turn the raw data into an HTML image tag
                createImageTag(rawImage, function(imageTag) {

                    let imageURI = tools.imageToDataURL(imageTag, {
                        maxWidth: settings.maxWidth,
                        maxHeight: settings.maxHeight
                    });

                    callback(imageURI);
                });
            }


            function createImageTag(data, callback) {
                var imageTag = new Image();
                imageTag.onload = function() {
                    callback(imageTag);
                };
                imageTag.src = window.URL.createObjectURL(data);
            }
        };
    }
);