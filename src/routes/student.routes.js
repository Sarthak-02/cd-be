import {student_post,student_put,student_get,student_all_get,student_delete} from '../controllers/student.controller.js'
import { studentCreateRequestSchema , studentGetRequestSchema } from '../schemas/student.schema.js';

// --- Student Options ---
const studentCreateOpts = {
    schema: {
      body: studentCreateRequestSchema.body
    }
  };
  
  const studentGetOpts = {
    schema: studentGetRequestSchema.querystring
  };
  
  
  // --- Student Routes ---
  async function studentRoutes(app, options) {
    app.post("/student", studentCreateOpts, student_post);
    app.put("/student", studentCreateOpts, student_put);
    app.get("/student", studentGetOpts, student_get);
    app.get("/student/all", {}, student_all_get);
    app.delete("/student", studentGetOpts, student_delete);
  }
  
  export default studentRoutes;
  