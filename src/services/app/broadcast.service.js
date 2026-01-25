import { createNotifications, markNotificationsQueued } from "../../db/notification.db.js";
import { publishNotifications } from "../../infra/pubsub.publisher.js";
import { prisma } from "../../prisma/prisma.js";
import { chunkArray } from "../../utils/chunk.js";
import { makeDedupeKey } from "../../utils/crypto.js";
import { resolveRecipientsForBroadcast } from "./recipient.service.js";

function getRecipientType(targetType) {
  switch (targetType) {
    case "TEACHER":
      return "TEACHER"
    case "CAMPUS":
      return "ALL"
    default:
      return "STUDENT"
  }
}

export async function createBroadcastDraft({
  title,
  message,
  attachmentUrls = [],
  createdBy,
  campusId,
  targets,
}) {
  if (!title) throw new Error("TITLE_REQUIRED");

  if (!message && attachmentUrls.length === 0) {
    throw new Error("CONTENT_REQUIRED");
  }

  if (!targets?.length) throw new Error("TARGET_REQUIRED");

  // Optional but recommended limits
  if (attachmentUrls.length > 3) {
    throw new Error("MAX_3_ATTACHMENTS_ALLOWED");
  }

  return prisma.$transaction(async (tx) => {
    // 1️⃣ Create broadcast intent
    const broadcast = await tx.broadcastNotification.create({
      data: {
        title,
        message,
        createdBy,
        campusId,
        status: "DRAFT",
      },
    });

    // 2️⃣ Create targets
    await tx.broadcastTarget.createMany({
      data: targets.map((t) => ({
        broadcastNotificationId: broadcast.id,
        targetType: t.targetType,
        targetId: t.targetId,
      })),
      skipDuplicates: true,
    });

    // 3️⃣ Create attachments (if any)
    if (attachmentUrls.length > 0) {
      await tx.broadcastAttachment.createMany({
        data: attachmentUrls.map((a) => ({
          broadcastNotificationId: broadcast.id,
          fileUrl: a.fileUrl,
          fileName: a.fileName ?? null,
          fileType: a.fileType ?? null,
          fileSize: a.fileSize ?? null,
        })),
      });
    }

    return broadcast;
  });
}

export async function previewRecipients(broadcastId, campusId) {
  const ids = await resolveRecipientsForBroadcast(broadcastId, campusId);
  return { count: ids.length };
}

