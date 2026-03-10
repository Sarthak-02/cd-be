import { signupController, loginController, logoutController, changePasswordController } from "../../controllers/app/auth.controller.js";
import { SignupRequestSchema, LoginRequestSchema, LogoutRequestSchema, ChangePasswordRequestSchema } from "../../schemas/app/auth.schema.js";

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

const changePasswordOpts = {
  schema: ChangePasswordRequestSchema
};

export async function authRouter(app, options) {
  app.post("/signup", signupOpts, signupController);
  app.post("/login", loginOpts, loginController);
  app.post("/logout", logoutOpts, logoutController);
  app.post("/change-password", changePasswordOpts, changePasswordController);
}
