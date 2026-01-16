import fp from "fastify-plugin";
import { getEndUserDetails } from "../../utils/cache/enduser.cache.js";
// import { getUserDetails } from "../../utils/cache/user.cache.js";

const authHook = async (app) => {
  app.addHook("preHandler", async (req, reply) => {
    // Skip auth for these routes
    if (req.url.includes("/login")) {
      return;
    }

    try {
      const payload = await req.jwtVerify();   // auto-reads cookie
      const {userid} = payload
      // Attach the userId or whole payload to req for all routes
      const user_details = await getEndUserDetails(userid)
    
      if(!user_details){
        throw new Error("Unauthorized");
      }

      req['token_info'] = user_details;

    } catch (err) {
      reply.code(401).send({ error: "Unauthorized" });
    }
  });
};

export default fp(authHook);
