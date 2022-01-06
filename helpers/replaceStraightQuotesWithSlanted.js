/*
 *
 *
 *      Takes a jQuery reference to a text input and
 *
 *      replaces straight quotes with slanted (both single and double),
 *
 *      and also trims white space
 *
 *
 */

define(
    [
        "jquery"
    ],
    function($) {
        return function($input, settings = {}) {


            if (!$input) {
                console.log("replaceStraightQuotesWithSlanted requires a jQuery reference to an id passed in!");
                return false;
            }


            let defaults = $.extend({
                doubleQuotes: "”",
                singleQuote: "’",
                trim: true
            }, settings);


            let value = $input.val();


            value = value.replace(/\'/g, defaults.singleQuote);
            value = value.replace(/\"/g, defaults.doubleQuotes);
            value = defaults.trim ? value.trim() : value;


            $input.val(value);


            return value;
        };
    }
);