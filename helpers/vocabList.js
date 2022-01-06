/* jshint expr: true */



define(
    [
        "jquery",
        "tools"
    ],
    function(
        $,
        tools
    ) {


        return function(inputs) {


            const settings = $.extend({
                words: [], // contains the words in raw form
                deleteAllChoices: false, // set to 'true' to delete all the choices as they're used
                recycleProblems: false, // set to "true" to recycle all the words, so they never run out
                numberSentakushi: 3,
            }, inputs || {});


            let english = []; // a straight array of all the English words
            let targetEnglishWord = ""; // holds the 'correct' English word
            let japaneseFor = {}; // object where English words are keys, e.g. {dog: '犬', cat: 'ネコ', ...}
            let englishFor = {}; // object where Japanese words are keys, e.g. {犬: 'dog', ネコ: 'cat', ...}
            let otherWordFor = {}; // holds English AND Japanese for ALL their Japnese and English counterparts
            let lastTargetEnglishWord = ""; // holds the previous target word, so we don't repeat the same word twice


            settings.words = tools.objectToArray(settings.words);


            if (settings.number_problems && settings.number_problems > 0) {
                tools.whittleDownArray(settings.words, settings.number_problems);
            }


            // putting all the words in their arrays and objects
            settings.words.forEach(function(thisPair) {


                const englishWord = thisPair.find(item => tools.isEnglish(item));
                const japaneseWord = thisPair.find(item => tools.isJapanese(item));


                japaneseFor[englishWord] = japaneseWord; // adding the japanese meaning to the object
                englishFor[japaneseWord] = englishWord; // adding the english meaning to the object


                otherWordFor[englishWord] = japaneseWord;
                otherWordFor[japaneseWord] = englishWord;


                english.push(englishWord); // adding the English to the array
            });


            let remainingWords = english.concat();
            let masterList = remainingWords.concat();


            function removeAnsweredWord(word) {


                // removing the word passed in, if any...
                if (word && remainingWords.indexOf(word) !== -1) {
                    remainingWords.splice(remainingWords.indexOf(word), 1);
                    return;
                }


                // ...or, if no word was passed in, then removing the targetEnglishWord
                remainingWords.splice(remainingWords.indexOf(targetEnglishWord), 1);


                if (remainingWords.length === 0 && settings.recycleProblems) {
                    remainingWords = masterList.concat();
                }
            }


            function getAndDeleteChoices(numberSentakushi) {


                numberSentakushi = numberSentakushi || settings.numberSentakushi || 3;


                if (remainingWords.length < numberSentakushi) {
                    remainingWords.length = 0; // emptying the array
                    remainingWords = english.concat();
                }


                let dummyChoices = [];
                for (let i = 0; i < numberSentakushi; i++) {
                    const word = tools.pickOneFrom(remainingWords, true); // 'true' == delete the word
                    dummyChoices.push(word);
                }


                return dummyChoices;
            }


            function getOneCorrectAndSomeDummy(numberSentakushi) {


                /*
                 *
                 *  Returns an array of words with the correct choice
                 *  in the [0] slot - meaning the array is NOT SHUFFLED!
                 *
                 */


                numberSentakushi = numberSentakushi || settings.numberSentakushi || 3;


                targetEnglishWord = tools.pickOneFrom(remainingWords);


                while (remainingWords.length >= 2 && (targetEnglishWord === lastTargetEnglishWord)) {
                    targetEnglishWord = tools.pickOneFrom(remainingWords);
                }


                lastTargetEnglishWord = targetEnglishWord;


                let dummyChoices = english.concat();
                dummyChoices.splice(dummyChoices.indexOf(targetEnglishWord), 1);


                let choicesArray = [targetEnglishWord]; // target as [0]
                while (choicesArray.length < numberSentakushi) {
                    const word = tools.pickOneFrom(dummyChoices, true);
                    choicesArray.push(word);
                }


                return choicesArray; // NOT SHUFFLED, so correct answer is in the [0] slot
            }


            return {
                popOne: function() {
                    return remainingWords.pop();
                },
                getTotalNumberProblems: function() {
                    return english.length;
                },
                getWordFor: function(word) {
                    return otherWordFor[word];
                },
                getTargetEnglish: function() {
                    return targetEnglishWord;
                },
                getTargetJapanese: function() {
                    return japaneseFor[targetEnglishWord];
                },
                getJapaneseFor: function(engWord) {
                    return japaneseFor[engWord];
                },
                getEnglishFor: function(japWord) {
                    return englishFor[japWord];
                },
                getRemainingWords: function() {
                    return remainingWords;
                },
                getNumberRemainingWords: function() {
                    return remainingWords.length;
                },
                getAllEnglishWords: function() {
                    return english;
                },
                removeAnsweredWord: removeAnsweredWord,
                getChoices: (settings.deleteAllChoices) ? getAndDeleteChoices : getOneCorrectAndSomeDummy
            };
        };
    }
);