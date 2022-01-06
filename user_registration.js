requirejs(
    [
        "jquery",
        "tools"
    ],
    function($, tools) {


        $(function() {


            tools.warnPrivateBrowsing();


            let isIppan = true;


            // hiding some fields if user is not 本校生徒
            setRegisterStatus();
            $("input[name='honkou-seito']").change(setRegisterStatus);


            function setRegisterStatus() {
                isIppan = !!($("input[name='honkou-seito']:checked").val() === "0");
                $("body").toggleClass("register-ippan", isIppan);
            }


            // pre-loading any previously-entered data - BUT NOT PASSWORDS
            $(".form-control").each(function() {
                const id = $(this).attr("id");
                if (sessionStorage[id] && sessionStorage[id] !== "password") {
                    $(this).val(sessionStorage[id]);
                }
            });


            // completely disabling the space key when an input has focus
            $("html").keydown(function(e) {
                e.which === 32 && $(":focus").hasClass("form-control") && e.preventDefault();
            });


            // saving anything typed into the inputs in sessionStorage - BUT NOT PASSWORDS
            $(".form-control").change(function() {
                const id = $(this).attr("id");
                if (id === "password" || id === "password_again") { return; }
                sessionStorage[id] = $(this).val();
            });


            // wiring up the submit button
            $("#login-form").submit(function(e) {


                e.preventDefault();
                $("#report-div").empty();


                let thereAreErrors = false;


                const aliases = {
                    last_name: "「名字」",
                    first_name: "「名前」",
                    username: "「ユーザー名」",
                    email: "「eメール」",
                    password: "「パスワード」"
                };


                // checking for any spaces in any of the text inputs
                $.each([$("#username"), $("#password")], function() {
                    const text = $(this).val();
                    if (text.search(/\s|　/) !== -1) { // checking for spaces (全角 too!)
                        const id = $(this).attr("id");
                        $("#report-div").append(aliases[id] + " に空白(スペース）が入っていませんか？<br>");
                        thereAreErrors = true;
                    }
                });


                // checking that no inputs are empty
                if (!isIppan) {


                    const inputsAndMessages = [
                        { input: $("#firstname"), message: "名前を入力しましょう。" },
                        { input: $("#lastname"), message: "名字を入力しましょう。" },
                        { input: $("#nen"), message: "学年を入力しましょう。" },
                        { input: $("#kumi"), message: "組を入力しましょう。" },
                        { input: $("#ban"), message: "出席番号を入力しましょう。" },
                        { input: $("#course-input"), message: "コースを選択しましょう。" },
                        { input: $("#school-input"), message: "中学校・文理科を選択しましょう。" }
                    ];


                    inputsAndMessages.forEach(function(thisInput) {
                        if (!thisInput.input.val()) {
                            $("#report-div").append(thisInput.message + "<br>");
                            thereAreErrors = true;
                        }
                    });
                }


                // warning if the two passwords are not identical
                const password1 = $("#password").val();
                const password2 = $("#password_again").val();


                if (password1 !== password2) {
                    $("#password_again").val("").focus(); // emptying and returning focus to the SECOND password input
                    $("#report-div").append("同じパスワードを２回入力してください。");
                    thereAreErrors = true;
                }


                const regexp = /^\w{4,}$/i; // alphanumeric, 4+ in length
                if (password1.search(regexp) === -1) {
                    $("#report-div").append("パスワードは４文字以上の半角英数字にしましょう。<br>");
                    thereAreErrors = true;
                }


                // stopping here, without making the ajax call, if there are errors
                if (thereAreErrors) return;


                /*
                 *
                 *
                 *
                 *  Past this point, everything checks out, so we make the ajax call...
                 *
                 *
                 *
                 *
                 */


                // saving form data just to be anal
                let formData = {
                    username: $("#username").val(),
                    password: $("#password").val(),
                    password_again: $("#password_again").val(),
                    // course: $("#course-input").val(), // should change this to "kyoushitsu" later...
                    honkou_seito: $("input[name='honkou-seito']:checked").val(),
                };


                // adding extra properties for honkou_seito
                if (!isIppan) {
                    formData.lastname = $("#lastname").val();
                    formData.firstname = $("#firstname").val();
                    formData.nen = $("#nen").val();
                    formData.kumi = $("#kumi").val();
                    formData.ban = $("#ban").val();
                    formData.course = $("#course-input").val();
                    formData.school = $("#school-input").val();
                    formData.code = $("#registration_code").val();
                }


                $.post("/register_new_user", formData, backFromRegistration, "json").fail(function(data) {
                    log("register_new_user didn't go through!");
                    log(data);
                });


                function backFromRegistration(data) {


                    $("#report-div").text("");


                    // if the returned data is an object of warning messages about invalid passwords, etc., ...
                    if (typeof data === "object") { // meaning an array of errors was returned
                        $.each(data, function(key, value) {
                            $("#report-div").append("<p>" + value + "</p>");
                        });
                        return;
                    }


                    // saving username so it's there when we return to the home page
                    // localStorage.username = formData.username;
                    tools.userInfo("username", formData.username);


                    $("#report-div").empty();


                    // styling stuff
                    $(".form-control").attr({ disabled: "true" }).css({ opacity: "0.5" });
                    $("#register-waiting").css({ display: "block" });
                    $("#submit-button").attr({ disabled: "true" }).text("登録中...");


                    // adding a confirmation message and a link-button back to the top
                    // slight delay before moving on (for UX purposes only - 'cause users seem to expect it)
                    setTimeout(function() {
                        $("#form-holder").empty()
                            .append(`<div id='registration-confirmation'>登録ができました！<br><br>ユーザー名は　<span>${tools.userInfo("username")}</span>　です。<br><br>パスワードは　<span>${formData.password}</span>　です。<br><br>頑張って下さい！</div>`)
                            .append("<a href='/' class='btn btn-success btn-sm btn-block'>戻る<a>");
                    }, 1000);
                }
            });
        });
    });