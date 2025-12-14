import { generateImageUploadSignedUrl } from "../services/gcsSignedUrl.js";

export async function generateUploadImageUrlController(request, reply) {
  try {
    const { entity, entityId, mimeType } = request.body;

    const data = await generateImageUploadSignedUrl({
      entity,
      entityId,
      mimeType,
    });

    return reply.send({
      success: true,
      ...data,
    });
  } catch (error) {
    request.log.error(error);

    return reply.status(400).send({
      success: false,
      message: error.message || "Failed to generate upload URL",
    });
  }
}
