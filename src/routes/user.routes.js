import { user_all_get ,user_get ,user_delete ,user_post ,user_put } from "../controllers/user.controller.js";
import { userCreateRequestSchema ,userGetRequestSchema } from "../schemas/user.schema.js";

const userCreateOpts = {
    schema : {
        body : userCreateRequestSchema.body
    }
}

const userGetOpts = {
    schema: userGetRequestSchema.querystring
  };
  

async function userRoutes(app,options){
    app.post("/user",userCreateOpts,user_post);
    app.put("/user",userCreateOpts,user_put);
    app.get("/user", userGetOpts, user_get);
    app.get("/user/all",{},user_all_get);
    app.delete("/user", userGetOpts, user_delete);
}

export default userRoutes