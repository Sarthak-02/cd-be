import { Type } from "@sinclair/typebox";

export const CreateConversationSchema = {
  body: Type.Union(
    [
      Type.Object(
        {
          type: Type.Literal("DIRECT"),
          other_user_id: Type.String({ minLength: 1 }),
        },
        { additionalProperties: false }
      ),
      Type.Object(
        {
          type: Type.Literal("GROUP"),
          title: Type.String({ minLength: 1 }),
          campus_id: Type.Optional(Type.String()),
          participant_user_ids: Type.Array(Type.String({ minLength: 1 }), {
            minItems: 1,
          }),
        },
        { additionalProperties: false }
      ),
    ],
    { description: "DIRECT: other_user_id. GROUP: title + participant_user_ids (others besides you)." }
  ),
};

export const GetConversationSchema = {
  params: Type.Object({
    conversation_id: Type.String(),
  }),
};

export const ListMessagesSchema = {
  params: Type.Object({
    conversation_id: Type.String(),
  }),
  querystring: Type.Object({
    after: Type.Optional(
      Type.String({
        description: "ISO 8601 datetime — messages with createdAt > after (polling)",
      })
    ),
    before: Type.Optional(
      Type.String({
        description: "ISO 8601 datetime — older page of messages",
      })
    ),
    limit: Type.Optional(
      Type.Integer({ minimum: 1, maximum: 200, default: 50 })
    ),
  }),
};

export const SendMessageSchema = {
  params: Type.Object({
    conversation_id: Type.String(),
  }),
  body: Type.Object(
    {
      body: Type.String({ minLength: 1, maxLength: 20000 }),
    },
    { additionalProperties: false }
  ),
};
