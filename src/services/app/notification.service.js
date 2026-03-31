import { markNotificationFailed, markNotificationSent } from "../../db/notification.db.js";
import { sendInApp } from "../channel/sender.app.js";
import { sendEmail } from "../channel/sender.email.js";
import { sendSms } from "../channel/sender.sms.js";
import { sendWhatsApp } from "../channel/sender.whatsapp.js";
import { prisma } from "../prisma/prisma.js";

export async function processNotification(notificationId) {
  const n = await prisma.notification.findUnique({
    where: { id: notificationId },
    include: { parent: true },
  });

  if (!n) return;
  if (n.status === "SENT" || n.status === "FAILED") return;

  try {
    const payload = n.payload;
    const parent = n.parent;

    if (n.channel === "EMAIL") {
      await sendEmail({ to: parent.parent_email, payload });
    } else if (n.channel === "SMS") {
      await sendSms({ to: parent.parent_phone, payload });
    } else if (n.channel === "WHATSAPP") {
      await sendWhatsApp({ to: parent.parent_phone, payload });
    } else if (n.channel === "APP") {
      await sendInApp({ parentId: parent.parent_id, payload });
    }

    await markNotificationSent(n.id);
  } catch (err) {
    const nextRetry = (n.retryCount ?? 0) + 1;
    await markNotificationFailed(n.id, err, nextRetry);
    throw err; // let Pub/Sub/Cloud Tasks retry
  }
}
