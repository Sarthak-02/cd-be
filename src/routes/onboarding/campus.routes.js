import {
  campus_post,
  campus_put,
  campus_get,
  campus_all_get,
  campus_delete,
} from "../../controllers/onboarding/campus.controller.js";
import {
  campusCreateRequestSchema,
  campusGetRequestSchema,
  campusUpdateRequestSchema,
} from "../../schemas/onboarding/campus.schema.js";

const campusCreateOpts = {
  schema: {
    tags: campusCreateRequestSchema.tags,
    body: campusCreateRequestSchema.body,
  },
};

const campusUpdateOpts = {
  schema: {
    tags: campusUpdateRequestSchema.tags,
    body: campusUpdateRequestSchema.body,
  },
};

const campusGetOpts = {
  schema: {
    tags: campusGetRequestSchema.tags,
    querystring: campusGetRequestSchema.querystring,
  },
};

const campusAllOpts = {
  schema: {
    tags: ["Campus"],
  },
};

async function campusRoutes(app, options) {
  app.post("/campus", campusCreateOpts, campus_post);
  app.put("/campus", campusUpdateOpts, campus_put);
  app.get("/campus", campusGetOpts, campus_get);
  app.get("/campus/all", campusAllOpts, campus_all_get);
  app.delete("/campus", campusGetOpts, campus_delete);
}

export default campusRoutes;
