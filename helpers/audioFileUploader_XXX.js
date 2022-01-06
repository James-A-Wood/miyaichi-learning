define(
        [
            "jquery"
        ],
    function($) {


        return function(params) {

            if (!params || typeof params !== "object" || !params.url || typeof params.url !== "string") {
                console.log("audioFileUploader got some bad parameters!");
                return false;
            }

            // wiring up the WHOLE PAGE to be the drop target
            // NOTE that we have to disengage a lot of default behaviors
            $("html").on("dragover dragenter", function(e) {
                e.preventDefault();
                e.stopPropagation();
            }).on("drop", function(e) {
                e.preventDefault();
                e.stopPropagation();
                const files = e.originalEvent.dataTransfer.files; // funky syntax
                upload(files);
            });


            function upload(files) {

                if (files.length === 0) {
                    alert("No files to upload!");
                    return false;
                }

                let fileNames = [];
                let formData = new FormData();
                const $problemHolders = $(".row-selected");
                const textInputClass = "problem-input";

                // warning and exiting if no rows are selected
                if (!$problemHolders.length) {
                    alert("Select some rows first!");
                    return false;
                }

                // grabbing the content of the FIRST .problem-input, and putting it in the fileNames array
                $problemHolders.each(function() {
                    const value = $(this).find("." + textInputClass).eq(0).val();
                    fileNames.push(value);
                });

                if (fileNames.length !== files.length) {
                    alert("Number of files doesn't match number of selected rows!");
                    return;
                }

                // cycling through the files object, preparing the FormData object
                // NOTE that we have to use for loop on the "files" object; can't use forEach!
                for (let i = 0; i < files.length; i++) {
                    if (!files[i].type.match(".mp3") || !files[i].size > 500000) { // 5 megabytes
                        alert("File(s) too large or not .mp3!");
                        return false;
                    }
                    formData.append("files[]", files[i], fileNames[i] + ".mp3"); // have to add ".mp3" because the server checks for this file extension!
                }

                // not using jQuery 'cause it's not good with file uploads
                var ajax = new XMLHttpRequest();

                // wiring up to check for COMPLETION
                ajax.onreadystatechange = function() {
                    if (ajax.status && ajax.status === 200 && ajax.readyState === 4) {
                        if (params.onUpload) {
                            console.log("Uploaded!");
                            params.onUpload();
                        }
                    }
                };


                // // checking for PROGRESS
                // ajax.upload.addEventListener("progress", function(event) {
                //     // do some stuff here!
                //     // var percent = (event.loaded / event.total) * 100;
                // });


                // adding the text_id & problem_group_id to the URL, so we can save that info
                // in the database along with the file name
                const string = params.text_id() + "/" + params.problem_group_id();


                // FINALLY opening the connection, and sending the form
                ajax.open("POST", params.url + string, true);
                ajax.send(formData);
            }
        };
    }
);