import { getReceiverSummary } from "../../services/app/receiverSummary.service.js";

export async function receiver_summary_get(req, reply) {
  try {
    const { receiverId, sectionId, campusId } = req.query;

    const result = await getReceiverSummary({
      receiverId,
      sectionId,
      campusId,
    });

    if (!result.ok) {
      return reply.code(result.code).send({
        success: false,
        message: result.message,
      });
    }

    return reply.code(200).send({
      success: true,
      data: result.data,
    });
  } catch (err) {
    console.error(err);
    return reply.code(500).send({
      success: false,
      message: "Unable to load receiver summary",
    });
  }
}
