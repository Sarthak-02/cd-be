import {
  class_post,
  class_put,
  class_get,
  class_all_get,
  class_delete,
} from "../../controllers/onboarding/class.controller.js";
import {
  classCreateRequestSchema,
  classGetRequestSchema,
  classByCampusGetRequestSchema,
  classUpdateRequestSchema,
} from "../../schemas/onboarding/class.schema.js";

const classCreateOpts = {
  schema: {
    tags: classCreateRequestSchema.tags,
    body: classCreateRequestSchema.body,
  },
};

const classUpdateOpts = {
  schema: {
    tags: classUpdateRequestSchema.tags,
    body: classUpdateRequestSchema.body,
  },
};

const classGetOpts = {
  schema: {
    tags: classGetRequestSchema.tags,
    querystring: classGetRequestSchema.querystring,
  },
};

const classByCampusGetOpts = {
  schema: {
    tags: classByCampusGetRequestSchema.tags,
    querystring: classByCampusGetRequestSchema.querystring,
  },
};

async function classRoutes(app, options) {
  app.post("/class", classCreateOpts, class_post);
  app.put("/class", classUpdateOpts, class_put);
  app.get("/class", classGetOpts, class_get);
  app.get("/class/all", classByCampusGetOpts, class_all_get);
  app.delete("/class", classGetOpts, class_delete);
}

export default classRoutes;
