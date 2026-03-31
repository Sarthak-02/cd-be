import { user_all_get, user_get, user_delete, user_post, user_put } from "../../controllers/onboarding/user.controller.js";
import { userCreateRequestSchema, userGetRequestSchema, userEditRequestSchema } from "../../schemas/onboarding/user.schema.js";

const userCreateOpts = {
    schema: {
        body: userCreateRequestSchema.body
    }
}

const userEditOpts = {
    schema: {
        body: userEditRequestSchema.body
    }
}

const userGetOpts = {
    schema: userGetRequestSchema.querystring
};

async function userRoutes(app, options) {
    app.post("/user", userCreateOpts, user_post);
    app.put("/user", userEditOpts, user_put);
    app.get("/user", userGetOpts, user_get);
    app.get("/user/all", {}, user_all_get);
    app.delete("/user", userGetOpts, user_delete);
}

export default userRoutes