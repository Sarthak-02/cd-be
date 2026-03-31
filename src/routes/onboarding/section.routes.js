import {section_post,section_put,section_get,section_all_get,section_delete} from '../../controllers/onboarding/section.controller.js'

import { sectionCreateRequestSchema , sectionGetRequestSchema ,sectionByCampusGetRequestSchema } from '../../schemas/onboarding/section.schema.js';
// --- Section Options ---
const sectionCreateOpts = {
    schema: {
      body: sectionCreateRequestSchema.body
    }
  };
  
  const sectionGetOpts = {
    schema: sectionGetRequestSchema.querystring
  };
  
  const sectionByCampusGetOpts = {
    schema: sectionByCampusGetRequestSchema.querystring
  }
  
  // --- Section Routes ---
  async function sectionRoutes(app, options) {
    app.post("/section", sectionCreateOpts, section_post);
    app.put("/section", sectionCreateOpts, section_put);
    app.get("/section", sectionGetOpts, section_get);
    app.get("/section/all", sectionByCampusGetOpts, section_all_get);
    app.delete("/section", sectionGetOpts, section_delete);
  }
  
  export default sectionRoutes;
  