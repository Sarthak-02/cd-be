import { getUserDetails } from "../../utils/cache/user.cache.js";
import fp from "fastify-plugin";

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
      const user_details = await getUserDetails(userid)

      if(!user_details){
        throw new Error("Unauthorized")
      }

      req['token_info'] = user_details

    } catch (err) {
      reply.code(401).send({ error: "Unauthorized" });
    }
  });
};

export default fp(authHook);
