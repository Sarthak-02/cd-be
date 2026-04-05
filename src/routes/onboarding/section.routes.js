import {
  section_post,
  section_put,
  section_get,
  section_all_get,
  section_delete,
} from "../../controllers/onboarding/section.controller.js";
import {
  sectionCreateRequestSchema,
  sectionGetRequestSchema,
  sectionByCampusGetRequestSchema,
  sectionUpdateRequestSchema,
} from "../../schemas/onboarding/section.schema.js";

const sectionCreateOpts = {
  schema: {
    tags: sectionCreateRequestSchema.tags,
    body: sectionCreateRequestSchema.body,
  },
};

const sectionUpdateOpts = {
  schema: {
    tags: sectionUpdateRequestSchema.tags,
    body: sectionUpdateRequestSchema.body,
  },
};

const sectionGetOpts = {
  schema: {
    tags: sectionGetRequestSchema.tags,
    querystring: sectionGetRequestSchema.querystring,
  },
};

const sectionByCampusGetOpts = {
  schema: {
    tags: sectionByCampusGetRequestSchema.tags,
    querystring: sectionByCampusGetRequestSchema.querystring,
  },
};

async function sectionRoutes(app, options) {
  app.post("/section", sectionCreateOpts, section_post);
  app.put("/section", sectionUpdateOpts, section_put);
  app.get("/section", sectionGetOpts, section_get);
  app.get("/section/all", sectionByCampusGetOpts, section_all_get);
  app.delete("/section", sectionGetOpts, section_delete);
}

export default sectionRoutes;
