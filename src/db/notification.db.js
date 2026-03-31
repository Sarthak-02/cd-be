import { prisma } from "../prisma/prisma.js";

export async function createNotifications(data,tx=prisma) {
  // data = array of notifications
  return tx.notification.createMany({
    data,
    skipDuplicates: true, // safe for retries (dedupeKey unique)
  });
}

export async function markNotificationsQueued(ids,tx=prisma) {
  return tx.notification.updateMany({
    where: { id: { in: ids } },
    data: { status: "QUEUED", queuedAt: new Date() },
  });
}

export async function getPendingNotifications(limit = 100) {
  return prisma.notification.findMany({
    where: { status: { in: ["PENDING", "QUEUED"] } },
    take: limit,
    orderBy: { createdAt: "asc" },
  });
}

export async function markNotificationSent(id) {
  return prisma.notification.update({
    where: { id },
    data: { status: "SENT", sentAt: new Date(), lastError: null },
  });
}

export async function markNotificationFailed(id, error, retryCount) {
  return prisma.notification.update({
    where: { id },
    data: {
      status: retryCount >= 3 ? "FAILED" : "QUEUED",
      retryCount,
      lastError: String(error).slice(0, 1000),
    },
  });
}

export async function markNotificationAsRead(id) {
  return prisma.notification.update({
    where: { id },
    data: { read: true },
  });
}

export async function markNotificationsAsRead(ids) {
  return prisma.notification.updateMany({
    where: { id: { in: ids } },
    data: { read: true },
  });
}

export async function markAllNotificationsAsRead(receiverId) {
  return prisma.notification.updateMany({
    where: { 
      receiverId,
      read: false,
      status: "SENT"
    },
    data: { read: true },
  });
}

export async function getUnreadNotifications(recipientId, limit = 100) {
  return prisma.notification.findMany({
    where: { 
      receiverId: recipientId,
      read: false,
      status: "SENT"
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllNotifications(recipientId, options = {}) {
  const {
    limit = 100,
    offset = 0,
    status = "SENT",
    includeRead = true,
  } = options;

  const where = {
    receiverId: recipientId,
    status,
  };

  // If includeRead is false, only get unread notifications
  if (!includeRead) {
    where.read = false;
  }

  return prisma.notification.findMany({
    where,
    take: limit,
    skip: offset,
    orderBy: { createdAt: "desc" },
  });
}

