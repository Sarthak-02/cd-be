import {
  createConversationController,
  listConversationsController,
  getConversationController,
  listMessagesController,
  sendMessageController,
  markConversationReadController,
} from "../../controllers/app/chat.controller.js";
import {
  CreateConversationSchema,
  GetConversationSchema,
  ListMessagesSchema,
  SendMessageSchema,
} from "../../schemas/app/chat.schema.js";

const createConversationOpts = {
  schema: { body: CreateConversationSchema.body },
};

const getConversationOpts = {
  schema: { params: GetConversationSchema.params },
};

const listMessagesOpts = {
  schema: {
    params: ListMessagesSchema.params,
    querystring: ListMessagesSchema.querystring,
  },
};

const sendMessageOpts = {
  schema: {
    params: SendMessageSchema.params,
    body: SendMessageSchema.body,
  },
};

const markReadOpts = {
  schema: { params: GetConversationSchema.params },
};

async function chatRoutes(app) {
  app.post("/chat/conversations", createConversationOpts, createConversationController);
  app.get("/chat/conversations", listConversationsController);
  app.get("/chat/conversations/:conversation_id", getConversationOpts, getConversationController);
  app.get(
    "/chat/conversations/:conversation_id/messages",
    listMessagesOpts,
    listMessagesController
  );
  app.post("/chat/conversations/:conversation_id/messages", sendMessageOpts, sendMessageController);
  app.post(
    "/chat/conversations/:conversation_id/read",
    markReadOpts,
    markConversationReadController
  );
}

export default chatRoutes;
