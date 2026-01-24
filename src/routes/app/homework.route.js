import {
    create_homework,
    get_homework_by_id,
    get_homework_by_teacher,
    get_homework_by_target,
    get_homework_for_student,
    update_homework,
    publish_homework,
    close_homework,
    delete_homework,
    add_homework_attachments,
    remove_homework_attachment,
    add_homework_targets,
    remove_homework_target,
    get_homework_stats,
    get_upcoming_homework,
    get_overdue_homework
} from "../../controllers/app/homework.controller.js";

import {
    HomeworkCreateSchema,
    HomeworkGetByIdSchema,
    HomeworkGetByTeacherSchema,
    HomeworkGetByTargetSchema,
    HomeworkGetForStudentSchema,
    HomeworkUpdateSchema,
    HomeworkPublishSchema,
    HomeworkCloseSchema,
    HomeworkDeleteSchema,
    HomeworkAddAttachmentsSchema,
    HomeworkRemoveAttachmentSchema,
    HomeworkAddTargetsSchema,
    HomeworkRemoveTargetSchema,
    HomeworkGetStatsSchema,
    HomeworkGetUpcomingSchema,
    HomeworkGetOverdueSchema
} from "../../schemas/app/homework.schema.js";

const homeworkCreateOpts = {
    schema: {
        body: HomeworkCreateSchema.body
    }
};

const homeworkGetByIdOpts = {
    schema: {
        params: HomeworkGetByIdSchema.params
    }
};

const homeworkGetByTeacherOpts = {
    schema: {
        querystring: HomeworkGetByTeacherSchema.querystring
    }
};

const homeworkGetByTargetOpts = {
    schema: {
        querystring: HomeworkGetByTargetSchema.querystring
    }
};

const homeworkGetForStudentOpts = {
    schema: {
        querystring: HomeworkGetForStudentSchema.querystring
    }
};

const homeworkUpdateOpts = {
    schema: {
        params: HomeworkUpdateSchema.params,
        body: HomeworkUpdateSchema.body
    }
};

const homeworkPublishOpts = {
    schema: {
        params: HomeworkPublishSchema.params,
        body: HomeworkPublishSchema.body
    }
};

const homeworkCloseOpts = {
    schema: {
        params: HomeworkCloseSchema.params,
        body: HomeworkCloseSchema.body
    }
};

const homeworkDeleteOpts = {
    schema: {
        params: HomeworkDeleteSchema.params
    }
};

const homeworkAddAttachmentsOpts = {
    schema: {
        params: HomeworkAddAttachmentsSchema.params,
        body: HomeworkAddAttachmentsSchema.body
    }
};

const homeworkRemoveAttachmentOpts = {
    schema: {
        params: HomeworkRemoveAttachmentSchema.params
    }
};

const homeworkAddTargetsOpts = {
    schema: {
        params: HomeworkAddTargetsSchema.params,
        body: HomeworkAddTargetsSchema.body
    }
};

const homeworkRemoveTargetOpts = {
    schema: {
        params: HomeworkRemoveTargetSchema.params
    }
};

const homeworkGetStatsOpts = {
    schema: {
        querystring: HomeworkGetStatsSchema.querystring
    }
};

const homeworkGetUpcomingOpts = {
    schema: {
        querystring: HomeworkGetUpcomingSchema.querystring
    }
};

const homeworkGetOverdueOpts = {
    schema: {
        querystring: HomeworkGetOverdueSchema.querystring
    }
};

async function homeworkRoutes(app, options) {
    // Create homework
    app.post("/homework", homeworkCreateOpts, create_homework);

    // Get homework
    app.get("/homework/:homework_id", homeworkGetByIdOpts, get_homework_by_id);
    app.get("/homework/teacher/all", homeworkGetByTeacherOpts, get_homework_by_teacher);
    app.get("/homework/target/all", homeworkGetByTargetOpts, get_homework_by_target);
    app.get("/homework/student/all", homeworkGetForStudentOpts, get_homework_for_student);

    // Update homework
    app.patch("/homework/:homework_id", homeworkUpdateOpts, update_homework);
    app.post("/homework/:homework_id/publish", homeworkPublishOpts, publish_homework);
    app.post("/homework/:homework_id/close", homeworkCloseOpts, close_homework);

    // Delete homework
    app.delete("/homework/:homework_id", homeworkDeleteOpts, delete_homework);

    // Attachments
    app.post("/homework/:homework_id/attachments", homeworkAddAttachmentsOpts, add_homework_attachments);
    app.delete("/homework/attachments/:attachment_id", homeworkRemoveAttachmentOpts, remove_homework_attachment);

    // Targets
    app.post("/homework/:homework_id/targets", homeworkAddTargetsOpts, add_homework_targets);
    app.delete("/homework/targets/:target_id", homeworkRemoveTargetOpts, remove_homework_target);

    // Statistics and special queries
    app.get("/homework/stats/teacher", homeworkGetStatsOpts, get_homework_stats);
    app.get("/homework/upcoming", homeworkGetUpcomingOpts, get_upcoming_homework);
    app.get("/homework/overdue", homeworkGetOverdueOpts, get_overdue_homework);
}

export default homeworkRoutes;
