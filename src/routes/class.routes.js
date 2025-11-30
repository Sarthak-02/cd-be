import {class_post,class_put,class_get,class_all_get,class_delete} from '../controllers/class.controller.js'

import { classCreateRequestSchema , classGetRequestSchema } from '../schemas/class.schema.js';
// --- Class Options ---
const classCreateOpts = {
    schema: {
      body: classCreateRequestSchema.body
    }
  };
  
  const classGetOpts = {
    schema: classGetRequestSchema.querystring
  };
  
  
  // --- Class Routes ---
  async function classRoutes(app, options) {
    app.post("/class", classCreateOpts, class_post);
    app.put("/class", classCreateOpts, class_put);
    app.get("/class", classGetOpts, class_get);
    app.get("/class/all", {}, class_all_get);
    app.delete("/class", classGetOpts, class_delete);
  }
  
  export default classRoutes;
  