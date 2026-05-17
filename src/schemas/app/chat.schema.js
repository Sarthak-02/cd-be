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
      body: Type.Optional(Type.String({ maxLength: 20000 })),
      attachments: Type.Optional(
        Type.Array(
          Type.Object(
            {
              file_url: Type.String({ minLength: 1 }),
              file_name: Type.String({ minLength: 1 }),
              file_type: Type.String({ minLength: 1 }),
              file_size: Type.Integer({ minimum: 0 }),
            },
            { additionalProperties: false }
          ),
          { maxItems: 10 }
        )
      ),
    },
    { additionalProperties: false }
  ),
};

export const BroadcastMessageSchema = {
  body: Type.Object(
    {
      recipient_user_ids: Type.Array(Type.String({ minLength: 1 }), { minItems: 1, maxItems: 500 }),
      body: Type.Optional(Type.String({ maxLength: 20000 })),
      attachments: Type.Optional(
        Type.Array(
          Type.Object(
            {
              file_url: Type.String({ minLength: 1 }),
              file_name: Type.String({ minLength: 1 }),
              file_type: Type.String({ minLength: 1 }),
              file_size: Type.Integer({ minimum: 0 }),
            },
            { additionalProperties: false }
          ),
          { maxItems: 10 }
        )
      ),
    },
    { additionalProperties: false }
  ),
};

const CHAT_ALLOWED_MIME_TYPES = [
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

export const ChatAttachmentUploadUrlSchema = {
  body: Type.Object(
    {
      file_name: Type.String({ minLength: 1 }),
      mime_type: Type.Union(CHAT_ALLOWED_MIME_TYPES.map((t) => Type.Literal(t))),
      campus_id: Type.Optional(Type.String()),
    },
    { additionalProperties: false }
  ),
};
