import { Type } from "@sinclair/typebox";

// Schema for getting all notifications for a receiver
export const GetNotificationsSchema = {
  querystring: Type.Object({
    receiverId: Type.String({
      description: "ID of the notification receiver (parent_id, student_id, etc.)",
    }),
    limit: Type.Optional(
      Type.Integer({
        minimum: 1,
        maximum: 500,
        default: 100,
        description: "Maximum number of notifications to return",
      })
    ),
    offset: Type.Optional(
      Type.Integer({
        minimum: 0,
        default: 0,
        description: "Number of notifications to skip (for pagination)",
      })
    ),
    includeRead: Type.Optional(
      Type.Boolean({
        default: true,
        description: "Whether to include read notifications",
      })
    ),
    status: Type.Optional(
      Type.String({
        enum: ["PENDING", "QUEUED", "SENT", "FAILED"],
        default: "SENT",
        description: "Filter notifications by status",
      })
    ),
  }),
};

// Schema for marking notification as read
export const MarkNotificationReadSchema = {
  params: Type.Object({
    notificationId: Type.String({
      description: "ID of the notification to mark as read",
    }),
  }),
};

// Schema for marking multiple notifications as read
export const MarkNotificationsReadSchema = {
  body: Type.Object({
    notificationIds: Type.Array(Type.String(), {
      minItems: 1,
      description: "Array of notification IDs to mark as read",
    }),
  }),
};

// Schema for marking all notifications as read
export const MarkAllNotificationsReadSchema = {
  body: Type.Object({
    receiverId: Type.String({
      description: "ID of the notification receiver to mark all notifications as read",
    }),
  }),
};
