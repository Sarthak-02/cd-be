import {loginController,logoutController} from '../controllers/index.js'
import {loginRequestSchema,InfoSchema} from '../schemas/index.js'

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
