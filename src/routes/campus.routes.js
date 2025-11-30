import {campus_post,campus_put,campus_get,campus_all_get,campus_delete} from '../controllers/campus.controller.js'
import { campusCreateRequestSchema , campusGetRequestSchema } from '../schemas/campus.schema.js';

// --- Campus Options ---
const campusCreateOpts = {
    schema: {
      body: campusCreateRequestSchema.body
    }
  };
  
  const campusGetOpts = {
    schema: campusGetRequestSchema.querystring
  };
  
  
  // --- Campus Routes ---
  async function campusRoutes(app, options) {
    app.post("/campus", campusCreateOpts, campus_post);
    app.put("/campus", campusCreateOpts, campus_put);
    app.get("/campus", campusGetOpts, campus_get);
    app.get("/campus/all", {}, campus_all_get);
    app.delete("/campus", campusGetOpts, campus_delete);
  }
  
  export default campusRoutes;
  