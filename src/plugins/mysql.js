// plugins/mysql.js
import fp from "fastify-plugin";
import { initDB } from "./db.js";

export default fp(async  (app) => {
  const pool = await initDB();

  // decorate fastify instance
  app.decorate("mysql", pool);

  // cleanup when fastify closes
  app.addHook("onClose", async () => {
    await pool.end();
    console.log("🛑 DB pool closed");
  });
});


