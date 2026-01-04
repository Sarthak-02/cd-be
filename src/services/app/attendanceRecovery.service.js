import { markNotificationsQueued } from "../../db/notification.db.js";
import { publishNotifications } from "../../infra/pubsub.publisher.js";
import { prisma } from "../prisma/prisma.js";



export async function retryNotifyForSession(sessionId) {
  const pending = await prisma.notification.findMany({
    where: { attendanceSessionId: sessionId, status: "PENDING" },
    select: { id: true, channel: true },
  });

  if (!pending.length) return { ok: true, queuedCount: 0 };

  const pub = await publishNotifications(pending);

  await prisma.$transaction(async (tx) => {
    await markNotificationsQueued(pub.map((p) => p.id));
  });

  return { ok: true, queuedCount: pending.length };
}
