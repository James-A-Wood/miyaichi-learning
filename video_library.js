/* jshint expr: true */




define(
    [
        "jquery",
        "tools",
    ],
    function(
        $,
        tools
    ) {

        $(function() {


            $(".youtube-holder").each(function() {
                const $iframe = $(this).find("iframe");
                const embed_code = $(this).data("src");
                tools.elementOnScreen($(this), function($this) {
                    $iframe.prop("src", embed_code);
                });
            });


        });
    }
);