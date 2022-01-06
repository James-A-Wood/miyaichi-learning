



define(
        [
            "jquery"
        ],
        function ($) {


            // takes a STRING reference to a class, e.g. ".line-number" (NOT jQuery!)
            return function (classToNumber, params) {


                params = params || {};


                if (!classToNumber) {
                    console.log("lineNumbering requires a class name passed in!");
                    return;
                }


                function renumber(callback) {


                    // removing all line-number things
                    $(classToNumber).empty().each(function () {


                        // getting the index of the current .line-number
                        var index = $(this).index(classToNumber);


                        // incrementing it by 1, so it's not zero-based
                        index += 1;


                        // appending the number, plus 1
                        $(this).append(index);
                    });


                    // calling the callback, if any
                    if (callback && $.isFunction(callback)) {
                        callback();
                    }


                    // calling any OTHER callbacks
                    if (params.callback && $.isFunction(params.callback)) {
                        params.callback();
                    }
                }


                return {
                    renumber: renumber
                };
            };
        }
);