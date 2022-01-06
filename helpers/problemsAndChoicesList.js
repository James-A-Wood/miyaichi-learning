/* jshint expr: true */

(function() {
    "use strict";
}());

define(
    [
        "jquery",
        "tools",
        "helpers/misspellings",
    ],
    function(
        $,
        tools,
        misspellingsGenerator
    ) {


        return function(inputs) {


            if (!inputs || typeof inputs !== "object") {
                log("This requires an object passed in!");
                return false;
            }


            // replacing 'problems' with 'problem'
            if (!inputs.problem && inputs.problems) {
                inputs.problem = inputs.problems;
            }


            const settings = $.extend({
                deleteAllChoices: false, // set to 'true' to delete all the choices as they're used
                numberSentakushi: 3,
                // audioFiles: null,
                problems: inputs.problem, // contains the words in raw form
                recycleProblems: false, // set to "true" to recycle all the words, so they never run out
                misc: {}
            }, inputs);


            // removing blanks from the array - shouldn't be necessary, but whatchagonnado?
            settings.problems.forEach(function(item) {
                item.forEach(function(choice, index, array) {
                    choice === "" && array.splice(index, 1);
                });
            });


            // converting to an array, if it's not an array already
            settings.problems = tools.objectToArray(settings.problems);


            // removing extra problems, if specified
            if (settings.number_problems) {
                settings.problems = tools.whittleDownArray(settings.problems, settings.number_problems);
            }


            // local variables
            const allProblemsArray = settings.problems.slice(); // holds all the problems in array form, never whittled down


            let remainingProblemsArray = allProblemsArray.concat(); // starts out as allProblemsArray, but is whittled down
            let remainingWords = []; // will hold all the English words
            let translationFor = getTranslations(settings, remainingWords);
            let currentProblem = []; // holds the current problem, in straight array form
            let numberOfSentakushi = 0; // to be changed later



            function getTranslations(settings, remainingWords) {


                let translationFor = {};


                // saving the J/E translations for all the E/J
                settings.problems.forEach(function(problem) {
                    const english = problem[0];
                    const japanese = problem[1];
                    translationFor[english] = japanese;
                    translationFor[japanese] = english;
                    remainingWords.push(english);
                });

                return translationFor;
            }


            // determing whether the problem is True-False by looking at
            // 1)  settings.misc.trueFalse, or
            // 2)  whether the only options are "true / false"
            const isTrueFalse = (function() {


                if (settings.misc.trueFalse) { return true; }


                // returning true if ALL sentakushi are either "true" or "false"
                const allSentakushiAreTF = settings.problems.every(problem => {
                    return (problem[1] === "true" || problem[1] === "false");
                });


                if (allSentakushiAreTF) { return true; }


                return false;
            }());


            // setting the number of sentakushi AFTER we've done the isTrueFalse thing
            numberOfSentakushi = getNumberOfSentakushi();


            function pickRandomProblem() {


                // replenishing the array here, if applicable
                if (remainingProblemsArray.length === 0 && settings.recycleProblems) {
                    remainingProblemsArray = allProblemsArray.concat();
                    remainingProblemsArray = tools.shuffle(remainingProblemsArray);
                }


                // choosing a random element from the remainingProblemsArray
                currentProblem = tools.pickOneFrom(remainingProblemsArray);
                const question = currentProblem[0];
                const correctAnswer = currentProblem[1];


                let indexOfCorrectAnswer = null;


                const choices = (function() {


                    if (isTrueFalse) {
                        indexOfCorrectAnswer = correctAnswer === "true" ? 0 : 1;
                        if (settings.misc.terms && settings.misc.terms.length === 2) {
                            return [settings.misc.terms[0], settings.misc.terms[1]]; // unshuffled!
                        } else {
                            return ["正しい", "正しくない"]; // unshuffled!
                        }
                    }


                    // NEW TEST - handling misspellings
                    if (settings.misc.useMisspelled) {
                        let array = misspellingsGenerator.getNumberOfMisspellings({
                            number: settings.numberSentakushi - 1,
                            word: question,
                            other: {
                                minNumber: 3,
                            }
                        });
                        array.unshift(question);
                        array = tools.shuffle(array);
                        indexOfCorrectAnswer = array.indexOf(question);
                        return array;
                    }


                    // selecting choices from OTHER problems if "globalSentakushi" is set, or if the problem has only one sentakushi
                    if (settings.problems[0].length === 2 || settings.misc.globalSentakushi) {


                        // getting choices from all OTHER problems, and removing the current problem from the array of choices
                        let allOtherProblems = allProblemsArray.concat();
                        allOtherProblems.splice(allOtherProblems.indexOf(currentProblem), 1);


                        // adding the [1] element (i.e. the choices) of each problem to the array
                        let array = allOtherProblems.map(thisProblem => thisProblem[1]);
                        array = tools.shuffle(array).slice(0, numberOfSentakushi - 1);
                        array.push(correctAnswer);
                        array = tools.shuffle(array);
                        indexOfCorrectAnswer = array.indexOf(correctAnswer);


                        return array;
                    }


                    /*
                     *
                     *  Beyond this point, choices come from
                     *  the current problem!
                     *
                     */


                    // removing some of the DUMMY choices at random, if numberOfSentakushi is less than the number of choices
                    while (currentProblem.length > numberOfSentakushi + 1) {
                        const rand = tools.pickIntFrom(currentProblem.length - 2);
                        currentProblem.splice(rand + 2, 1);
                    }


                    const array = tools.shuffle(currentProblem.slice(1)); // .slice(1) makes a copy of the array from the [1] element and on


                    indexOfCorrectAnswer = array.indexOf(currentProblem[1]);


                    return array;
                }());

                return { question, correctAnswer, choices, indexOfCorrectAnswer, numberOfSentakushi, };
            }


            function getNumberOfSentakushi() {

                // limiting numberOfSentakushi to 2 if we're in true-false mode
                if (isTrueFalse) { return 2; }

                // NOTE that number_sentakushi is only valid when 2 or greater
                if (settings.numberSentakushi && settings.numberSentakushi >= 2) {
                    return settings.numberSentakushi;
                }

                return 3; // default
            }


            function removeCurrentProblem() {


                const indexToErase = remainingProblemsArray.indexOf(currentProblem);
                remainingProblemsArray.splice(indexToErase, 1);


                if (settings.recycleProblems) {
                    if (remainingProblemsArray.length === 0) {
                        remainingProblemsArray = allProblemsArray.concat();
                    }
                }
            }


            const isSentences = (function() {


                let numberWithSpaces = 0;


                settings.problems.forEach(function(problem) {
                    const english = tools.getIdealAnswer(problem[0]);
                    if (english.indexOf(" ") !== -1) {
                        numberWithSpaces += 1;
                    }
                });


                return numberWithSpaces > (settings.problems.length / 2);
            }());


            return {
                isSentences,
                pickRandomProblem,
                removeCurrentProblem,
                getNumberRemaining: function() {
                    return remainingProblemsArray.length;
                },
                numberOfProblems: allProblemsArray.length,
                isTrueFalse: function() {
                    return isTrueFalse;
                },
                getTranslationFor: function(word) {
                    return translationFor[word];
                },
                getEnglishFor: function(word) {
                    return translationFor[word];
                },
                getJapaneseFor: function(word) {
                    return translationFor[word];
                },
                getTargetEnglish: function() {
                    return currentProblem[0];
                },
                getTargetJapanese: function() {
                    return currentProblem[1];
                },
                getRemainingWords: function() {
                    return remainingWords;
                }
            };
        };
    }
);