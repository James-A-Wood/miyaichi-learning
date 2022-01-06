$(function () {


    const log = console.log;


    (function () {


        window.addEventListener("beforeinstallprompt", () => {
            // log("beforeinstallprompt triggered!");
        });


        function setEnglish() {
            $("body").removeClass("japan");
            localStorage.removeItem("qr_code_use_japanese_language");
        }


        function setJapanese() {
            $("body").addClass("japan");
            localStorage.qr_code_use_japanese_language = "true";
        }


        $("#english-selector").on("click", setEnglish);
        $("#japanese-selector").on("click", setJapanese);


        localStorage.qr_code_use_japanese_language && setJapanese();
    }());



    $("#qrcode-input").on("input paste", generateCode);


    const canvas = (function () {


        const canvas = document.getElementById("output-canvas");
        const $holder = $("#canvas-holder");
        const canvasHasconstent = false;


        function download() {
            if (!canvasHasContent) return false;
            const link = document.createElement("a");
            link.download = "qr_code.png";
            link.href = canvas.toDataURL();
            link.click();
            $holder.addClass("downloaded");
        }


        function setSize(n) {
            canvas.height = n;
            canvas.width = n;
            return this;
        }


        function displayQR(text) {
            clear();
            if (!text) return;
            const qr = new QRious({
                element: canvas,
                value: text,
                size: qrSize.getSize(),
            });
            canvasHasContent = true;
            $holder.removeClass("empty");
        }


        function clear() {
            canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
            $holder.addClass("empty").removeClass("downloaded");
            canvasHasContent = false;
            return this;
        }


        return {
            displayQR: displayQR,
            download: download,
        };
    }());


    $("#download-button").click(canvas.download);


    function generateCode() {
        const text = $("#qrcode-input").val();
        canvas.displayQR(text);
    }


    const qrSize = (function () {


        const $holder = $("#size-radios-holder");
        const $radios = $("input[name='size-radio']");
        $radios.on("change", generateCode);


        function getSize() {
            return $("input[name='size-radio']:checked").val();
        }


        function show() {
            $holder.css("visibility", "visible");
        }


        function hide() {
            $holder.css("visibility", "hidden");
        }


        return {
            getSize: getSize,
            show: show,
            hide: hide,
        };
    }());
});
