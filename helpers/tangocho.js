/* jshint expr: true */


define(
    [
        "jquery",
        "tools",
    ],
    function (
        $,
        tools
    ) {


        return (function () {

            /*
             *
             *          Takes words from some assignment (e.g. 単語ドリル) and sends
             *
             *          them to the server
             *
             *
             *
             */

            let mistakenWordsList = {}; // e.g. {cat: "猫", dog: "犬"}


            function add(p) {


                if (!p || typeof p !== "object" ||
                    !p.english ||
                    !p.japanese ||
                    !tools.isEnglish(p.english) ||
                    !tools.isJapanese(p.japanese) ||
                    (p.callback && typeof p.callback !== "function")) {
                    console.log("Bad parameters!");
                    return false;
                }


                const english = p.english;
                const japanese = p.japanese;
                const tangocho_folder = p.tangocho_folder;
                const callback = p.callback;
                const onFail = p.onFail;


                if (mistakenWordsList.hasOwnProperty(english)) return false;


                $.post("/tangocho_stuff", {
                    job: "add",
                    words: {
                        english: english,
                        japanese: japanese,
                        tangocho_folder_id: tangocho_folder
                    }
                }).done(function (e) {
                    mistakenWordsList[english] = japanese;
                    callback && callback(e);
                }).fail(function (e) {
                    log(e);
                    onFail && onFail(e);
                });
            }


            return {
                add,
                getItems: () => mistakenWordsList,
            };
        }());
    }
);
