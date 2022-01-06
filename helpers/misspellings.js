

(function () {
    "use strict";
}());


define(
    [
        "jquery",
        "tools",
    ],
    function (
        $,
        tools
    ) {


        const isCapital = char => char.toUpperCase() === char;


        const expertPatterns = [

            //
            //
            // word start
            //
            [/\bwr/, "r"], // write --> rite
            [/\bv/g, "b"], // vest --> best
            [/\boc([^aeiou])/, "ac$1"], // octopus --> actopus
            [/\b([^aeiou])l([aeiou])/g, "$1r$2"], // climate --> crimate
            [/\b([^aeiou])o([^aeiou])([^e])/, "$1a$2$3"], // color --> calor
            [/\bint/, "ent"], // integer --> enteger
            [/\bgua/, "ga"],
            [/\bgua/, "ge"],
            [/\bg([ei])([^aeiou])([aeiou])/, "j$1$2$3"], // genuine --> jenuine
            [/\bpsy/, "sai"], // psychich --> psaichic
            [/\bpsy/, "sai"], // psychich --> saichic
            [/\bpsy/, "psi"], // psychich --> psichich
            [/\bpsy/, "psai"], // psychology --> psaichology
            [/\bin([^aeiou])/, "en$1"], // incident --> encident
            [/\bgen/, "jen"], // gentle --> jentle
            [/\bin([^aeiou])/, "im"], // interior --> imterior
            [/\bim([^aeiou])/, "in"], // impossible --> inpossible
            [/\bun([^aeiou])/, "um"], // impossible --> unpossible
            [/\bun([^aeiou])/, "in"], // impossible --> unpossible
            [/\bsce/, "si"], // scenery --> scinery
            [/\bc([uao])/, "k$1"], // current --> kurrent (hard "c" to "k")
            [/\bc([ei])/, "s$1"], // center --> senter
            [/\bwho/, "ho"], // whose --> hose
            [/\b[^aeiou]ire/, "aire"], // direct --> dairect
            //
            //
            //
            //
            // word middle
            //
            [/[^aeiou]yth/, "ith"], // myth --> mith
            [/gui/, "gi"], // guilty --> gilty
            [/([^s])c([ei])/, "$1s$2"], // civil --> sivil (soft "c" to "s") // NEW TEST removed opening \b
            [/ct/, "kt"], // octopus -> oktopus
            [/opt/, "apt"], // option --> aption
            [/([aeiou])b([aeiou])/, "$1v$2"], // lobe --> love
            [/([aeiou])fu/, "$1hu"], // snafu --> snahu
            [/graph/, "gruph"], // graphite --> gruphite
            [/graph/, "greph"], // graphite --> grephite
            [/phy/g, "phi"], // biography --> biographi, physical --> phisical
            [/([^aeiou])oubl/, "$1ubl"], // double --> duble
            [/([bcdfglmnprst])\1+/, "$1"], // middle --> midle, accent --> acent
            [/([A-Z]{1})/g, $1 => $1.toLowerCase()], // Obama --> obama
            [/([aeiou])l([aeiou])/i, "$1r$2"], // role --> rore
            [/([aeiou])r([aeiou])/, "$1l$2"], // role --> lole
            [/ee/, "ea"], // meet --> meat
            [/ea/, "ee"], // meat --> meet
            [/ck/, "k"], // bucket --> buket
            [/ck/, "kk"], // bucket --> bukket
            [/ie/, "ei"], // movies --> moveis
            [/ie/, "i"], // believe --> belive
            [/ay/, "ey"], // Taylor --> Teylor
            [/([aeiou])([bcdfglmnprst])([aeiou])([^\b])/, "$1$2$2$3$4"], // celebrate --> cellebrate (doubling consonants between vowels)
            [/([aeiou])(ck|k)/, "$1c"], // bucket --> bucet, bucket --> buccet
            [/ck/, "cc"], // bucket --> buccet
            [/ck/, "k"], // bucket --> buccet
            [/sh([aeiou])/, "sy$1"], // shut --> syut, shout --> syout
            [/ch([aeiou])/, "cy$1"], // cherry --> cyerry
            [/([aeiou])l([aeiou])/, "$1r$2"], // eloquent --> eroquent
            [/([^aeiou])er([^aeiou])/, "$1ur$2"], // alert --> alurt
            [/([^aeioj])er([^aeiou])/, "$1ar$2"], // nerd --> nard
            [/sch/g, "sk"], // school --> skool
            [/Sch/, "Sk"], // School --> Skool
            [/qu/g, "kw"], // Queen --> Kween, queen --> kween
            [/Qu/g, "Kw"], // Queen --> Kween, queen --> kween
            [/ph/i, text => isCapital(text) ? "F" : "f"], // philosophy -> filosophy (NOT global, so only first instance)
            [/([^f]|\b)f([^f]|\b)/, "$1ph$2"], // file --> phile
            [/ff/, "f"], // coffee --> cofee
            [/ff/, "gh"], // coffee --> coghee
            [/([^aeiou])ight/, "$1ite"], // fight --> fite
            [/([^aeiou])ight/, "$1ait"], // fight --> fite
            [/eight/, "ate"], // freight --> frate
            [/eight/, "eit"], // freight --> freit
            [/([^aeiou])ie([^aeiou]) /, "$1ei$2"], // believe --> beleive
            [/ght/, "gt"], // freight --> freigt
            [/([^aeiou])er([^aeiou])/, "$1ur$2"], // pattern --> patturn
            [/([^aeiou])ur([^aeiou])/, "$1er$2"], // turn --> tern
            [/sh([aeiou])/, "th$1"], // shift --> thift
            [/th/, "sh"], // thick --> shick, three --> shree
            [/th([aeiou])/, "z$1"], // this --> zis
            [/ch/, "sh"], // cherry --> sherry
            [/oy/, "oi"], // boy --> boi
            [/oi/, "oy"], // doily --> doyly
            [/scien/, "saen"], // science --> saence
            [/scien/, "sayen"], // science --> saence
            [/rhy([^aeiou])([aeiou])/, "rai$1$2"], // rhyme --> raime
            [/rhy([^aeiou])([^aeiou])/, "ri$1$2"], // rhythm --> rithm
            [/x([^c])/, "ks$1"], // box --> boks
            [/x([^c])/, "cs$1"], // box --> bocs
            [/x/, "ks"], // box --> boks
            [/([aeiou])g([aeiou])/, "$1j$2"], // agent --> ajent
            [/([aeiou])([^aeiou])e\b/, "$1$2"], // hole --> hol
            [/([^aeiou])ai/, "$1ei"], // rain --> rein
            [/([^aeiou])ai/, "$1ey"], // rain --> reyn
            [/([^aeiou])[ou]([^aeiou])([^e])/, "$1a$2$3"], // robot --> robat, grunt --> grant
            [/([^aeiou]ase)/, "$1eis"], // basement --> beisment
            [/([^aeiou])ase/, "$1eys"],
            [/([aeiou])c([ei])/, "$1s$2"], // facility --> fasility
            [/([aeiou])c([aou])/, "$1k$2"], // medical --> medikal
            [/ssion/, "shun"], // mission --> mishun
            [/nc([ei])/, "ns$1"], // science --> sciense
            [/([^aeiou])([^aeiou])o([^aeiou])([^aeiou])/, "$1$2a$3$4"], // propserity --> prasperity
            [/([aeiou])cu/, "$1ku"], // executive --> exekutive
            [/prio/, "prayo"], // priority --> prayority
            [/c([^aeiouy])/, "k$1"], // close --> klose, strict --> strikt
            [/sc([aou])/, "sk$1"], // scope --> skope
            [/([^aeiou])eut([^aeiou])/, "$1oot$2"], // neutral --> nootral
            [/tion/, "shun"], // civilization --> civilizashun
            [/tion/, "sion"], // civilization --> civilizasion
            [/tion/, "ton"], // civilization --> civilizashun
            [/r([^aeiourh])/, "ru$1"], // formal --> forumal
            [/s([^haeiou])/, "su$1"], // asleep --> asuleep
            [/([^aeious])t([^aeiouhty])/, "$1$2"], // Christmas --> Chrismas
            [/wh([aei])/, "w$1"], // where --> were, which --> wich
            [/who/, "hu"], // whose --> huse
            [/ou([^aeiou])e/, "ow$1e"], // house --> howse
            [/cqu/, "qu"], // acquit --> aquit
            [/sce/, "se"], // abscense --> absense
            [/([aeiou])dge/, "$1ge"], // acknowledge --> acknowlege
            [/ian/, "an"], // allegiance --> alegance
            [/tious/, "cious"], // conscientious --> consciencious
            [/iar/, "er"], // plagiarize --> plagerize
            [/mn/, "m"], // column --> colum
            [/([^aeiou])ond/, "$1and"], //
            [/aur/, "or"], // restaurant --> restorant
            [/aur/, "ar"], // restaurant --> restarant
            [/chn/, "kn"], // technical --> teknical
            [/age/, "ege"], // village --> villege
            [/for/, "four"], // foreigner --> foureigner
            [/than/, "then"], // than --> then
            [/then/, "than"], // then --> than
            [/cr/, "kr"], // democracy --> demokracy
            [/([^f])ew(e?)/, "$1oo"], // jewel --> jool
            [/itu/, "ichu"], // expenditure --> expendichure
            [/[^aeiou]ite/, "ait"], // polite --> polait
            [/([aeiou])nge/, "$1nje"], // binge --> binje
            [/([^aeiou])gine/, "$1jine"], // engine --> enjine
            [/([^qk])uit(\b|[^e])/, "$1oot$2"], // suits --> soots, fruit --> froot
            [/([^qk])uit(\b|[^e])/, "$1ute$2"], // suits --> sutes, fruit --> frute
            [/([^aeiou])ough\b/, "$1off"], //
            [/ge/, "je"], // large --> larje
            [/([^aeiou])u([^aeiou])([aeiouy])/, "$1oo$2$3"], // truly -->trooly
            [/([aeiou])cc([ei])/, "$1ks$2"], // accident --> aksident
            [/([aeiou])cc([ei])/, "$1cs$2"], // accident --> acsident
            [/ous([^aeiou]|\b)/, "as$1"], // obvious --> obvias
            [/ous([^aeiou]|\b)/, "us$1"], // obvious --> obvius
            [/tch/, "ch"], // itchy --> ichy
            [/\bk/, "c"], // kitchen --> citchen
            [/\bc([^eih])/, "k$1"], // color --> kolor
            [/air\b/, "er"], // chair --> cher
            [/row\b/, "roe"], // arrow --> arroe
            [/([^aeiou]|\b)ice\b/, "$1ais"], // nice --> nais
            [/([^aiu]|\b)ice\b/, "$1ise"], // nice --> nise, voice --> voise, neice --> neise
            [/ould/, "ood"], // would --> wood, could --> cood
            // [/ /, ""], //
            // [/ /, ""], //
            //
            //
            //
            //
            //
            // endings
            //
            [/pt\b/, "t"], // tempt --> temt
            [/ail\b/, "ial"], // tail --> tial
            [/ial\b/, "ail"], // trial --> trail
            [/([aeiou])b\b/, "$1vu"], // cab --> cavu
            [/ies\b/g, "yes"], // bodies --> bodyes
            [/([^aeiou])ies\b /, "$1eys"],
            [/ar\b/, "er"], // grammar --> grammer
            [/ize\b/g, "aiz"], // prize --> praiz
            [/ize\b/g, "ise"], // prize --> praiz
            [/ise\b/g, "ize"], // prize --> praiz
            [/ies\b/, "ys"], // bodies => bodys
            [/t\b/, "to"], // best --> besto
            [/st\b/, "suto"], // best --> besuto
            [/sk\b/, "suku"], // best --> besuto
            [/([^aeiou])ire\b/, "$1air"], // entire --> entair
            [/cal\b/, "kul"], // clinical --> clinikul
            [/cal\b/, "cle"], // clinical --> clinicle
            [/le\b/i, "el"], // little --> littel
            [/ful\b/, "full"], // joyful --> joyfull
            [/ade\b/, "eid"], // lemonade --> lemoneid
            [/([^aeiou])ate\b/g, "$1eit"], // hate --> heit
            [/ate\b/, "ayt"], // candidate --> candidayt
            [/ate\b/, "ait"], // candidate --> candidait
            [/tial\b/, "shal"],
            [/tial\b/, "shul"],
            [/([^aeiou])are\b/, "$1air"],
            [/([aeiou])([^aeiou])e\b/, "$1$2"], // quite --> quit (remove "e" at end of word after VC)
            [/([^aeiou])ent\b/, "$1ant"], // silent --> silant
            [/([^aeiou])ant\b/, "$1ent"], // vigilant --> vigilent
            [/([^aeiou])ite\b/, "$1ait"], // spite --> spait
            [/(ue|oe)\b/, "oo"], // blue --> bloo, shoe -> shoo
            [/ney\b/, "ny"], // money --> mony
            [/nce\b/, "nse"], // science --> sciense
            [/([^\b])oo/, "$1u"], // school --> skul
            [/der\b/, "dur"], // murder --> murdur
            [/([^aeiou])el\b/, "$1le"], // baggel --> baggle
            [/([^aeiou])or\b/, "$1ur"], // color --> colur
            [/([^aeiou])or\b/, "$1our"], // color --> colour
            [/([^aeiou])our\b/, "$1ur"], // color --> colour
            [/ain\b/, "ane"],
            [/quer\b/, "ker"],
            [/acy\b/, "asy"],
            [/asm\b/, "azm"],
            [/ice\b/, "is"],
            [/ice\b/, "ise"],
            [/([^aeiou])eme\b/, "eem"],
            [/ute\b/, "oot"], // flute
            [/ete\b/, "eet"], // compete --> compeet
            [/mb\b/, "m"], // climb --> clim
            [/([^aeiou])y\b/, "$1ee"], // daily --> dailee
            [/([^aeiou])y\b/, "$1ie"], // daily --> dailee
            [/([^l])ow\b/, "$1ou"], // cow --> cou
            [/([^aeiou])use\b/, "$1yuse"], // refuse --> refyuse
            [/ment\b/, "mint"], // department --> departmint
            [/([^aeiou])er\b/, "$1ur"], // refer --> refur
            [/([^aeiou])([^aeioug])ine\b/, "$1$2ain"], // deadline --> deadlain (NOTE *NOT* engine)
            [/([aeiou])([^aeiou])ine\b/, "$1$2een"], // trampoline --> trampoleen
            [/([aeiou])([^aeiou])ies\b/, "$1$2ys"], // babies --> babys
            [/([aeiou])([^aeiou])ies\b/, "$1$2yes"], // babies --> babyes
            [/([^aeiou])al\b/, "$1ol"], // capital --> capitol
            [/([^aeiou])ol\b/, "$1al"], // capitol --> capital
            [/ary\b/, "ery"], // salary --> salery
            [/([^aeiou])ery\b/, "$1ary"], // celery --> celary
            [/ede\b/, "eed"], // concede --> conceed
            [/([aeiou])([^aeiou])o\b/, "$1$2oe"], // potato --> potatoe
            [/ence\b/, "ance"], // permanence --> permanance
            [/ance\b/, "ence"], // perseverance --> perseverence
            [/([aeiou])sion/, "$1tion"], // tension --> tention
            [/([^aeiou])ere\b/, "$1eir"], // there --> their
            [/([^aeiou])eir\b/, "$1ere"], // their --> there
            [/([^aeiou])aste\b/, "$1aist"], // paste --> paist
            [/([^aeiou])aste\b/, "$1eist"], // paste --> peist
            [/([aeiou])sing\b/, "$1zing"], // rising --> rizing
            [/([^aeiou][^aeiou])er\b/, "$1r"], // lumber --> lumbr
            [/ool\b/, "uil"], // cool --> cuil
            [/([aeiou])c\b/, "$1k"], // traffic --> traffik
            [/([aeiou])c\b/, "$1ck"], // traffic --> traffick
            [/([^aeiou])on\b/, "$1an"], // person --> persan
            [/ise(d?)\b/, "ize$1"], // despise --> despize
            [/ise(d?)\b/, "aiz$1"], // despised --> despized
            [/ought(s?)/, "awt$1"], // thought --> thawt
            [/([^aeiou])eir\b/, "$1air"], //
            [/([^aeiou])ible\b/, "$1able"], // impossible --> impossable
            [/([^aeiou])able\b/, "$1ible"], // probable --> probible
            // [/ /, ""], //
            // [/ /, ""], //
            // [/ /, ""], //
            // [/ /, ""], //
        ];



        /*
        Catch-all replacements, used for words where few other changes work
        These are pretty obvious changes, to be used as a last resort
        */

        const beginnersPatterns = [
            [/r/, "l"], // simply repacing (the first) r with l
            [/R/, "L"], // simply repacing (the first) R with L
            [/l/, "r"], // simply repacing (the first) l with r
            [/L/, "R"], // simply repacing (the first) R with L
            [/b/, "d"],
            [/b/, "p"],
            [/n/, "m"],
            [/N/, "M"],
            [/a/g, "o"],
            [/a/g, "u"],
            [/e/g, "i"],
            [/i/g, "e"],
            [/i/g, "ii"],
            [/o/g, "a"],
            [/u/g, "a"],
            [/^\w{0,4}$/, word => word.split("").reverse().join("")], // cat --> tac, book --> koob
            [/f/, "v"], // knife --> knive
            [/v/, "f"], // knives --> knife
            // [//, "l"], //
            // [//, "l"], //
            // [//, "l"], //
            // [//, "l"], //
        ];


        function getAllFor(word, obj = {}) {


            obj = $.extend({
                minNumber: 2,
            }, obj);


            let misspellingsArray = [];


            generateWords(word, expertPatterns, misspellingsArray);


            if (misspellingsArray.length < obj.minNumber) {
                generateWords(word, beginnersPatterns, misspellingsArray);
            }


            while (misspellingsArray.length < obj.minNumber) {
                misspellingsArray.push(tools.pickOneFrom(["banana", "Hyuga", "very nice"], true));
            }


            return tools.shuffle(misspellingsArray);
        }


        // private
        function generateWords(word, patternsArray, targetArray) {


            // console.clear();


            patternsArray.forEach(pattern => {


                const regExp = pattern[0];
                const replaceWith = pattern[1];
                const misspelledWord = word.replace(regExp, replaceWith);


                if (misspelledWord !== word && targetArray.indexOf(misspelledWord) === -1) {
                    targetArray.push(misspelledWord);
                    console.log(`${word} -> ${regExp} -> ${replaceWith} -> ${misspelledWord}`);
                }
            });
        }


        function getOneFor(word) {
            return getAllFor(word)[0];
        }


        function getNumberOfMisspellings(obj = {}) { // { word, other, number }
            return tools.whittleDownArray(getAllFor(obj.word, obj.other), obj.number);
        }


        return {
            getAllFor,
            getOneFor,
            getNumberOfMisspellings,
        };
    }
);
