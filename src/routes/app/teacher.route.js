import { teacher_permissions_get } from '../../controllers/app/teacher.controller.js';
import { teacher_summary_post } from '../../controllers/app/teacherSummary.controller.js';
import { TeacherPermissionsGetRequestSchema } from '../../schemas/app/teacher.schema.js';
import { TeacherSummaryPostSchema } from '../../schemas/app/teacherSummary.schema.js';

const teacherPermissionsGetOpts = {
  schema: TeacherPermissionsGetRequestSchema
};

const teacherSummaryPostOpts = {
  schema: {
    body: TeacherSummaryPostSchema.body,
  },
};

async function teacherRoutes(app, options) {
  app.get("/teacher/permissions", teacherPermissionsGetOpts, teacher_permissions_get);
  app.post("/teacher/summary", teacherSummaryPostOpts, teacher_summary_post);
}

export default teacherRoutes;
