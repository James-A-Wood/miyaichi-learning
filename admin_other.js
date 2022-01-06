/* jshint expr: true */


define(
    [
        "jquery",
        "tools",
        // "libraries/qrcode.min",
        // "jqueryui",
    ],
    function(
        $,
        tools
    ) {


        $(function() {


            const dropZone = (function() {


                const itemClass = "dropzone-item";
                const selectedClass = "selected";


                $(".dropzone-item").draggable();


                function download() {
                    log("In the download function");
                }


                function refresh(callback) {
                    $.getJSON("dropbox_get_files").done(() => {
                        log("OK");
                        callback && callback();
                    });
                }


                return {
                    refresh,

                };
            }());



        });
    });