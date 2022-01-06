if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("qrcode_maker_service_worker.js", {
            scope: "/qr-code/"
        }).then(registration => {
            // console.log("ServiceWorker registration successful with scope: ", registration.scope);
            // console.log(registration);
        }, err => {
            console.log("ServiceWorker registration failed: ", err);
        });
        navigator.serviceWorker.addEventListener("controllerchange", () => {
            //
        });

    });
}
