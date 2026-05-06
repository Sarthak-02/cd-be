import {
  school_post,
  school_put,
  school_get,
  school_all_get,
  school_delete,
} from "../../controllers/onboarding/school.controller.js";
import {
  schoolCreateRequestSchema,
  schoolGetRequestSchema,
  schoolUpdateRequestSchema,
} from "../../schemas/onboarding/school.schema.js";

const schoolCreateOpts = {
  schema: {
    tags: schoolCreateRequestSchema.tags,
    body: schoolCreateRequestSchema.body,
  },
};

const schoolUpdateOpts = {
  schema: {
    tags: schoolUpdateRequestSchema.tags,
    body: schoolUpdateRequestSchema.body,
  },
};

const schoolGetOpts = {
  schema: {
    tags: schoolGetRequestSchema.tags,
    querystring: schoolGetRequestSchema.querystring,
  },
};

const schoolAllOpts = {
  schema: {
    tags: ["School"],
  },
};

async function schoolRoutes(app, options) {
  app.post("/school", schoolCreateOpts, school_post);
  app.put("/school", schoolUpdateOpts, school_put);
  app.get("/school", schoolGetOpts, school_get);
  app.get("/school/all", schoolAllOpts, school_all_get);
  app.delete("/school", schoolGetOpts, school_delete);
}

export default schoolRoutes;
