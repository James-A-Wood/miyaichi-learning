define(
    [
        "jquery"
    ],
    function ($) {


        return function (params) {


            // checking that params is an object with a "url" property which is a string
            if (!params || typeof params !== "object" || !params.url || typeof params.url !== "string") {
                return console.log("imageFileUploader got some bad parameters!");
            }


            // wiring up the WHOLE PAGE to be the drop target
            // NOTE that we have to disengage a lot of default behaviors
            $("html").on("dragover dragenter", function (e) {
                e.preventDefault();
                e.stopPropagation();
            }).on("drop", function (e) {
                console.log("Dropped!");
                e.preventDefault();
                e.stopPropagation();
                const files = e.originalEvent.dataTransfer.files; // funky syntax
                upload(files);
            });


            function upload(files) {

                if (!files) return console.log("No file!");

                // only JPEG
                if (!files[0].type.match("jpeg")) return console.log("Not .jpg!!");

                // max size 5MB
                if (files[0].size > (5000000)) return console.log("File too big! " + files[0].size);


                const formData = new FormData();
                formData.append("files", files, "my_file.jpg"); // add ".jpg" 'cause server checks for


                // adding event listener BEFORE sending the request
                const ajax = new XMLHttpRequest();
                ajax.onreadystatechange = function () {
                    if (ajax.status && ajax.status === 200 && ajax.readyState === 4) {
                        console.log("Uploaded!");
                        if (params.onUpload) params.onUpload();
                    }
                };
                ajax.open("POST", "/upload_user_photo", true);
                ajax.send(formData);
            }
        };
    }
);
