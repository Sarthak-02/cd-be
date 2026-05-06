import { createEndUsersController } from "../../controllers/onboarding/enduser.controller.js";
import { createEndUsersRequestSchema } from "../../schemas/onboarding/enduser.schema.js";

const createEndUsersOpts = {
  schema: {
    tags: createEndUsersRequestSchema.tags,
    body: createEndUsersRequestSchema.body,
  },
};

async function endUserRoutes(app, options) {
  app.post("/end-users", createEndUsersOpts, createEndUsersController);
}

export default endUserRoutes;
