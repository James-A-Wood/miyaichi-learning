define(
        [
            "jquery",
            "Konva",
            "tools",
            "helpers/processSentence",
            "helpers/SoundEffects",
            "howler"
        ],
    function($, Konva, tools, processSentence) {


        let myJSON;
        let isMobile = tools.isMobile();

        const stage = new Konva.Stage({
            height: $("#konva-holder").height(),
            width: $("#konva-holder").width(),
            container: "konva-holder"
        });

        const shipLayer = new Konva.Layer();
        const backgroundLayer = new Konva.Layer();
        const buildingsLayer = new Konva.Layer();

        // const buildings = Buildings(buildingsLayer);

        const backgroundColor = new Konva.Rect({
            width: stage.width(),
            height: stage.height(),
            fill: "skyblue",
        }).moveTo(backgroundLayer);

        stage.add(backgroundLayer, buildingsLayer, shipLayer).batchDraw();

        const ship = Ship();

        function Ship() {

            const degreesPerSecond = 90;

            const ship = Konva.Image.fromURL('/images/defender/defenderShip.png', function(ship) {

                ship.setAttrs({
                    offsetX: ship.width() / 2,
                    offsetY: ship.height() / 2,
                    rotation: 90,
                    scale: { x: 0.5, y: 0.5, },
                    x: stage.width() / 2,
                    y: stage.height() / 2,
                });
                ship.velocity = { x: 0, y: 0 };

                shipLayer.add(ship).batchDraw();

                tools.keydown([37, 39], function(e) {
                    e.preventDefault();
                })

                const anim = new Konva.Animation(moveShip, shipLayer);
                anim.start();

                function moveShip(frame) {
                    // log(Math.cos(ship.rotation()));
                    if (tools.keyIsPressed([37, 39])) {
                        const degrees = (frame.timeDiff / 1000) * degreesPerSecond;
                        const direction = tools.keyIsPressed([39]) ? 1 : -1;
                        let nr = ship.rotation() + degrees * direction;
                        nr = nr > 360 ? nr - 360 : nr < 0 ? nr + 360 : nr; // keeping it between 0 and 360
                        ship.rotation(nr);
                    }
                }

            });

            return ship;
        }


        function World(settings) {

            settings = $.extend({
                worldWidth: stage.width() * 4,
                worldHeight: stage.height(),
            }, settings || {});

            const width = stage.width() * settings.worldWidth;
            const height = settings.worldHeight;
            const worldAnimation = new Konva.Animation(eachFrame, buildingsLayer);

            let worldObjects = [];

            function eachFrame(e) {
                worldObjects.forEach(function(obj) {
                    //
                });
            }

            function addObject(obj) {
                worldObjects.push(obj);
            }


            return {
                //
            };
        }
        const world = World();






        function Buildings(layer) {

            const numBuildings = 20;
            const buildings = [];

            for (i = 0; i < numBuildings; i++) {
                const building = newBuilding();
                layer.add(building);
                buildings.push(building);
            }

            layer.draw();

            function newBuilding() {

                const buildingHeight = stage.height() * 0.75 - Math.random() * stage.height() / 2;
                const buildingWidth = stage.height() / 2 - Math.random() * stage.height() / 4;

                const windowWidth = buildingWidth / 4;
                const windowHeight = buildingHeight / 6;

                const buildingGroup = new Konva.Group();

                const rect = new Konva.Rect({
                    x: stage.width() / 2,
                    y: stage.height(),
                    stroke: "yellow",
                    height: buildingHeight,
                    width: buildingWidth,
                    fill: "lightblue",
                    offsetX: buildingWidth / 2,
                    offsetY: buildingHeight,
                });


                return rect;
            }

            return {};
        }


    }
);