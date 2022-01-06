/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *
 *      JavaScript for chat.php!
 *
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

define(
    [
        "jquery",
        "tools",
        "jqueryui",
        "bootstrap",
    ],
    function (
        $,
        tools
    ) {


        let lastChatID = 0;
        const checkMessagesInteval = 10 * 1000; // 10 seconds


        setInterval(checkForMessages, checkMessagesInteval);
        checkForMessages();


        function checkForMessages() {
            $.getJSON("/chat_stuff", {
                job: "retrieve_chats",
                aboveID: lastChatID
            }).done(d => {
                if (d && $.isArray(d)) {
                    clearChatsButton.setDisabledTo(false);
                    d.forEach(displayMessage);
                    d.length && scrollToBottom(); // only scrolling if there are new messages
                }
            }).fail(d => {
                console.log(d);
                console.log("retrieve_chats failed!");
            });
        }


        const displayMessage = (function () {


            // saving the time of the last displayed message so we don't repeat it on consecutively updated messages
            let lastDisplayedTime = "";
            let lastMessageID = null;


            return function (thisMessage) {

                // returning if no messages were received, or if
                // this message has already been displayed
                if (!thisMessage || lastMessageID === thisMessage.id) { return; }

                lastMessageID = thisMessage.id;
                $(".no-messages-message").hide();


                // keeping track of the latest message displayed, so we don't repeat it
                lastChatID = Math.max(lastChatID, thisMessage.id);


                // saving the lastChatID in storage, so we can pass it to the assignment.js
                sessionStorage.lastChatID = lastChatID;


                // building the message itself
                // NOTE that "thisMessage.sender" is either "user" or "admin"
                const $message = $("<div class='message'></div>").addClass(thisMessage.sender).text(thisMessage.message);
                const sender = (thisMessage.sender === "admin") ? "Wood" : tools.userInfo("username"); //localStorage.username;
                const date = getTime(thisMessage.created_at);


                // only displaying the date if some time has passed since the last date was displayed
                let $messageDate = "";
                if (date !== lastDisplayedTime) {
                    $messageDate = $("<span class='message-date'/>").text(sender + " (" + date + ")");
                    lastDisplayedTime = date;
                } else {
                    $message.addClass("dateless"); // removing some of the border from the top
                }


                // appending the date to the message itself
                $message.append($messageDate);
                $("#no-messages-message").remove();
                $("#chats-holder").append($message);


                clearChatsButton.setDisabledTo(false);
            };
        }());


        function scrollToBottom() {
            $("#chats-holder").animate({
                scrollTop: $("#chats-holder")[0].scrollHeight
            }, 500);
        }


        // wiring up the send-message-button
        function sendMessage() {


            // getting user input - exiting if there is none
            const message = $("#message-input").val().trim();
            if (!message) return;


            $("#message-input").attr({ disabled: true });


            $.getJSON("/chat_stuff", {
                job: "upload_new_message",
                message: message,
                sender: "user",
            }).done(messages => {
                if (messages && Array.isArray(messages)) {
                    messages.forEach(displayMessage);
                    scrollToBottom();
                }
                $("#message-input").val("").attr({ disabled: false });
            }).fail(function (d) {
                console.log(d);
            });
        }


        function getTime(message) {
            const dt = message.split(" ")[1].split(":");
            return dt[0] + ":" + dt[1];
        }


        $("#message-input").keydown(e => {
            if (e.keyCode === 13) {
                e.preventDefault();
                sendMessage();
            }
        });


        $("#send-chats-button").on("click", sendMessage);


        const clearChatsButton = (function () {

            const $clearChatsButton = $("#clear-chats-button");
            $clearChatsButton.on("click", clearChats);

            function clearChats() {

                $clearChatsButton.off("click", clearChats); // temporarily disabling

                $.getJSON("/chat_stuff", {
                    job: "erase_all_messages",
                }).done(function () {
                    $clearChatsButton.off("click").on("click", clearChats); // turning back on
                    $(".message").fadeTo(400, 0, () => $(this).remove());
                    setDisabledTo(true);
                    $(".no-messages-message").show();
                }).fail(function (d) {
                    console.log("Erasing all messages failed!");
                    console.log(d);
                });
            }

            // disabling the clear-chats-button, 'cause there are no more messages to erase
            function setDisabledTo(value) {
                $clearChatsButton.prop({ disabled: value });
                value ? $clearChatsButton.hide() : $clearChatsButton.show();
            }

            return {
                setDisabledTo,
            };
        }());
    }
);
