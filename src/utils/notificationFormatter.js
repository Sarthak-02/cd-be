/**
 * Format notification payload into a human-readable message
 */
function formatNotificationMessage(notification) {
  const { payload, sourceType, channel } = notification;

  if (!payload) {
    return "You have a new notification";
  }

  try {
    // Handle different notification types
    switch (sourceType) {
      case "ATTENDANCE":
      case "ATTENDANCE_SESSION":
        return formatAttendanceMessage(payload);

      case "HOMEWORK":
        return formatHomeworkMessage(payload);

      case "EXAM":
        return formatExamMessage(payload);

      case "BROADCAST":
        return formatBroadcastMessage(payload);

      default:
        // Generic fallback
        return payload.message || payload.body || payload.title || "You have a new notification";
    }
  } catch (error) {
    console.error("Error formatting notification message:", error);
    return "You have a new notification";
  }
}

function formatAttendanceMessage(payload) {
  const { studentName, attendanceStatus, date } = payload;
  
  if (attendanceStatus === "ABSENT") {
    return `${studentName || "Your child"} was marked absent${date ? ` on ${new Date(date).toLocaleDateString()}` : ""}`;
  } else if (attendanceStatus === "PRESENT") {
    return `${studentName || "Your child"} was marked present${date ? ` on ${new Date(date).toLocaleDateString()}` : ""}`;
  } else if (attendanceStatus === "LATE") {
    return `${studentName || "Your child"} was marked late${date ? ` on ${new Date(date).toLocaleDateString()}` : ""}`;
  }
  
  return `Attendance update for ${studentName || "your child"}`;
}

function formatHomeworkMessage(payload) {
  const { homeworkTitle, subject, studentName, dueDate, notificationType } = payload;
  
  if (notificationType === "HOMEWORK_PUBLISHED") {
    const dueDateStr = dueDate ? ` due ${new Date(dueDate).toLocaleDateString()}` : "";
    return `New ${subject || ""} homework: ${homeworkTitle || "Homework assigned"}${dueDateStr}`;
  }
  
  if (notificationType === "HOMEWORK_REMINDER") {
    return `Reminder: ${homeworkTitle || "Homework"} is due soon`;
  }
  
  return `Homework update: ${homeworkTitle || "New homework"}`;
}

function formatExamMessage(payload) {
  const { examType, subject, examDate, studentName, notificationType } = payload;
  
  if (notificationType === "EXAM_PUBLISHED") {
    const dateStr = examDate ? ` on ${new Date(examDate).toLocaleDateString()}` : "";
    return `${examType || "Exam"} scheduled${subject ? ` for ${subject}` : ""}${dateStr}`;
  }
  
  if (notificationType === "EXAM_REMINDER") {
    return `Reminder: ${examType || "Exam"} is coming up${subject ? ` - ${subject}` : ""}`;
  }
  
  if (notificationType === "EXAM_GRADE_PUBLISHED") {
    return `Grades published for ${examType || "exam"}${subject ? ` - ${subject}` : ""}`;
  }
  
  return `Exam update: ${examType || "New exam"}`;
}

function formatBroadcastMessage(payload) {
  if (!payload) {
    return "New announcement from school";
  }
  
  const { title, message, body } = payload;
  return title || message || body || "New announcement from school";
}

/**
 * Format a single notification for frontend
 */
export function formatNotificationForFrontend(notification) {
  const payload = notification.payload;
  return {
    id: notification.id,
    receiverId: notification.receiverId,
    senderId: notification.senderId,
    sentAt: notification.sentAt,
    message: formatNotificationMessage(notification),
    read: notification.read,
    sourceType: notification.sourceType,
    sourceId: notification.sourceId,
    ...(payload && typeof payload === "object" && payload.category != null
      ? { category: payload.category }
      : {}),
  };
}

/**
 * Format multiple notifications for frontend
 */
export function formatNotificationsForFrontend(notifications) {
  return notifications.map(formatNotificationForFrontend);
}
