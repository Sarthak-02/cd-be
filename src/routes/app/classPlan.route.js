import {
  seed_class_plan_from_master,
  create_class_plan,
  get_class_plan_by_id,
  list_class_plans,
  update_class_plan,
  delete_class_plan,
  add_class_plan_topics,
  update_class_plan_topic,
  delete_class_plan_topic,
  create_topic_progress,
  update_topic_progress,
  delete_topic_progress,
  add_topic_material,
  delete_topic_material,
  add_topic_assignment,
  update_topic_assignment,
  delete_topic_assignment,
  add_topic_quiz,
  update_topic_quiz,
  delete_topic_quiz,
} from "../../controllers/app/classPlan.controller.js";
import {
  ClassPlanSeedFromMasterSchema,
  ClassPlanCreateSchema,
  ClassPlanGetByIdSchema,
  ClassPlanListSchema,
  ClassPlanUpdateSchema,
  ClassPlanDeleteSchema,
  ClassPlanAddTopicsSchema,
  ClassPlanTopicUpdateSchema,
  ClassPlanTopicDeleteSchema,
  ClassPlanTopicProgressCreateSchema,
  ClassPlanTopicProgressUpdateSchema,
  ClassPlanTopicProgressDeleteSchema,
  TopicMaterialAddSchema,
  TopicMaterialDeleteSchema,
  TopicAssignmentAddSchema,
  TopicAssignmentUpdateSchema,
  TopicAssignmentDeleteSchema,
  TopicQuizAddSchema,
  TopicQuizUpdateSchema,
  TopicQuizDeleteSchema,
} from "../../schemas/app/classPlan.schema.js";

async function classPlanRoutes(app) {
  // ── Seed from Master ───────────────────────────────────────────────────────
  app.post(
    "/class-plans/seed-from-master",
    { schema: { body: ClassPlanSeedFromMasterSchema.body } },
    seed_class_plan_from_master
  );

  // ── Class Plans ────────────────────────────────────────────────────────────
  app.get(
    "/class-plans",
    { schema: { querystring: ClassPlanListSchema.querystring } },
    list_class_plans
  );

  app.post(
    "/class-plans",
    { schema: { body: ClassPlanCreateSchema.body } },
    create_class_plan
  );

  app.get(
    "/class-plans/:class_plan_id",
    { schema: { params: ClassPlanGetByIdSchema.params, querystring: ClassPlanGetByIdSchema.querystring } },
    get_class_plan_by_id
  );

  app.patch(
    "/class-plans/:class_plan_id",
    { schema: { params: ClassPlanUpdateSchema.params, body: ClassPlanUpdateSchema.body } },
    update_class_plan
  );

  app.delete(
    "/class-plans/:class_plan_id",
    { schema: { params: ClassPlanDeleteSchema.params } },
    delete_class_plan
  );

  // ── Topics ─────────────────────────────────────────────────────────────────
  app.post(
    "/class-plans/:class_plan_id/topics",
    { schema: { params: ClassPlanAddTopicsSchema.params, body: ClassPlanAddTopicsSchema.body } },
    add_class_plan_topics
  );

  app.patch(
    "/class-plan-topics/:topic_id",
    { schema: { params: ClassPlanTopicUpdateSchema.params, body: ClassPlanTopicUpdateSchema.body } },
    update_class_plan_topic
  );

  app.delete(
    "/class-plan-topics/:topic_id",
    { schema: { params: ClassPlanTopicDeleteSchema.params } },
    delete_class_plan_topic
  );

  // ── Topic Progress ─────────────────────────────────────────────────────────
  app.post(
    "/class-plan-topics/:topic_id/progress",
    { schema: { params: ClassPlanTopicProgressCreateSchema.params, body: ClassPlanTopicProgressCreateSchema.body } },
    create_topic_progress
  );

  app.patch(
    "/class-plan-topic-progress/:progress_id",
    { schema: { params: ClassPlanTopicProgressUpdateSchema.params, body: ClassPlanTopicProgressUpdateSchema.body } },
    update_topic_progress
  );

  app.delete(
    "/class-plan-topic-progress/:progress_id",
    { schema: { params: ClassPlanTopicProgressDeleteSchema.params } },
    delete_topic_progress
  );

  // ── Materials ──────────────────────────────────────────────────────────────
  app.post(
    "/class-plan-topic-progress/:progress_id/materials",
    { schema: { params: TopicMaterialAddSchema.params, body: TopicMaterialAddSchema.body } },
    add_topic_material
  );

  app.delete(
    "/class-plan-materials/:material_id",
    { schema: { params: TopicMaterialDeleteSchema.params } },
    delete_topic_material
  );

  // ── Assignments ────────────────────────────────────────────────────────────
  app.post(
    "/class-plan-topic-progress/:progress_id/assignments",
    { schema: { params: TopicAssignmentAddSchema.params, body: TopicAssignmentAddSchema.body } },
    add_topic_assignment
  );

  app.patch(
    "/class-plan-assignments/:assignment_id",
    { schema: { params: TopicAssignmentUpdateSchema.params, body: TopicAssignmentUpdateSchema.body } },
    update_topic_assignment
  );

  app.delete(
    "/class-plan-assignments/:assignment_id",
    { schema: { params: TopicAssignmentDeleteSchema.params } },
    delete_topic_assignment
  );

  // ── Quizzes ────────────────────────────────────────────────────────────────
  app.post(
    "/class-plan-topic-progress/:progress_id/quizzes",
    { schema: { params: TopicQuizAddSchema.params, body: TopicQuizAddSchema.body } },
    add_topic_quiz
  );

  app.patch(
    "/class-plan-quizzes/:quiz_id",
    { schema: { params: TopicQuizUpdateSchema.params, body: TopicQuizUpdateSchema.body } },
    update_topic_quiz
  );

  app.delete(
    "/class-plan-quizzes/:quiz_id",
    { schema: { params: TopicQuizDeleteSchema.params } },
    delete_topic_quiz
  );
}

export default classPlanRoutes;
