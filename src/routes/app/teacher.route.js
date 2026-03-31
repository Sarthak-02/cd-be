import { teacher_permissions_get } from '../../controllers/app/teacher.controller.js';
import { TeacherPermissionsGetRequestSchema } from '../../schemas/app/teacher.schema.js';

const teacherPermissionsGetOpts = {
  schema: TeacherPermissionsGetRequestSchema
};

async function teacherRoutes(app, options) {
  app.get("/teacher/permissions", teacherPermissionsGetOpts, teacher_permissions_get);
}

export default teacherRoutes;
