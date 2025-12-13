import {teacher_post,teacher_put,teacher_get,teacher_all_get,teacher_delete} from '../controllers/teacher.controller.js'
import { teacherCreateRequestSchema , teacherGetRequestSchema,teacherByCampusGetRequestSchema} from '../schemas/teacher.schema.js';

// --- Teacher Options ---
const teacherCreateOpts = {
    schema: {
      body: teacherCreateRequestSchema.body
    }
  };
  
  const teacherGetOpts = {
    schema: teacherGetRequestSchema.querystring
  };
  
  const teacherByCampusGetOpts = {
    schema: teacherByCampusGetRequestSchema.querystring
  };
  
  // --- Teacher Routes ---
  async function teacherRoutes(app, options) {
    app.post("/teacher", teacherCreateOpts, teacher_post);
    app.put("/teacher", teacherCreateOpts, teacher_put);
    app.get("/teacher", teacherGetOpts, teacher_get);
    app.get("/teacher/all",teacherByCampusGetOpts, teacher_all_get);
    app.delete("/teacher", teacherGetOpts, teacher_delete);
  }
  
  export default teacherRoutes;
  