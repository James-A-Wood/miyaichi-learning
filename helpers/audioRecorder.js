/* jshint expr: true */


define(
        [
            "jquery",
            "libraries/micRecorder",
            "howler",
        ],
    function($, MicRecorder) {


        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
        window.URL = window.URL || window.webkitURL;


        return function(obj = {}) {


            let isRecording = false;
            const micRecorder = new MicRecorder({
                bitRate: obj.bitRate || 320, //128,
            });


            function toggleRecordingState() {
                isRecording = !isRecording;
                isRecording ? startRecording() : stopRecording();
            }


            function startRecording() {
                micRecorder.start().then(() => {
                    obj.onRecordStart && obj.onRecordStart();
                }).catch(e => {
                    console.error("Couldn't start recording!");
                    console.error(e);
                });
            }


            function stopRecording() {


                micRecorder.stop().getMp3().then(([buffer, blob]) => {


                    const file = new File(buffer, null, { // "null" used to be file name
                        type: blob.type,
                        lastModified: Date.now(),
                    });


                    obj.playbackAudio() && play(file);
                    obj.onRecordStop && obj.onRecordStop(file);
                }).catch((e) => {
                    alert("Could not retrieve your message");
                    log(e);
                });
            }


            function play(file) {
                const howl = new Howl({
                    src: URL.createObjectURL(file),
                    autoplay: true,
                    format: "mp3",
                    onend: function() {
                        //
                    }
                });
            }


            return {
                toggleRecordingState,
                play,
            };
        };
    }
);