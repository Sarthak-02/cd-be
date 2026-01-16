import { students_by_section_get } from '../../controllers/app/student.controller.js';
import { StudentsBySectionGetRequestSchema } from '../../schemas/app/student.schema.js';

const studentsBySectionGetOpts = {
  schema: StudentsBySectionGetRequestSchema
};

async function studentRoutes(app, options) {
  app.get("/students/by-section", studentsBySectionGetOpts, students_by_section_get);
}

export default studentRoutes;
