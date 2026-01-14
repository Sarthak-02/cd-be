import { createBroadcastDraft, sendBroadcast } from "../../services/app/broadcast.service.js";

export async function broadcast_post(req, reply) {
  try {
    const {
      title,
      message,
      attachmentUrls,
      targets,
      campusId,
      userId = "sarthak",
    } = req.body;

    const broadcast = await createBroadcastDraft({
      title,
      message,
      attachmentUrls,
      createdBy: userId,
      campusId,
      targets,
    });

    if (!broadcast) {
      throw new Error("Unable to send the message");
    }

    // Ideally this should be async via queue
    const result = await sendBroadcast(broadcast.id, campusId);

    if (!result.ok) {
      throw new Error("Unable to send the message");
    }

    return reply.code(200).send({ success: true });
  } catch (err) {
    return reply.code(400).send({ error: err.message });
  }
}
