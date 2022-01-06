define(
        [
            "tools"
        ],
    function(tools) {


        return function(inputs) {


            /*
             *
             *      inputs.baseArray - (REQUIRED) array of words to cycle through
             *      inputs.shuffle - (optional) whether or not to shuffle the baseArray
             *
             *
             */


            if (!inputs || typeof inputs !== "object" || !inputs.baseArray || !Array.isArray(inputs.baseArray)) {
                console.log("tools.wordPool requires an object with array property 'baseArray'!");
                return;
            }


            inputs = $.extend({
                replenish: true,
            }, inputs);


            // copying the array so we're not messing with the original
            let baseArrayCopy = inputs.baseArray.concat();


            // NEW TEST whittling down if there are too many problems
            inputs.numberProblems && tools.whittleDownArray(baseArrayCopy, inputs.numberProblems);


            if (inputs.shuffle !== false) {
                baseArrayCopy = tools.shuffle(baseArrayCopy);
            }


            let whittleArray = baseArrayCopy.concat();


            function getNextWord() {

                const wordToReturn = whittleArray.shift();

                // replenishing the array if it's now empty
                if (inputs.replenish && whittleArray.length === 0) {
                    whittleArray = baseArrayCopy.concat();
                }

                return wordToReturn;
            }


            function getArrayOf(number) {

                if (!number || isNaN(number)) {
                    console.log("wordPool.getArrayOf() takes a number!");
                    return false;
                }

                let array = [];
                for (let i = 0; i < number; i++) {
                    array.push(getNextWord());
                }

                return array;
            }


            function getAllWords() {
                return baseArrayCopy;
            }


            return { getNextWord, getArrayOf, getAllWords };
        };
    });