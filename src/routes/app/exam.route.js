import {
    create_exam,
    get_exam_by_id,
    get_exams_by_campus,
    get_exams_by_teacher,
    get_exams_by_target,
    get_exams_for_student,
    update_exam,
    publish_exam,
    complete_exam,
    delete_exam,
    add_exam_subjects,
    update_exam_subject,
    remove_exam_subject,
    add_exam_targets,
    remove_exam_target,
    get_exam_stats,
    get_upcoming_exams,
    get_ongoing_exams,
    send_exam_reminder,
    get_students_for_exam,
    get_exam_grades,
    get_exam_details_for_student
} from "../../controllers/app/exam.controller.js";

import {
    ExamCreateSchema,
    ExamGetByIdSchema,
    ExamGetByCampusSchema,
    ExamGetByTeacherSchema,
    ExamGetByTargetSchema,
    ExamGetForStudentSchema,
    ExamUpdateSchema,
    ExamPublishSchema,
    ExamCompleteSchema,
    ExamDeleteSchema,
    ExamAddSubjectsSchema,
    ExamUpdateSubjectSchema,
    ExamRemoveSubjectSchema,
    ExamAddTargetsSchema,
    ExamRemoveTargetSchema,
    ExamGetStatsSchema,
    ExamGetUpcomingSchema,
    ExamGetOngoingSchema,
    ExamSendReminderSchema,
    ExamGetStudentsSchema,
    ExamGetGradesSchema,
    ExamGetDetailsForStudentSchema
} from "../../schemas/app/exam.schema.js";

const examCreateOpts = {
    schema: {
        body: ExamCreateSchema.body
    }
};

const examGetByIdOpts = {
    schema: {
        params: ExamGetByIdSchema.params
    }
};

const examGetByCampusOpts = {
    schema: {
        querystring: ExamGetByCampusSchema.querystring
    }
};

const examGetByTeacherOpts = {
    schema: {
        querystring: ExamGetByTeacherSchema.querystring
    }
};

const examGetByTargetOpts = {
    schema: {
        querystring: ExamGetByTargetSchema.querystring
    }
};

const examGetForStudentOpts = {
    schema: {
        querystring: ExamGetForStudentSchema.querystring
    }
};

const examUpdateOpts = {
    schema: {
        params: ExamUpdateSchema.params,
        body: ExamUpdateSchema.body
    }
};

const examPublishOpts = {
    schema: {
        params: ExamPublishSchema.params,
        body: ExamPublishSchema.body
    }
};

const examCompleteOpts = {
    schema: {
        params: ExamCompleteSchema.params,
        body: ExamCompleteSchema.body
    }
};

const examDeleteOpts = {
    schema: {
        params: ExamDeleteSchema.params
    }
};

const examAddSubjectsOpts = {
    schema: {
        params: ExamAddSubjectsSchema.params,
        body: ExamAddSubjectsSchema.body
    }
};

const examUpdateSubjectOpts = {
    schema: {
        params: ExamUpdateSubjectSchema.params,
        body: ExamUpdateSubjectSchema.body
    }
};

const examRemoveSubjectOpts = {
    schema: {
        params: ExamRemoveSubjectSchema.params
    }
};

const examAddTargetsOpts = {
    schema: {
        params: ExamAddTargetsSchema.params,
        body: ExamAddTargetsSchema.body
    }
};

const examRemoveTargetOpts = {
    schema: {
        params: ExamRemoveTargetSchema.params
    }
};

const examGetStatsOpts = {
    schema: {
        querystring: ExamGetStatsSchema.querystring
    }
};

const examGetUpcomingOpts = {
    schema: {
        querystring: ExamGetUpcomingSchema.querystring
    }
};

const examGetOngoingOpts = {
    schema: {
        querystring: ExamGetOngoingSchema.querystring
    }
};

const examSendReminderOpts = {
    schema: {
        params: ExamSendReminderSchema.params,
        body: ExamSendReminderSchema.body
    }
};

const examGetStudentsOpts = {
    schema: {
        params: ExamGetStudentsSchema.params
    }
};

const examGetGradesOpts = {
    schema: {
        querystring: ExamGetGradesSchema.querystring
    }
};

const examGetDetailsForStudentOpts = {
    schema: {
        querystring: ExamGetDetailsForStudentSchema.querystring
    }
};

async function examRoutes(app, options) {
    // Create exam
    app.post("/exam", examCreateOpts, create_exam);

    // Get exams
    app.get("/exam/:exam_id", examGetByIdOpts, get_exam_by_id);
    app.get("/exam/campus/all", examGetByCampusOpts, get_exams_by_campus);
    app.get("/exam/teacher/all", examGetByTeacherOpts, get_exams_by_teacher);
    app.get("/exam/target/all", examGetByTargetOpts, get_exams_by_target);
    app.get("/exam/student/all", examGetForStudentOpts, get_exams_for_student);

    // Update exam
    app.patch("/exam/:exam_id", examUpdateOpts, update_exam);
    app.post("/exam/:exam_id/publish", examPublishOpts, publish_exam);
    app.post("/exam/:exam_id/complete", examCompleteOpts, complete_exam);

    // Delete exam
    app.delete("/exam/:exam_id", examDeleteOpts, delete_exam);

    // Subjects
    app.post("/exam/:exam_id/subjects", examAddSubjectsOpts, add_exam_subjects);
    app.patch("/exam/subjects/:subject_id", examUpdateSubjectOpts, update_exam_subject);
    app.delete("/exam/subjects/:subject_id", examRemoveSubjectOpts, remove_exam_subject);

    // Targets
    app.post("/exam/:exam_id/targets", examAddTargetsOpts, add_exam_targets);
    app.delete("/exam/targets/:target_id", examRemoveTargetOpts, remove_exam_target);

    // Statistics and special queries
    app.get("/exam/stats/campus", examGetStatsOpts, get_exam_stats);
    app.get("/exam/upcoming", examGetUpcomingOpts, get_upcoming_exams);
    app.get("/exam/ongoing", examGetOngoingOpts, get_ongoing_exams);

    // Notifications
    app.post("/exam/:exam_id/reminder", examSendReminderOpts, send_exam_reminder);

    // Students
    app.get("/exam/:exam_id/students", examGetStudentsOpts, get_students_for_exam);

    // Grades
    app.get("/exam/grades/all", examGetGradesOpts, get_exam_grades);
    
    // Student-specific exam details with grades
    app.get("/exam/student/details", examGetDetailsForStudentOpts, get_exam_details_for_student);
}

export default examRoutes;
