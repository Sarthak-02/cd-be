import { 
  getNotificationsController, 
  markNotificationReadController, 
  markNotificationsReadController,
  markAllNotificationsReadController
} from '../../controllers/app/notification.controller.js';
import { 
  GetNotificationsSchema, 
  MarkNotificationReadSchema, 
  MarkNotificationsReadSchema,
  MarkAllNotificationsReadSchema
} from '../../schemas/app/notification.schema.js';

const getNotificationsOpts = {
  schema: {
    querystring: GetNotificationsSchema.querystring,
  }
};

const markNotificationReadOpts = {
  schema: {
    params: MarkNotificationReadSchema.params,
  }
};

const markNotificationsReadOpts = {
  schema: {
    body: MarkNotificationsReadSchema.body,
  }
};

const markAllNotificationsReadOpts = {
  schema: {
    body: MarkAllNotificationsReadSchema.body,
  }
};

async function notificationRoutes(app, options) {
  // Get all notifications for a receiver
  app.get("/notifications", getNotificationsOpts, getNotificationsController);
  
  // Mark a single notification as read
  app.patch("/notifications/:notificationId/read", markNotificationReadOpts, markNotificationReadController);
  
  // Mark multiple notifications as read
  app.post("/notifications/mark-read", markNotificationsReadOpts, markNotificationsReadController);
  
  // Mark all notifications as read for a receiver
  app.post("/notifications/mark-all-read", markAllNotificationsReadOpts, markAllNotificationsReadController);
}

export default notificationRoutes;
