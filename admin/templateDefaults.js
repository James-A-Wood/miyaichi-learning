define(
        [], // no dependencies 'cause it's just JSON
    function() {

        return {
            templateAliases: {
                test_assignment: "Test Assignment",
                blanks_drop: "Blanks Drop",
                card_slider: "Word Slider",
                card_drop: "Cards",
                narabekae: "Narabekae",
                narabekae_phrase: "Narabekae (Phrase)",
                narabekae_waei: "Narabekae (J→E)",
                fill_blanks: "Fill Blanks",
                pac_man: "PacMan",
                scrabble: "Scrabble",
                sentence_choosing: "Sentence Choosing",
                shinkei: "Shinkei",
                slingshot: "Pachinko",
                space: "Space Battle",
                spelling_narabekae: "Spell Narabekae",
                vocabulary: "Vocabulary",
                video: "Video",
                invaders: "Invaders"
            },
            checkboxesToShowForAll: {
                locked: true
            },
            checkboxesToShowFor: {
                card_drop: { use_user_vocab: true }, // true = check by default
                vocabulary: { use_user_vocab: true },
                card_slider: { use_user_vocab: true },
                fill_blanks: { shuffle: true, use_audio: false, },
                blanks_drop: { shuffle: true },
                invaders: { use_audio: false },
                narabekae: { use_audio: false, shuffle: true },
                narabekae_phrase: { use_audio: false, shuffle: true },
                narabekae_waei: { use_audio: false, shuffle: true },
                pac_man: { use_audio: true, shuffle: true },
                scrabble: { use_audio: true, use_user_vocab: true, shuffle: true },
                sentence_choosing: { true_false: false, use_audio: true, shuffle: true, use_user_vocab: false },
                shinkei: { use_audio: true, use_user_vocab: true },
                pachinko: { shuffle: true },
                space: { use_user_vocab: true },
                spelling_narabekae: { shuffle: true }
            },

            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
             *
             *
             *          These are the misc inputs for add for each type of assignment
             *
             *          NOTE "key" is the key of the key-value pair that the input will change on a
             *          JSON string (the value being the value of the input itself)
             *
             *
             * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
            miscInputs: {
                eitango_marathon: [
                    { type: "checkbox", label: "Show hints", key: "doShowHints", },
                    { type: "checkbox", label: "Disqualify on blur", key: "disqualifyOnPageBlur", },
                    { type: "checkbox", label: "Insert misspelled", key: "insertMisspelled", },
                    { type: "text", label: "Directions", key: "directions", newLine: true, },
                ],
                word_spelling: [
                    { type: "checkbox", label: "Show hints", key: "doShowHints", },
                    { type: "checkbox", label: "Insert misspelled", key: "insertMisspelled", },
                ],
                slingshot: [
                    { type: "checkbox", label: "Bounce off edges", key: "bounceOffStageEdge", },
                ],
                blanks_drop: [
                    { type: "checkbox", label: "Use Misspelled", key: "useMisspelled", },
                ],
                sentence_choosing: [
                    { type: "checkbox", label: "Use Misspelled", key: "useMisspelled", },
                ],
            },
            //
            //
            //
            // whether to use the audio or not
            hasAudio: {
                narabekae: true,
                fill_blanks: true,
                pac_man: true,
                scrabble: true,
                sentence_choosing: true,
                space: true,
                vocabulary: true,
                card_slider: true,
                card_drop: true,
                shinkei: true
            },
            //
            //
            //
            // fields hidden for ALL types
            hideForAll: [
                    ".max-mistakes",
                    ".time-limit",
                    ".time-limit-warning",
                    ".database-id",
                    ".directions",
                    ".extra-info",
                    ".video-length",
                ],
            //
            //
            //
            //fields that are extraneous for this template
            fieldsToHideFor: {
                video: [
                        ".misc",
                        ".delete-assignment-button",
                        ".number-sentakushi",
                        ".number-problems",
                        ".data-group"
                    ],
                card_slider: [
                        ".directions",
                        ".misc",
                        ".delete-assignment-button",
                        ".number-sentakushi",
                        ".number-problems",
                        ".video-id"
                    ],
                blanks_drop: [
                        ".number-sentakushi",
                        ".number-problems",
                        ".misc",
                        ".directions",
                        ".delete-assignment-button",
                        ".video-id"
                    ],
                narabekae_waei: [
                        ".number-sentakushi",
                        ".number-problems",
                        ".misc",
                        ".directions",
                        ".delete-assignment-button",
                        ".video-id"
                    ],
                vocabulary: [
                        ".misc",
                        ".number-problems",
                        ".number-sentakushi",
                        ".directions",
                        ".delete-assignment-button",
                        ".video-id"
                    ],
                scrabble: [
                        ".number-sentakushi",
                        ".number-problems",
                        ".misc",
                        ".directions",
                        ".delete-assignment-button",
                        ".video-id"
                    ],
                space: [
                        ".misc",
                        ".directions",
                        ".delete-assignment-button",
                        ".number-problems",
                        ".number-sentakushi",
                        ".video-id"
                    ],
                card_drop: [
                        ".misc",
                        ".directions",
                        ".delete-assignment-button",
                        ".video-id",
                        ".video-length"
                    ],
                shinkei: [
                        ".number-sentakushi",
                        ".misc",
                        ".directions",
                        ".delete-assignment-button",
                        ".video-id"
                    ],
                slingshot_blanks: [
                        ".number-sentakushi",
                        ".misc",
                        ".directions",
                        ".delete-assignment-button",
                        ".video-id"
                    ],
                narabekae: [
                        ".number-sentakushi",
                        ".number-problems",
                        ".misc",
                        ".directions",
                        ".delete-assignment-button",
                        ".video-id"
                    ],
                sentence_choosing: [
                        ".misc",
                        ".directions",
                        ".number-problems",
                        ".delete-assignment-button",
                        ".number-sentakushi",
                        ".video-id",
                        ".video-id",
                        ".video-length"
                    ],
                fill_blanks: [
                        ".number-sentakushi",
                        ".number-problems",
                        ".misc",
                        ".directions",
                        ".delete-assignment-button",
                        ".max-mistakes",
                        ".time-limit",
                        ".video-id",
                        ".video-length"
                    ],
                narabekae_phrase: [
                        ".number-sentakushi",
                        ".number-problems",
                        ".misc",
                        ".directions",
                        ".delete-assignment-button",
                        ".max-mistakes",
                        ".time-limit",
                        ".video-id",
                        ".video-length"
                    ],
                spelling_narabekae: [
                        ".number-sentakushi",
                        ".number-problems",
                        ".misc",
                        ".directions",
                        ".delete-assignment-button",
                        ".max-mistakes",
                        ".time-limit",
                        ".video-id",
                        ".video-length"
                    ],
                slingshot: [
                        ".number-sentakushi",
                        ".misc",
                        ".directions",
                        ".delete-assignment-button",
                        ".max-mistakes",
                        ".time-limit",
                        ".video-id",
                        ".video-length"
                    ],
                defender: [
                        ".number-sentakushi",
                        ".misc",
                        ".directions",
                        ".delete-assignment-button",
                        ".max-mistakes",
                        ".time-limit",
                        ".video-id",
                        ".video-length"
                    ],
                pac_man: [
                        ".number-sentakushi",
                        ".misc",
                        ".directions",
                        ".delete-assignment-button",
                        ".max-mistakes",
                        ".time-limit",
                        ".video-id",
                        ".video-length"
                    ],
            },
            buttonLabelsFor: {
                test_assignment: "Test Assignment",
                blanks_drop: "文法・ドリル",
                card_slider: "単語スライダー",
                card_drop: "カルタ",
                narabekae: "並べ替えよう",
                narabekae_phrase: "文法・並べ替えよう",
                narabekae_waei: "和英・並べ替え",
                fill_blanks: "空所を埋めよう",
                pac_man: "Pac Man",
                scrabble: "スクラブル",
                sentence_choosing: "意味はどっち？",
                shinkei: "神経衰弱",
                slingshot: "パチンコ",
                space: "宇宙バトル",
                spelling_narabekae: "スペル並べ替え",
                vocabulary: "単語ドリル",
                video: "Video"
            },
            defaultValuesFor: {
                test_assignment: {
                    ".button-label-input": "Test Assignment"
                },
                blanks_drop: {
                    ".button-label-input": "文法・ドリル",
                    ".number-sentakushi-input": null,
                    ".number-problems-input": null
                },
                card_slider: {
                    ".button-label-input": "単語スライダー",
                    ".number-sentakushi-input": 5,
                    ".number-problems-input": 4
                },
                card_drop: {
                    ".button-label-input": "カルタ",
                    ".number-sentakushi-input": 4,
                    ".number-problems-input": 5
                },
                narabekae: {
                    ".button-label-input": "並べ替えよう",
                    ".number-sentakushi-input": null,
                    ".number-problems-input": null
                },
                narabekae_phrase: {
                    ".button-label-input": "文法・並べ替えよう",
                    ".number-sentakushi-input": null,
                    ".number-problems-input": null
                },
                narabekae_waei: {
                    ".button-label-input": "和英・並べ替え",
                    ".number-sentakushi-input": null,
                    ".number-problems-input": null
                },
                fill_blanks: {
                    ".button-label-input": "空所を埋めよう",
                    ".number-sentakushi-input": null,
                    ".number-problems-input": null
                },
                pac_man: {
                    ".button-label-input": "Pac Man",
                    ".number-sentakushi-input": null,
                    ".number-problems-input": null
                },
                scrabble: {
                    ".button-label-input": "スクラブル",
                    ".number-sentakushi-input": null,
                    ".number-problems-input": null
                },
                sentence_choosing: {
                    ".button-label-input": "意味はどっち？",
                    ".number-sentakushi-input": 2,
                    ".number-problems-input": null
                },
                shinkei: {
                    ".button-label-input": "神経衰弱",
                    ".number-problems-input": 8,
                    ".number-sentakushi-input": null
                },
                slingshot: {
                    ".button-label-input": "パチンコ",
                    ".number-sentakushi-input": null,
                    ".number-problems-input": null
                },
                space: {
                    ".button-label-input": "宇宙バトル",
                    ".number-sentakushi-input": 3
                },
                spelling_narabekae: {
                    ".button-label-input": "スペル並べ替え",
                    ".number-sentakushi-input": null,
                    ".number-problems-input": null
                },
                vocabulary: {
                    ".button-label-input": "単語ドリル",
                    ".number-sentakushi-input": null,
                    ".number-problems-input": null
                },
                video: {
                    ".button-label-input": "Video",
                    ".number-sentakushi-input": null,
                    ".number-problems-input": null
                },
                invaders: {
                    ".button-label-input": "インベーダー",
                    ".number-sentakushi-input": null,
                    ".number-problems-input": null
                }
            }
        };
    }
);