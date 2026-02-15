import { finalizeAttendanceAndNotify } from "../../services/app/attendanceFinalize.service.js";
import { retryNotifyForSession } from "../../services/app/attendanceRecovery.service.js";
import { 
  getAllNotifications, 
  markNotificationAsRead, 
  markNotificationsAsRead,
  markAllNotificationsAsRead
} from "../../db/notification.db.js";
import { formatNotificationsForFrontend } from "../../utils/notificationFormatter.js";


export async function finalizeAttendanceController(req, reply) {
    try {
        const result = await finalizeAttendanceAndNotify({
            sessionId: req.params.sessionId,
            triggeredByTeacherId: req.user.teacherId,
        });
        return reply.code(200).send(result);
    } catch (err) {
        return reply.code(400).send({ error: err.message });
    }
}

export async function retryAttendanceNotificationsController(req, reply) {
    try {
        const result = await retryNotifyForSession(req.params.sessionId);
        return reply.code(200).send(result);
    } catch (err) {
        return reply.code(400).send({ error: err.message });
    }
}

// Get all notifications for a receiver
export async function getNotificationsController(req, reply) {
    try {
        const { receiverId, limit, offset, includeRead, status } = req.query;
        
        const notifications = await getAllNotifications(receiverId, {
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
            includeRead: includeRead === 'true' || includeRead === true,
            status,
        });

        // Format notifications for frontend
        const formattedNotifications = formatNotificationsForFrontend(notifications);

        return reply.code(200).send({
            success: true,
            data: formattedNotifications,
            count: formattedNotifications.length,
        });
    } catch (err) {
        return reply.code(400).send({ 
            success: false,
            error: err.message 
        });
    }
}

// Mark a single notification as read
export async function markNotificationReadController(req, reply) {
    try {
        const { notificationId } = req.params;
        
        const notification = await markNotificationAsRead(notificationId);

        return reply.code(200).send({
            success: true,
            data: notification,
        });
    } catch (err) {
        return reply.code(400).send({ 
            success: false,
            error: err.message 
        });
    }
}

// Mark multiple notifications as read
export async function markNotificationsReadController(req, reply) {
    try {
        const { notificationIds } = req.body;
        
        const result = await markNotificationsAsRead(notificationIds);

        return reply.code(200).send({
            success: true,
            data: result,
            message: `${result.count} notification(s) marked as read`,
        });
    } catch (err) {
        return reply.code(400).send({ 
            success: false,
            error: err.message 
        });
    }
}

// Mark all notifications as read for a receiver
export async function markAllNotificationsReadController(req, reply) {
    try {
        const { receiverId } = req.body;
        
        const result = await markAllNotificationsAsRead(receiverId);

        return reply.code(200).send({
            success: true,
            data: result,
            message: `All notifications marked as read (${result.count} notification(s))`,
        });
    } catch (err) {
        return reply.code(400).send({ 
            success: false,
            error: err.message 
        });
    }
}
