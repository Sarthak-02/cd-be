import {loginController,logoutController} from '../../controllers/onboarding/index.js'
import {loginRequestSchema,InfoSchema} from '../../schemas/onboarding/index.js'

const authOpts = {
    schema: {
      body: loginRequestSchema.body
    }
  };



async function authRoutes(app, options) {
    // print(authOpts)
  app.post("/login", authOpts, loginController);

  app.get("/logout",{},logoutController)
}

export default authRoutes;
