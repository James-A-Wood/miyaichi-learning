


define(
        [
            "jquery",
            "Konva"
        ],
        function ($, Konva) {

            return function (params) {

                var sheep;
                var imageObject = new Image();


                imageObject.onload = function () {
                    sheep = new Konva.Image({
                        image: imageObject,
                        width: imageObject.width / 2,
                        height: imageObject.height / 2
                    });
                    params.layer.add(sheep);
                    prepare();
                };

                imageObject.src = "images/sheep.png";


                function prepare() {

                }
            };
        }
);