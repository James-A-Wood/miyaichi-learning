/*
 *
 *  Splits a sentence into words and returns those words in an array
 *
 *  If there are brackets, it treats everything between those brackets as
 *  sentakushi - returns the words before and after the brackets undisturbed, but
 *  splits the bracketed words at the commas, mixes them up, and returns them with
 *  an object containing the pieces, and the sentakushi, already shuffled
 *
 *
 *
 */


define(
        [
            "tools",
        ],
    function(tools) {


        function shuffleSentakushiString(string, splitOn) {

            /*
             *
             *      Takes a string of words (presumably sentakushi), separates them at the commas,
             *      and shuffles the array.
             *
             *      Also adds info, like the index of the correct answer and the answer itself
             *
             */

            splitOn = splitOn || ",";

            let sentakushis = string.split(splitOn);
            sentakushis = tools.trimAllElements(sentakushis); // NEW TEST added {shuffle: true} instead of shuffling manually
            const correctAnswer = sentakushis[0]; // assumes the first choice is the answer
            const correctAnswerIndex = sentakushis.indexOf(correctAnswer); // NOTE assumes no duplicates
            sentakushis = tools.shuffle(sentakushis);

            return { correctAnswerIndex, correctAnswer, sentakushi: sentakushis };
        }


        function breakIntoTextAndSentakushi(string) {


            let returnObj = {
                pieces: [],
                stuffBeforeSentakushi: null,
                stuffAfterSentakushi: null,
                sentakushi: null
            };


            string.split("[").forEach(function(piece, index) {


                // if this piece is just text, then just adding it to the array and exiting
                if (piece.indexOf("]") === -1) {
                    const text = piece.trim();
                    if (!text.length) { // skipping empty strings
                        returnObj.pieces.push(text);
                    }
                    return;
                }


                // beyond this point, there IS a closing bracket, so we process the sentakushi
                let sentakushis = piece.split("]")[0].trim(); // everything before the ]
                const remainingText = piece.split("]")[1].trim(); // everything after the ]


                // keeping track of how many groups of sentakushi we have
                returnObj.numberSentakushiGroups += 1;


                // adding the object to the array
                sentakushis = shuffleSentakushiString(sentakushis);
                returnObj.pieces.push(sentakushis);


                // adding the string ONLY if it exists AND it's not an empty string
                if (remainingText && remainingText.length > 0) {
                    returnObj.pieces.push(remainingText);
                }
            });


            if (returnObj.numberSentakushiGroups === 1) {
                if (typeof returnObj.pieces[0] === "string") {
                    returnObj.stuffBeforeSentakushi = returnObj.pieces[0];
                    returnObj.sentakushi = returnObj.pieces[1];
                    if (returnObj.pieces.length === 3) {
                        returnObj.stuffAfterSentakushi = returnObj.pieces[2];
                    }
                } else {
                    returnObj.stuffBeforeSentakushi = null;
                    returnObj.sentakushi = returnObj.pieces[0];
                    returnObj.stuffAfterSentakushi = returnObj.pieces[1];
                }
            }


            return returnObj;
        }


        return function(string, obj = {}) {


            // checking if nothing was passed in, or if it wasn't a string
            if (!string || typeof string !== "string") {
                console.log("processSentence didn't receive a string to process!");
                return;
            }


            // scrubbing string - making sure brackets are balanced, and there are no multiple spaces
            string = tools.removeExtraWhiteSpace(string);
            if (tools.brackets.notBalancedAndSame(string)) {
                console.log("Brackets are fucked up!");
                return false;
            }


            obj = $.extend({
                useMisspellings: true,
                numberSentakushi: 3,
            }, obj);


            return breakIntoTextAndSentakushi(string);
        };
    }
);