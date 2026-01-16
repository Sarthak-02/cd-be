import { 
    broadcast_post,
    broadcast_get_received,
    broadcast_get_sent,
    broadcast_get_by_id,
    broadcast_get_all
} from "../../controllers/app/broadcast.controller.js";
import { 
    BroadcastCreateRequestSchema,
    BroadcastGetReceivedSchema,
    BroadcastGetSentSchema,
    BroadcastGetByIdSchema,
    BroadcastGetAllSchema
} from "../../schemas/app/broadcast.schema.js"

const broadcastCreateOpts = {
    schema: {
        body: BroadcastCreateRequestSchema.body
    }
};

const broadcastGetReceivedOpts = {
    schema: {
        querystring: BroadcastGetReceivedSchema.querystring
    }
};

const broadcastGetSentOpts = {
    schema: {
        querystring: BroadcastGetSentSchema.querystring
    }
};

const broadcastGetByIdOpts = {
    schema: {
        params: BroadcastGetByIdSchema.params
    }
};

const broadcastGetAllOpts = {
    schema: {
        querystring: BroadcastGetAllSchema.querystring
    }
};

export async function broadcastRouter(app,options) {
    app.post("/broadcast", broadcastCreateOpts, broadcast_post)
    app.get("/broadcast/list", broadcastGetAllOpts, broadcast_get_all)
    app.get("/broadcast/received", broadcastGetReceivedOpts, broadcast_get_received)
    app.get("/broadcast/sent", broadcastGetSentOpts, broadcast_get_sent)
    app.get("/broadcast/:id", broadcastGetByIdOpts, broadcast_get_by_id)
}