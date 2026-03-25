import { receiver_summary_get } from "../../controllers/app/receiverSummary.controller.js";
import { ReceiverSummaryGetSchema } from "../../schemas/app/receiverSummary.schema.js";

const receiverSummaryGetOpts = {
  schema: {
    querystring: ReceiverSummaryGetSchema.querystring,
  },
};

export async function receiverSummaryRouter(app) {
  app.get("/receiver/summary", receiverSummaryGetOpts, receiver_summary_get);
}
