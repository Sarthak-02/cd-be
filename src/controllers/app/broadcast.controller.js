import { 
  createBroadcastDraft, 
  sendBroadcast,
  getBroadcastsByReceiverId,
  getBroadcastsByCreatedBy,
  getBroadcastById,
  getAllBroadcasts,
  updateBroadcast
} from "../../services/app/broadcast.service.js";

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

// Get broadcasts received by a user
export async function broadcast_get_received(req, reply) {
  try {
    const { receiverId, campusId } = req.query;

    if (!receiverId) {
      return reply.code(400).send({ error: "receiverId is required" });
    }

    const broadcasts = await getBroadcastsByReceiverId(receiverId, campusId);

    return reply.code(200).send({
      success: true,
      data: broadcasts,
      count: broadcasts.length,
    });
  } catch (err) {
    return reply.code(400).send({ error: err.message });
  }
}

// Get broadcasts created by a user
export async function broadcast_get_sent(req, reply) {
  try {
    const { createdBy, campusId } = req.query;

    if (!createdBy) {
      return reply.code(400).send({ error: "createdBy is required" });
    }

    const broadcasts = await getBroadcastsByCreatedBy(createdBy, campusId);

    return reply.code(200).send({
      success: true,
      data: broadcasts,
      count: broadcasts.length,
    });
  } catch (err) {
    return reply.code(400).send({ error: err.message });
  }
}

// Get broadcast details by ID
export async function broadcast_get_by_id(req, reply) {
  try {
    const { id } = req.params;

    if (!id) {
      return reply.code(400).send({ error: "id is required" });
    }

    const broadcast = await getBroadcastById(id);

    return reply.code(200).send({
      success: true,
      data: broadcast,
    });
  } catch (err) {
    if (err.message === "BROADCAST_NOT_FOUND") {
      return reply.code(404).send({ error: "Broadcast not found" });
    }
    return reply.code(400).send({ error: err.message });
  }
}

// Get all broadcasts with optional filters
export async function broadcast_get_all(req, reply) {
  try {
    const { 
      campusId, 
      status, 
      createdBy,
      sourceType,
      limit = 100, 
      offset = 0 
    } = req.query;

    const result = await getAllBroadcasts({
      campusId,
      status,
      createdBy,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return reply.code(200).send({
      success: true,
      data: result.broadcasts,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.offset + result.broadcasts.length < result.total,
      },
    });
  } catch (err) {
    return reply.code(400).send({ error: err.message });
  }
}

// Update broadcast (only for DRAFT status)
export async function broadcast_update(req, reply) {
  try {
    const { id } = req.params;
    const { title, message, attachmentUrls, targets } = req.body;

    if (!id) {
      return reply.code(400).send({ error: "id is required" });
    }

    const updatedBroadcast = await updateBroadcast(id, {
      title,
      message,
      attachmentUrls,
      targets,
    });

    return reply.code(200).send({
      success: true,
      data: updatedBroadcast,
    });
  } catch (err) {
    if (err.message === "BROADCAST_NOT_FOUND") {
      return reply.code(404).send({ error: "Broadcast not found" });
    }
    if (err.message === "BROADCAST_ALREADY_SENT") {
      return reply.code(400).send({ 
        error: "Cannot update broadcast that has already been sent. Only DRAFT broadcasts can be updated." 
      });
    }
    if (err.message === "MAX_3_ATTACHMENTS_ALLOWED") {
      return reply.code(400).send({ error: "Maximum 3 attachments allowed" });
    }
    return reply.code(400).send({ error: err.message });
  }
}
