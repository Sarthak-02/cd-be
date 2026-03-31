import {student_post,student_put,student_get,student_all_get,student_delete} from '../../controllers/onboarding/student.controller.js'
import { studentCreateRequestSchema , studentGetRequestSchema ,studentByCampusGetRequestSchema } from '../../schemas/onboarding/student.schema.js';

// --- Student Options ---
const studentCreateOpts = {
    schema: {
      body: studentCreateRequestSchema.body
    }
  };
  
  const studentGetOpts = {
    schema: studentGetRequestSchema.querystring
  };
  
  const studentByCampusGetOpts = {
    schema: studentByCampusGetRequestSchema.querystring
  };
  
  // --- Student Routes ---
  async function studentRoutes(app, options) {
    app.post("/student", studentCreateOpts, student_post);
    app.put("/student", studentCreateOpts, student_put);
    app.get("/student", studentGetOpts, student_get);
    app.get("/student/all", studentByCampusGetOpts, student_all_get);
    app.delete("/student", studentGetOpts, student_delete);
  }
  
  export default studentRoutes;
  