define(
        [
            "jquery",
            "tools",
        ],
    function($, tools) {


        $(function() {


            // triggering the .change-button click on input blur
            $(".basic-info-input").blur(function() {
                if (!$(this).attr("disabled")) {
                    $(this).closest(".item-holder").find(".change-button").click();
                }
            });


            // wiring up the password-change-button
            $("#password-change-button").click(function() {
                $("#password-change-form").slideToggle();
            });


            // Esc key always removes focus from all elements
            $("html").on("keyup", function(e) {
                (e.which === 27) && $(":focus").blur();
            });


            // saving the original value on focus
            $(".basic-info-input").on("focus", function() {
                $(this).data("original-value", $(this).val());
                log($(this).data("original-value"));
            });


            // wiring up the .change-buttons
            $(".item-holder").submit(function(e) {

                e.preventDefault();

                let $this = $(this);
                let $thisButton = $this.find(".change-button");
                let $thisInput = $this.find(".basic-info-input");

                $("#error-message-holder").empty();

                // activating the space and exiting, if it isn't already active
                if ($thisInput.is(":disabled")) {
                    $(".basic-info-input").prop("disabled", true);
                    $thisInput.prop("disabled", false).focus();
                    $thisButton.text("決定");
                    return false;
                }

                $thisButton.text("変える");

                $thisInput.prop({ disabled: true });
                const column = $thisInput.attr("data-column");
                const newValue = $thisInput.val();

                let data = {};
                data[column] = newValue;

                // returning if there is no new value
                if (!newValue) {
                    $this.removeClass("has-success").addClass("has-error");
                    return;
                }

                // returning if there are spaces
                if (newValue.indexOf(" ") !== -1) {
                    $thisInput.val($thisInput.data("original-value"));
                    $("#error-message-holder").append("<p>スペースが入っているようです！</p>");
                    return;
                }


                // sending info to the server
                $.post("update_user_data", data).done(function(returnedData) {
                    if (returnedData == "true") {
                        $this.addClass("has-success");
                        return;
                    } else {
                        $thisInput.val($thisInput.data("original-value"));
                        $this.removeClass("has-success").addClass("has-error").blur();
                        $("#error-message-holder").append("<p>入力したものは使えません！</p>");
                        log(returnedData);
                    }
                }).fail(function(errorData) {
                    $this.removeClass("has-success").addClass("has-error");
                    $("#error-message-holder").append("<p>エラーが発生しました！</p>");
                    log(errorData);
                });
            });


            // wiring up the pasword-change-send-button
            $("#password-change-form").submit(function(e) {

                e.preventDefault();

                let oldPassword = $("#oldPassword").val();
                let newPassword1 = $("#newPassword1").val();
                let newPassword2 = $("#newPassword2").val();

                // checking that all fields have been filled in
                if (!oldPassword || !newPassword1 || !newPassword2) {
                    $("#password-change-report").empty().html("<p>全ての情報を入力してください。</p>");
                    return;
                }

                // checking that the same new password has been entered twice
                if (newPassword1 !== newPassword2) {
                    $("#password-change-report").empty().html("<p>新しいパスワードを、同じものを２回入力してください。</p>");
                    return;
                }

                // checking for spaces
                if (newPassword1.indexOf(" ") !== -1) {
                    $("#password-change-report").empty().html("<p>新しいパスワードにスペースが入っているようです！</p>");
                    return;
                }

                // checking for 5+ alphanumeric letters
                if (!/^\w{5,}$/ig.test(newPassword1)) { // "\w" meaning any "working" character, equivalent to [a-z0-9]
                    $("#password-change-report").empty().html("<p>新しいパスワードを5字以上の英数字にしてください！</p>");
                    return;
                }

                // checking for unchanged password
                if (oldPassword === newPassword1) {
                    $("#password-change-report").empty().html("<p>新しいパスワードは現在のパスワードと同じです！</p>");
                    return;
                }

                // preparing the data
                let passwordData = {
                    oldPassword: oldPassword,
                    newPassword: newPassword1
                };

                // sending the request to the server
                $.post("change_user_password", passwordData).done(function(returnedData) {

                    if (parseInt(returnedData) === 0) {
                        $("#password-change-report").html("<p>新しいパスワードは " + newPassword1 + " です！");
                        $(".password-input").val("").css({ opacity: 0.5 }).attr({ disabled: "true" });
                        $("#password-change-send-button").attr({ disabled: true });

                        return;
                    }

                    $("#password-change-report").html("<p>" + returnedData + "</p>");

                }).fail(function(errorData) {
                    log(errorData);
                });
            });
        });
    });