export async function sendBroadcast(broadcastId, campusId) {


  const { createdNotifIds } = await prisma.$transaction(async (tx) => {

    const broadcast = await prisma.broadcastNotification.findUnique({
      where: {
        id: broadcastId,
      },
      include: {
        broadcastAttachments: true,
        broadcastTargets: true,
      },
    });

    if (!broadcast) throw new Error("NOT_FOUND");
    if (broadcast.status !== "DRAFT") throw new Error("Session is not in DRAFT state");

    const receivers = await resolveRecipientsForBroadcast(broadcastId, campusId);
    const chunks = chunkArray(receivers, 1000);

    const notifRows = [];


    for (const receiver of receivers) {
      const { receiverId, targetType, targetId } = receiver
      const dedupeKey = makeDedupeKey({
        sessionId: broadcast.id,
        receiverId
      });


      notifRows.push({
        dedupeKey,
        recipientType: getRecipientType(targetType), // It can be teacher , student and all
        receiverId: receiverId,
        senderId: broadcast.createdBy,
        channel: "APP",
        status: "PENDING",
        sourceType: "BROADCAST",
        sourceId: broadcast.id,
        payload: null
      });
    }

    await tx.broadcastNotification.update({
      where: { id: broadcast.id },
      data: { status: "NOTIFYING" },
    });

    await createNotifications(notifRows, tx);

    const pending = await tx.notification.findMany({
      where: { sourceId: broadcast.id, status: "PENDING" },
      select: { id: true, channel: true},
    });

    return { createdNotifIds: pending };
  });

  // Step B: Publish to queue OUTSIDE transaction
  // (If publish fails, session remains NOTIFYING -> recoverable)
  const publishRes = await publishNotifications(createdNotifIds);

  // Step C: Mark queued + mark session submitted
  await prisma.$transaction(async (tx) => {
    const ids = publishRes.map((x) => x.id);
    await markNotificationsQueued(ids, tx);

    await tx.broadcastNotification.update({
      where: { id: broadcastId },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
  });

  return { ok: true, queuedCount: createdNotifIds.length };

}

export async function listBroadcasts(campusId, createdBy) {
  return prisma.broadcastNotification.findMany({
    where: {
      campusId,
      ...(createdBy ? { createdBy } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

// Fetch broadcasts received by a user (via Notification table)
export async function getBroadcastsByReceiverId(receiverId, campusId) {
  // Find all notifications for this receiver where sourceType = "BROADCAST"
  const notifications = await prisma.notification.findMany({
    where: {
      receiverId,
      sourceType: "BROADCAST",
    },
    select: {
      sourceId: true,
    },
    distinct: ["sourceId"],
  });

  const broadcastIds = notifications.map((n) => n.sourceId);

  if (broadcastIds.length === 0) {
    return [];
  }

  // Fetch the actual broadcast notifications with attachments
  const broadcasts = await prisma.broadcastNotification.findMany({
    where: {
      id: { in: broadcastIds },
      ...(campusId ? { campusId } : {}),
    },
    include: {
      broadcastAttachments: {
        select: {
          id: true,
          fileUrl: true,
          fileName: true,
          fileType: true,
          fileSize: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get unique sender IDs
  const senderIds = [...new Set(broadcasts.map((b) => b.createdBy))];

  // Fetch sender details from multiple possible sources
  const [users, teachers] = await Promise.all([
    prisma.user.findMany({
      where: { userid: { in: senderIds } },
      select: { userid: true, username: true },
    }),
    prisma.teacher.findMany({
      where: { teacher_id: { in: senderIds } },
      select: {
        teacher_id: true,
        teacher_first_name: true,
        teacher_middle_name: true,
        teacher_last_name: true,
      },
    }),
  ]);

  // Create a lookup map for sender names
  const senderMap = new Map();
  
  users.forEach((user) => {
    senderMap.set(user.userid, user.username);
  });
  
  teachers.forEach((teacher) => {
    const fullName = [
      teacher.teacher_first_name,
      teacher.teacher_middle_name,
      teacher.teacher_last_name,
    ]
      .filter(Boolean)
      .join(" ");
    senderMap.set(teacher.teacher_id, fullName);
  });

  // Enrich broadcasts with sender info and attachment details
  return broadcasts.map((broadcast) => ({
    id: broadcast.id,
    title: broadcast.title,
    message: broadcast.message,
    createdBy: broadcast.createdBy,
    senderName: senderMap.get(broadcast.createdBy) || "Unknown",
    campusId: broadcast.campusId,
    status: broadcast.status,
    hasAttachments: broadcast.broadcastAttachments.length > 0,
    attachmentCount: broadcast.broadcastAttachments.length,
    attachments: broadcast.broadcastAttachments,
    createdAt: broadcast.createdAt,
    submittedAt: broadcast.submittedAt,
  }));
}

// Fetch broadcasts created by a user (with status)
export async function getBroadcastsByCreatedBy(createdBy, campusId) {
  return prisma.broadcastNotification.findMany({
    where: {
      createdBy,
      ...(campusId ? { campusId } : {}),
    },
    select: {
      id: true,
      title: true,
      message: true,
      createdBy: true,
      campusId: true,
      status: true,
      createdAt: true,
      submittedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

// Fetch broadcast details by ID
export async function getBroadcastById(broadcastId) {
  const broadcast = await prisma.broadcastNotification.findUnique({
    where: {
      id: broadcastId,
    },
    include: {
      broadcastAttachments: true,
      broadcastTargets: true,
    },
  });

  if (!broadcast) {
    throw new Error("BROADCAST_NOT_FOUND");
  }

  return broadcast;
}

// Fetch all broadcasts with optional filters
export async function getAllBroadcasts({ campusId, status, createdBy, limit = 100, offset = 0 }) {
  const where = {};
  
  if (campusId) where.campusId = campusId;
  if (status) where.status = status;
  if (createdBy) where.createdBy = createdBy;

  const [broadcasts, total] = await Promise.all([
    prisma.broadcastNotification.findMany({
      where,
      include: {
        broadcastAttachments: {
          select: {
            id: true,
            fileUrl: true,
            fileName: true,
            fileType: true,
            fileSize: true,
          },
        },
        broadcastTargets: {
          select: {
            id: true,
            targetType: true,
            targetId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.broadcastNotification.count({ where }),
  ]);

  // Add sourceType to each broadcast for consistency
  const enrichedBroadcasts = broadcasts.map(broadcast => ({
    ...broadcast,
    sourceType: "BROADCAST",
    hasAttachments: broadcast.broadcastAttachments.length > 0,
    attachmentCount: broadcast.broadcastAttachments.length,
  }));

  return {
    broadcasts: enrichedBroadcasts,
    total,
    limit,
    offset,
  };
}

// Update broadcast (only allowed for DRAFT status)
export async function updateBroadcast(broadcastId, updateData) {
  const { title, message, attachmentUrls, targets } = updateData;

  return prisma.$transaction(async (tx) => {
    // 1️⃣ Check if broadcast exists and is in DRAFT status
    const existingBroadcast = await tx.broadcastNotification.findUnique({
      where: { id: broadcastId },
    });

    if (!existingBroadcast) {
      throw new Error("BROADCAST_NOT_FOUND");
    }

    if (existingBroadcast.status !== "DRAFT") {
      throw new Error("BROADCAST_ALREADY_SENT");
    }

    // 2️⃣ Prepare update data
    const updatePayload = {};
    if (title !== undefined) updatePayload.title = title;
    if (message !== undefined) updatePayload.message = message;

    // 3️⃣ Update broadcast if there are fields to update
    let updatedBroadcast = existingBroadcast;
    if (Object.keys(updatePayload).length > 0) {
      updatedBroadcast = await tx.broadcastNotification.update({
        where: { id: broadcastId },
        data: updatePayload,
      });
    }

    // 4️⃣ Update targets if provided
    if (targets !== undefined && Array.isArray(targets)) {
      // Delete existing targets
      await tx.broadcastTarget.deleteMany({
        where: { broadcastNotificationId: broadcastId },
      });

      // Create new targets
      if (targets.length > 0) {
        await tx.broadcastTarget.createMany({
          data: targets.map((t) => ({
            broadcastNotificationId: broadcastId,
            targetType: t.targetType,
            targetId: t.targetId,
          })),
          skipDuplicates: true,
        });
      }
    }

    // 5️⃣ Update attachments if provided
    if (attachmentUrls !== undefined && Array.isArray(attachmentUrls)) {
      // Validate max attachments
      if (attachmentUrls.length > 3) {
        throw new Error("MAX_3_ATTACHMENTS_ALLOWED");
      }

      // Delete existing attachments
      await tx.broadcastAttachment.deleteMany({
        where: { broadcastNotificationId: broadcastId },
      });

      // Create new attachments
      if (attachmentUrls.length > 0) {
        await tx.broadcastAttachment.createMany({
          data: attachmentUrls.map((a) => ({
            broadcastNotificationId: broadcastId,
            fileUrl: a.fileUrl,
            fileName: a.fileName ?? null,
            fileType: a.fileType ?? null,
            fileSize: a.fileSize ?? null,
          })),
        });
      }
    }

    // 6️⃣ Return updated broadcast with all relations
    return tx.broadcastNotification.findUnique({
      where: { id: broadcastId },
      include: {
        broadcastAttachments: true,
        broadcastTargets: true,
      },
    });
  });
}


