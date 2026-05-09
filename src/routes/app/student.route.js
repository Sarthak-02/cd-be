import { students_by_section_get, student_permissions_get } from '../../controllers/app/student.controller.js';
import { StudentsBySectionGetRequestSchema, StudentPermissionsGetRequestSchema } from '../../schemas/app/student.schema.js';

const studentsBySectionGetOpts = {
  schema: StudentsBySectionGetRequestSchema
};

const studentPermissionsGetOpts = {
  schema: StudentPermissionsGetRequestSchema
};

async function studentRoutes(app, options) {
  app.get("/students/by-section", studentsBySectionGetOpts, students_by_section_get);
  app.get("/student/permissions", studentPermissionsGetOpts, student_permissions_get);
}

export default studentRoutes;
