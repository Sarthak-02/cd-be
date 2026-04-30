import {
  createBroadcastDraft,
  sendBroadcast,
  getBroadcastsByReceiverId,
  getBroadcastsByCreatedBy,
  getBroadcastById,
  getAllBroadcasts,
  updateBroadcast
} from "../../services/app/broadcast.service.js";
import { generateDocumentUploadSignedUrl } from "../../services/gcsSignedUrl.js";

export async function broadcast_post(req, reply) {
  try {
    const {
      title,
      message,
      category,
      attachmentUrls,
      targets,
      campusId,
      userId = "sarthak",
    } = req.body;

    const broadcast = await createBroadcastDraft({
      title,
      message,
      category,
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
      category,
      sourceType,
      limit = 100, 
      offset = 0 
    } = req.query;

    const result = await getAllBroadcasts({
      campusId,
      status,
      createdBy,
      category,
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

export async function generate_broadcast_attachment_upload_url(req, reply) {
  try {
    let { broadcast_id, file_name, mime_type, campus_id } = req.body;

    if (!file_name || !mime_type) {
      return reply.code(400).send({
        success: false,
        message: "file_name and mime_type are required",
      });
    }

    if (!broadcast_id) {
      broadcast_id = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }

    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/tiff",
      "image/bmp",
      "image/ico",
    ];

    if (!allowedMimeTypes.includes(mime_type)) {
      return reply.code(400).send({
        success: false,
        message: "Invalid file type. Only PDF, Word, Excel, PowerPoint, text files, and images are allowed.",
      });
    }

    const result = await generateDocumentUploadSignedUrl({
      entity: "broadcast",
      entityId: broadcast_id,
      fileName: file_name,
      mimeType: mime_type,
      campus_id: campus_id,
    });

    return reply.code(200).send({
      success: true,
      message: "Signed URL generated successfully",
      data: {
        broadcastId: broadcast_id,
        uploadUrl: result.uploadUrl,
        publicUrl: result.publicUrl,
        objectPath: result.objectPath,
      },
    });
  } catch (err) {
    console.error(err);
    return reply.code(500).send({
      success: false,
      message: err.message || "Unable to generate upload URL",
    });
  }
}

// Update broadcast (only for DRAFT status)
export async function broadcast_update(req, reply) {
  try {
    const { id } = req.params;
    const { title, message, category, attachmentUrls, targets } = req.body;

    if (!id) {
      return reply.code(400).send({ error: "id is required" });
    }

    const updatedBroadcast = await updateBroadcast(id, {
      title,
      message,
      category,
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
