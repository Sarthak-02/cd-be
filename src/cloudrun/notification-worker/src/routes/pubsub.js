import { processNotification } from "../services/notification.service";

async function pubsubHandler(req, reply) {
  try {
    const pubsubMessage = req.body?.message;

    if (!pubsubMessage?.data) {
      reply.code(400).send("No message");
      return;
    }

    const data = JSON.parse(
      Buffer.from(pubsubMessage.data, "base64").toString("utf-8")
    );

    const { notificationId, channel } = data;

    if (!notificationId || !channel) {
      reply.code(400).send("Invalid payload");
      return;
    }

    await processNotification(notificationId, channel);

    // ✅ 2xx = ACK
    reply.code(204).send();
  } catch (err) {
    req.log.error(err, "Pub/Sub notification processing failed");

    // ❌ Non-2xx = retry
    reply.code(500).send();
  }
}

