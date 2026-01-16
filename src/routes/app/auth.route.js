import { signupController, loginController } from "../../controllers/app/auth.controller.js";
import { SignupRequestSchema, LoginRequestSchema } from "../../schemas/app/auth.schema.js";

const signupOpts = {
  schema: {
    body: SignupRequestSchema.body
  }
};

const loginOpts = {
  schema: {
    body: LoginRequestSchema.body
  }
};

export async function authRouter(app, options) {
  app.post("/signup", signupOpts, signupController);
  app.post("/login", loginOpts, loginController);
}
