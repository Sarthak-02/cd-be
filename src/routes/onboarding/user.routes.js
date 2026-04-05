import {
  user_all_get,
  user_get,
  user_delete,
  user_post,
  user_put,
} from "../../controllers/onboarding/user.controller.js";
import {
  userCreateRequestSchema,
  userGetRequestSchema,
  userUpdateRequestSchema,
} from "../../schemas/onboarding/user.schema.js";

const userCreateOpts = {
  schema: {
    tags: userCreateRequestSchema.tags,
    body: userCreateRequestSchema.body,
  },
};

const userUpdateOpts = {
  schema: {
    tags: userUpdateRequestSchema.tags,
    body: userUpdateRequestSchema.body,
  },
};

const userGetOpts = {
  schema: {
    tags: userGetRequestSchema.tags,
    querystring: userGetRequestSchema.querystring,
  },
};

const userAllOpts = {
  schema: {
    tags: ["User"],
  },
};

async function userRoutes(app, options) {
  app.post("/user", userCreateOpts, user_post);
  app.put("/user", userUpdateOpts, user_put);
  app.get("/user", userGetOpts, user_get);
  app.get("/user/all", userAllOpts, user_all_get);
  app.delete("/user", userGetOpts, user_delete);
}

export default userRoutes;
