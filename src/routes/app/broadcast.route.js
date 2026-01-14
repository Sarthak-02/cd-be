import { broadcast_post } from "../../controllers/app/broadcast.controller.js";
import { BroadcastCreateRequestSchema } from "../../schemas/app/broadcast.schema.js"

const broadcastCreateOpts = {
    schema: {
        body: BroadcastCreateRequestSchema.body
    }
};



export async function broadcastRouter(app,options) {
    app.post("/broadcast",broadcastCreateOpts,broadcast_post)
}