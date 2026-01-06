import { broadcast_post } from "../../controllers/app/broadcast.controller";
import { BroadcastCreateRequestSchema } from "../../schemas/app/broadcast.schema"

const broadcastCreateOpts = {
    schema: {
        body: BroadcastCreateRequestSchema
    }
};



export async function broadcastRouter(app,options) {
    app.post("/broadcast",broadcastCreateOpts,broadcast_post)
}