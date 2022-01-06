/*
 *
 *      This gets all the assignments from the assignment buttons on the user page and
 *      saves them, in order, to session.
 *
 *      This allows us to show a link to the next assignment when each one is finished,
 *      without returning to the user_page.
 *
 *
 */

define(
    [
        "jquery",
        "tools",
    ],
    function(
        $,
        tools
    ) {


        return function() {


            const assignmentList = tools.objectStorage("assignment_list"); // in sessionStorage


            // private
            function getAllAssignments() {
                return $(".assignment-link").get().map(function(item) {
                    return {
                        chapterName: $(item).closest(".chapter-holder").find(".chapter-name").text().trim(),
                        sectionName: $(item).closest(".section-holder").prev().find(".section-title-holder").text().trim(),
                        assignmentName: $(item).find(".button-label-text").text().trim(),
                        href: $(item).attr("href").trim(),
                        isActive: $(item).find(".kakomon-tag").is(":visible") ? false : true,
                    };
                });
            }


            // public, called from assignment.js when t
            function getNextAssignment() {


                const assignmentsArray = assignmentList();
                const currentAssignmentID = window.location.pathname.replace(/\D/g, ""); // getting only the assignment id from the pathname
                let nextAssignment = null;


                // looping through all assignments, getting the ID of the next assignment button
                assignmentsArray.forEach(function(item, index) { // this should be cleaner
                    const thisID = item.href.replace(/\D/g, "");
                    if (thisID === currentAssignmentID) {
                        nextAssignment = assignmentsArray[index + 1];
                    }
                });


                return nextAssignment;
            }


            function saveToSession() {
                const list = getAllAssignments();
                assignmentList(list);
            }


            return {
                saveToSession,
                getNextAssignment
            };
        };
    });