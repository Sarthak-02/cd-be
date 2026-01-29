import { signupController, loginController, logoutController } from "../../controllers/app/auth.controller.js";
import { SignupRequestSchema, LoginRequestSchema, LogoutRequestSchema } from "../../schemas/app/auth.schema.js";

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

const logoutOpts = {
  schema: LogoutRequestSchema
};

export async function authRouter(app, options) {
  app.post("/signup", signupOpts, signupController);
  app.post("/login", loginOpts, loginController);
  app.post("/logout", logoutOpts, logoutController);
}
