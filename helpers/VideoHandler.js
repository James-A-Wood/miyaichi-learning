define(
    [
        "jquery",
        "howler",
    ],
    function(
        $
    ) {

        return function() {


            let videoData = -1;


            $.getJSON("video_stuff", {
                job: "get_videos",
            }).done(d => {
                videoData = d;
            }).fail(e => log(e));


            function getAll(callback) {
                if (videoData === -1) {
                    setTimeout(function() {
                        getAll(callback);
                    }, 1000 / 60); // 60 times a second, or about like requestAnimationFrame
                    return;
                }
                return callback(videoData);
            }


            return {
                getAll,
            };
        };
    }
);