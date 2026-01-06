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
          fileName: a.fileName || null,
          fileType: a.fileType || null,
          fileSize: a.fileSize || null,
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
        id: broadcastNotificationId,
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
      where: { attendanceSessionId: sessionId, status: "PENDING" },
      select: { id: true, channel: true, parentId: true, payload: true },
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
      where: { id: sessionId },
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


