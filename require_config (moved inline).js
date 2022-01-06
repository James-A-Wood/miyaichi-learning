
/*
 *    Moved inline!  So this is no longer used!
 */


var requirejs = {

    baseUrl: "/js",

    // NEW TEST
    // Tagging on a meaningless query string to js download, to fetch latest version
    urlArgs: function (id, url) {
        return (url.indexOf("?") === -1 ? "?" : "&") + "bust=v17";
    },

    // manually specifying dependencies, or the variable the library exports
    shim: {
        bootstrap: {deps: ["jquery"]}, // telling it that boostrap requires jquery
        jqueryui: {deps: ["jquery"]}
    },

    // defining paths - CDN where possible, with local fallbacks
    paths: {
        TweenLite: [
            "libraries/gsap/TweenLite.min"
        ],
        TweenMax: [
            "libraries/gsap/TweenMax.min"
        ],
        TweenMax_CSSPlugin: [
            "libraries/gsap/plugins/CSSPlugin.min"
        ],
        TweenMax_EasePack: [
            "libraries/gsap/easing/EasePack.min"
        ],
        jquery: [
            "http://ajax.aspnetcdn.com/ajax/jQuery/jquery-2.2.3.min",
            "libraries/jquery"
        ],

        jqueryui: [
            "http://ajax.aspnetcdn.com/ajax/jquery.ui/1.12.1/jquery-ui.min",
            "libraries/jquery-ui.min"
        ],
        bootstrap: [
            "http://ajax.aspnetcdn.com/ajax/bootstrap/3.3.6/bootstrap.min",
            "libraries/bootstrap.min"
        ],
        Konva: [
            "libraries/konva.min",
            "https://cdn.rawgit.com/konvajs/konva/1.0.2/konva.min"
        ],
        tools: "helpers/tools",
        howler: [
            "https://cdnjs.cloudflare.com/ajax/libs/howler/1.1.29/howler.min",
            "libraries/howler"
        ]
    }
};



