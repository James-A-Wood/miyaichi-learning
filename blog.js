define(
        [
            "jquery",
            "helpers/replaceStraightQuotesWithSlanted",
            "helpers/adjustTextInputWidth",
            "tools",
            "jqueryui",
            "bootstrap"
        ],
    function($, replaceStraightQuotesWithSlanted, textInputWidthAdjuster, tools) {

        $(function() {

            const log = console.log;

            let newBlog = (function() {

                const $formMaster = $(".blog-form.my-template").detach().removeClass("my-template");

                // adding sortability
                $("#blogs-frame").sortable({
                    stop: function() {
                        let ids = [];
                        $(".blog-form").each(function(index, form) {
                            ids.push($(form).data("kyoushitsu_id"));
                        });
                        $.post("blog_stuff", {
                            job: "blog_junban",
                            ids: ids
                        }).done(function(d) {
                            //log(d);
                        }).fail(function(d) {
                            log(d);
                        });
                    }
                });

                $("#toggle-button").click(function() {
                    $(".blog-inputs").slideToggle();
                });

                function changeTitle($title, id) {

                    function reset(newTitle) {
                        $title.removeClass("now-editing").attr("readonly", true).val(newTitle || previousTitle).off("blur");
                        return true;
                    }

                    function postChange() {

                        let newTitle = $title.val();

                        if (!newTitle) {
                            reset();
                            return;
                        }

                        newTitle = tools.removeExtraWhiteSpace(newTitle);

                        if (!newTitle) {
                            reset();
                            return;
                        }

                        $.post("blog_stuff", {
                            job: "change_kyoushitsu_title",
                            id: id,
                            title: newTitle
                        }).done(function(d) {
                            reset(newTitle);
                        }).fail(function(d) {
                            log(d);
                        });
                    }

                    const previousTitle = $title.val();

                    $title.addClass("now-editing").attr("readonly", false).off("blur").on("blur", postChange).off("keyup").on("keyup", e => {

                        textInputWidthAdjuster($title);

                        if (e.which === 27) {
                            reset();
                            return;
                        }

                        if (e.which === 13) {
                            postChange();
                        }
                    });
                }


                return function(blog, kyoushitsu) {

                    blog = kyoushitsu[blog] || {};
                    const $form = $formMaster.clone().appendTo("#blogs-frame");

                    // adding content to elements
                    $form.find(".title-holder-input").val(blog.title);
                    $form.find(".body-holder-textarea").val(blog.body);
                    $form.find(".kyoushitsu-title-holder .title").val(blog.kyoushitsu_title).on("dblclick", function() {
                        changeTitle($(this), blog.kyoushitsu_id);
                    });
                    $form.find(".kyoushitsu-title-holder .updated_at").html(blog.updated_at);
                    $form.data("kyoushitsu_id", blog.kyoushitsu_id);

                    // removing "refreshed" on any interaction
                    $form.find(".title-holder-input, .body-holder-textarea").on("focus keydown blur", function() {
                        $form.removeClass("refreshed");
                    });

                    // preventing form submit on Enter (without Shift key)
                    $form.find(".title-holder-input").on("keydown", function(e) {
                        if (e.which === 13 && !e.shiftKey) {
                            e.preventDefault();
                        }
                    });

                    // Shift + Enter => submit()
                    $form.find(".body-holder-textarea").on("keydown", function(e) {
                        if (e.shiftKey && e.which === 13) {
                            e.preventDefault();
                            $form.submit();
                        }
                    });

                    // wiring up elements
                    $form.submit(function(e) {

                        e.preventDefault();

                        replaceStraightQuotesWithSlanted($form.find(".title-holder-input"));
                        replaceStraightQuotesWithSlanted($form.find(".body-holder-textarea"));

                        const title = $form.find(".title-holder-input").val();
                        const body = $form.find(".body-holder-textarea").val();

                        $.post("blog_stuff", {
                            job: "upload_blog_entry",
                            title: title,
                            body: body,
                            kyoushitsu: blog.kyoushitsu_id
                        }).done(function(d) {
                            $form.addClass("refreshed");
                        }).fail(function(d) {
                            log(d);
                        });
                    });
                };
            }());


            // retrieving the blogs via AJAX
            $.getJSON("blog_stuff", {
                job: "get_blogs"
            }).done(function(kyoushitsu) {
                //log(kyoushitsu);
                Object.keys(kyoushitsu).forEach(function(blog) {
                    newBlog(blog, kyoushitsu);
                });
            }).fail(d => {
                log(d);
            });
        });
    }
);