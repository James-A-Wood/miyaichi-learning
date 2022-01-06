/*
 *
 *  Splits a sentence into words and returns those words in an array
 *
 *  If there are brackets, it treats everything between those brackets as
 *  sentakushi - returns the words before and after the brackets undisturbed, but
 *  splits the bracketed words at the commas, mixes them up, and returns them with
 *  an object containing the pieces and the shuffled sentakushi
 *
 *
 *
 */


define(
    [
        "tools",
        "helpers/misspellings",
    ],
    function(
        tools,
        misspellings
    ) {


        let settings = {};


        function shuffleSentakushiString(string, obj = {}) {

            /*
             *
             *      Takes a string of words (presumably sentakushi), separates them at the commas,
             *      and shuffles the array.
             *
             *      Also adds info, like the index of the correct answer and the answer itself
             *
             */

            obj = $.extend({
                splitOn: ",",
            }, obj);


            let sentakushis = tools.trimAllElements(string.split(obj.splitOn));
            const correctAnswer = sentakushis[0]; // assumes the first element is the answer


            if (settings.useMisspelled) {
                const correctAnswer = sentakushis[0];
                sentakushis = [correctAnswer].concat(misspellings.getNumberOfMisspellings({
                    word: correctAnswer,
                    number: settings.numberSentakushi - 1, // leaving space for the real answer
                }));
            }


            sentakushis = tools.shuffle(sentakushis);


            const correctAnswerIndex = sentakushis.indexOf(correctAnswer); // NOTE assumes no duplicates


            return {
                correctAnswerIndex,
                correctAnswer,
                sentakushi: sentakushis,
            };
        }


        function breakIntoTextAndSentakushi(string) {


            let returnObj = {
                pieces: [],
                stuffBeforeSentakushi: null,
                stuffAfterSentakushi: null,
                sentakushi: null,
                numberSentakushiGroups: 0,
            };


            if (string.indexOf("[") === -1) {
                string = `[${string}]`;
            }


            string = tools.removeSSMLTags(string);


            string.split("[").forEach(function(piece, index) {


                // if this piece is just text, then just adding it to the array and exiting
                if (piece.indexOf("]") === -1) {
                    const text = piece.trim();
                    if (text.length > 0) { // skipping empty strings, like ""
                        returnObj.pieces.push(text);
                    }
                    return;
                }


                // beyond this point, there IS a closing bracket, so we process the sentakushi
                let sentakushis = piece.split("]")[0].trim(); // everything before the closing bracket
                const remainingText = piece.split("]")[1].trim(); // everything after the closing bracket
                returnObj.numberSentakushiGroups += 1;
                sentakushis = shuffleSentakushiString(sentakushis);
                returnObj.pieces.push(sentakushis);


                // adding the string ONLY if it exists AND it's not an empty string
                if (remainingText && remainingText.length > 0) {
                    returnObj.pieces.push(remainingText);
                }
            });


            // *IF* there's only one sentakushis group, then adding extra info to the object itself
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


            settings = obj;


            obj = $.extend({
                numberSentakushi: 3,
            }, obj);


            if (!string || typeof string !== "string") {
                console.log("processSentence didn't receive a string to process!");
                return;
            }


            string = tools.removeExtraWhiteSpace(string);
            if (tools.brackets.notBalancedAndSame(string)) {
                console.log("Brackets are fucked up!");
                return false;
            }


            return breakIntoTextAndSentakushi(string);
        };
    }
);