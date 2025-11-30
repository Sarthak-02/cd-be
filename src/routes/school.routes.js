import {school_post,school_put,school_get,school_all_get,school_delete} from '../controllers/school.controller.js'
import { schoolCreateRequestSchema , schoolGetRequestSchema } from '../schemas/school.schema.js';
// --- School Options ---
const schoolCreateOpts = {
    schema: {
      body: schoolCreateRequestSchema.body
    }
  };
  
  const schoolGetOpts = {
    schema: schoolGetRequestSchema.querystring
  };
  
  
  // --- School Routes ---
  async function schoolRoutes(app, options) {
    app.post("/school", schoolCreateOpts, school_post);
    app.put("/school", schoolCreateOpts, school_put);
    app.get("/school", schoolGetOpts, school_get);
    app.get("/school/all", {}, school_all_get);
    app.delete("/school", schoolGetOpts, school_delete);
  }
  
  export default schoolRoutes;
  