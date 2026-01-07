const fastify = require("fastify")({
    logger: true,
  });
  
  const { pubsubHandler } = require("./routes/pubsub");
  
  // Health check (recommended for Cloud Run)
  fastify.get("/health", async () => {
    return { ok: true };
  });
  
  // Pub/Sub push endpoint
  fastify.post("/pubsub/push", pubsubHandler);
  
  const PORT = process.env.PORT || 8080;
  
  const start = async () => {
    try {
      await fastify.listen({ port: PORT, host: "0.0.0.0" });
      fastify.log.info(`Notification worker running on port ${PORT}`);
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  };
  
  start();
  