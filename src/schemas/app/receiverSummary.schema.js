export const ReceiverSummaryGetSchema = {
  tags: ["Receiver summary"],
  querystring: {
    type: "object",
    required: ["receiverId", "sectionId", "campusId"],
    properties: {
      receiverId: { type: "string" },
      sectionId: { type: "string" },
      campusId: { type: "string" },
    },
  },
};
