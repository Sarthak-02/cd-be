import {
  create_master_lesson_plan,
  get_master_lesson_plan_by_id,
  list_master_lesson_plans,
  fetch_master_lesson_plan,
  update_master_lesson_plan,
  delete_master_lesson_plan,
} from "../../controllers/app/masterLessonPlan.controller.js";
import {
  MasterLessonPlanCreateSchema,
  MasterLessonPlanGetByIdSchema,
  MasterLessonPlanListSchema,
  MasterLessonPlanFetchSchema,
  MasterLessonPlanUpdateSchema,
  MasterLessonPlanDeleteSchema,
} from "../../schemas/app/masterLessonPlan.schema.js";

async function masterLessonPlanRoutes(app) {
  app.get(
    "/master-lesson-plans",
    { schema: { querystring: MasterLessonPlanListSchema.querystring } },
    list_master_lesson_plans
  );

  app.get(
    "/master-lesson-plans/fetch",
    { schema: { querystring: MasterLessonPlanFetchSchema.querystring } },
    fetch_master_lesson_plan
  );

  app.post(
    "/master-lesson-plans",
    { schema: { body: MasterLessonPlanCreateSchema.body } },
    create_master_lesson_plan
  );

  app.get(
    "/master-lesson-plans/:master_lesson_plan_id",
    { schema: { params: MasterLessonPlanGetByIdSchema.params } },
    get_master_lesson_plan_by_id
  );

  app.patch(
    "/master-lesson-plans/:master_lesson_plan_id",
    { schema: { params: MasterLessonPlanUpdateSchema.params, body: MasterLessonPlanUpdateSchema.body } },
    update_master_lesson_plan
  );

  app.delete(
    "/master-lesson-plans/:master_lesson_plan_id",
    { schema: { params: MasterLessonPlanDeleteSchema.params } },
    delete_master_lesson_plan
  );
}

export default masterLessonPlanRoutes;
