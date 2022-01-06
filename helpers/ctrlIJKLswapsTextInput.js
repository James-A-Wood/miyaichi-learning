/*
 *
 *
 *      Swaps the values of two adjacent text inputs, assuming they're not hidden,
 *      using Ctrl + I/J/K/L
 *
 *      Assumes one of the text inputs has focus
 *
 *
 *
 */



define(
        [
            "jquery"
        ],
    function($) {


        let hasBeenInstantiated = false;
        let isPaused = false;


        // takes an object with ".className" property
        return function(params) {


            if (hasBeenInstantiated) {
                return;
            }


            hasBeenInstantiated = true;


            if (!params || !params.className) {
                console.log("ctrlIJKLswapsInput got incorrect or no parameters!");
                return false;
            }


            $(window).off("keydown", markForSwap).on("keydown", markForSwap);


            function markForSwap(e) {
                const key = e.which;
                if (e.ctrlKey && $(document.activeElement).hasClass(params.className) && key >= 73 && key <= 76) {
                    e.preventDefault();
                    swapContent(key === 73 || key === 74 ? "prev" : "next");
                }
            }


            function swapContent(direction) {


                if (isPaused) { return false; }


                let $thisCell = $(document.activeElement);
                let $otherCell = $thisCell[direction](); // gets either ".prev" or ".next", depending on what 'direction' is set to


                // exiting if the $otherCell doesn't exist or is not displayed
                if (!($otherCell.hasClass(params.className)) || $otherCell.css("display") === "none") {
                    return;
                }


                /*
                 *
                 *
                 *    Beyond this point, cells are swappable, so swapping them
                 *
                 *
                 */


                // saving the values in throwaway variables
                let val1 = $thisCell.val();
                let val2 = $otherCell.val();


                // performing the swap, and calling ".change"
                isPaused = true; // pausing until the AJAX goes through
                (params.updateHandler).saveChangesToSendAtOnceModeOn();
                $thisCell.val(val2).change();
                $otherCell.val(val1).change();
                (params.updateHandler).sendChangesToServer(function() {
                    isPaused = false;
                });


                // moving focus and adding fade-in effect (eye candy)
                $otherCell.focus().css({ opacity: 0 }).fadeTo(400, 1);
            }
        };
    });