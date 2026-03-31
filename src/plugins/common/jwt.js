import fp from "fastify-plugin";
import jwt from "@fastify/jwt";

export default fp(async (app) => {
  app.register(jwt, {
    secret: "jwt-secret-key",
    cookie: {
      cookieName: "token",
      signed: false,
    },
  });
});
