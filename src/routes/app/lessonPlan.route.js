import {
  create_lesson_plan,
  get_lesson_plan_by_id,
  list_lesson_plans,
  update_lesson_plan,
  delete_lesson_plan,
  add_lesson_plan_attachments,
  remove_lesson_plan_attachment,
  generate_lesson_plan_attachment_upload_url,
  clone_lesson_plans_to_section,
} from "../../controllers/app/lessonPlan.controller.js";
import {
  LessonPlanCreateSchema,
  LessonPlanGetByIdSchema,
  LessonPlanListSchema,
  LessonPlanUpdateSchema,
  LessonPlanDeleteSchema,
  LessonPlanAddAttachmentsSchema,
  LessonPlanRemoveAttachmentSchema,
  LessonPlanGenerateUploadUrlSchema,
  LessonPlanCloneSchema,
} from "../../schemas/app/lessonPlan.schema.js";

const createOpts = {
  schema: { body: LessonPlanCreateSchema.body },
};

const getByIdOpts = {
  schema: { params: LessonPlanGetByIdSchema.params },
};

const listOpts = {
  schema: { querystring: LessonPlanListSchema.querystring },
};

const updateOpts = {
  schema: {
    params: LessonPlanUpdateSchema.params,
    body: LessonPlanUpdateSchema.body,
  },
};

const deleteOpts = {
  schema: { params: LessonPlanDeleteSchema.params },
};

const addAttachmentsOpts = {
  schema: {
    params: LessonPlanAddAttachmentsSchema.params,
    body: LessonPlanAddAttachmentsSchema.body,
  },
};

const removeAttachmentOpts = {
  schema: { params: LessonPlanRemoveAttachmentSchema.params },
};

const uploadUrlOpts = {
  schema: { body: LessonPlanGenerateUploadUrlSchema.body },
};

const cloneOpts = {
  schema: { body: LessonPlanCloneSchema.body },
};

async function lessonPlanRoutes(app) {
  app.post(
    "/lesson-plans/attachment/upload-url",
    uploadUrlOpts,
    generate_lesson_plan_attachment_upload_url
  );

  app.get("/lesson-plans", listOpts, list_lesson_plans);
  app.post("/lesson-plans", createOpts, create_lesson_plan);
  app.post("/lesson-plans/clone", cloneOpts, clone_lesson_plans_to_section);

  app.delete(
    "/lesson-plans/attachments/:attachment_id",
    removeAttachmentOpts,
    remove_lesson_plan_attachment
  );

  app.get("/lesson-plans/:lesson_plan_id", getByIdOpts, get_lesson_plan_by_id);
  app.patch("/lesson-plans/:lesson_plan_id", updateOpts, update_lesson_plan);
  app.delete("/lesson-plans/:lesson_plan_id", deleteOpts, delete_lesson_plan);
  app.post(
    "/lesson-plans/:lesson_plan_id/attachments",
    addAttachmentsOpts,
    add_lesson_plan_attachments
  );
}

export default lessonPlanRoutes;
