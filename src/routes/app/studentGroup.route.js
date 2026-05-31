import {
    create_student_group,
    get_student_group_by_id,
    list_student_groups,
    update_student_group,
    delete_student_group,
    add_group_members,
    remove_group_members,
} from "../../controllers/app/studentGroup.controller.js";

import {
    StudentGroupCreateSchema,
    StudentGroupGetByIdSchema,
    StudentGroupListSchema,
    StudentGroupUpdateSchema,
    StudentGroupDeleteSchema,
    StudentGroupAddMembersSchema,
    StudentGroupRemoveMembersSchema,
} from "../../schemas/app/studentGroup.schema.js";

async function studentGroupRoutes(app, options) {
    app.post("/student-groups", { schema: { body: StudentGroupCreateSchema.body } }, create_student_group);

    app.get("/student-groups", { schema: { querystring: StudentGroupListSchema.querystring } }, list_student_groups);

    app.get("/student-groups/:group_id", { schema: { params: StudentGroupGetByIdSchema.params } }, get_student_group_by_id);

    app.patch("/student-groups/:group_id", { schema: { params: StudentGroupUpdateSchema.params, body: StudentGroupUpdateSchema.body } }, update_student_group);

    app.delete("/student-groups/:group_id", { schema: { params: StudentGroupDeleteSchema.params } }, delete_student_group);

    app.post("/student-groups/:group_id/members", { schema: { params: StudentGroupAddMembersSchema.params, body: StudentGroupAddMembersSchema.body } }, add_group_members);

    app.delete("/student-groups/:group_id/members", { schema: { params: StudentGroupRemoveMembersSchema.params, body: StudentGroupRemoveMembersSchema.body } }, remove_group_members);
}

export default studentGroupRoutes;
