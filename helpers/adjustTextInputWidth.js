define(
        [
            "jquery",
        ],
    function($) {


        return function(minimumWidth, endBuffer) {


            if (endBuffer && isNaN(endBuffer)) {
                console.log("tools.adjustTextInputWidth requires an INT for the endBuffer!");
                return false;
            }


            minimumWidth = minimumWidth || 150;
            endBuffer = endBuffer ? endBuffer : 0;


            let $hiddenDiv = $("<div id='text-input-width-adjuster'></div>").appendTo("body");


            return function($input) {


                // failing gracefully
                if (!$input) {
                    console.log("adjustTextInputWidth requires a jQuery reference to a text input as a parameter!");
                    return false;
                }


                // styling the div identically to the text input,
                // and adding the text to the div
                $("#text-input-width-adjuster").css({
                    fontSize: $input.css("font-size"),
                    padding: $input.css("padding") || "0px 10px",
                    fontWeight: $input.css("font-weight"),
                    position: "absolute",
                    display: "inline-block",
                    visibility: "hidden"
                }).text($input.val());


                // getting the width of the div
                var width = $hiddenDiv.outerWidth(true);


                // maintaining a minimum width for number inputs
                if ($input.attr("type") === "number") {
                    width = Math.max(47, width);
                }


                // keeping a minimum width to the input
                if (minimumWidth && (width < minimumWidth)) {
                    width = minimumWidth;
                }


                width += (endBuffer * 2);
                $input.css({ width: width });


                return true;
            };
        };
    }
);