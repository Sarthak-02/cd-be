import {class_post,class_put,class_get,class_all_get,class_delete} from '../../controllers/onboarding/class.controller.js'

import { classCreateRequestSchema , classGetRequestSchema ,classByCampusGetRequestSchema } from '../../schemas/onboarding/class.schema.js';
// --- Class Options ---
const classCreateOpts = {
    schema: {
      body: classCreateRequestSchema.body
    }
  };
  
  const classGetOpts = {
    schema: classGetRequestSchema.querystring
  };

  const classByCampusGetOpts = {
    schema:  classByCampusGetRequestSchema.querystring
  }
  
  
  // --- Class Routes ---
  async function classRoutes(app, options) {
    app.post("/class", classCreateOpts, class_post);
    app.put("/class", classCreateOpts, class_put);
    app.get("/class", classGetOpts, class_get);
    app.get("/class/all", classByCampusGetOpts, class_all_get);
    app.delete("/class", classGetOpts, class_delete);
  }
  
  export default classRoutes;
  