import { sendInApp } from "../services/channel/sender.app.js"
import { sendEmail } from "../services/channel/sender.email.js";
import { sendSms } from "../services/channel/sender.sms.js";
import { sendWhatsApp } from "../services/channel/sender.whatsapp.js";
import { prisma } from "../PrismaClient.js"

export async function processNotification(notificationId) {
    const n = await prisma.notification.findUnique({
        where: { id: notificationId },
    });

    if (!n) return;
    if (n.status === "SENT" || n.status === "FAILED") return;

    try {
        const payload = n.payload;
        const parent = n.parent;
        const receiverId = n.receiverId

        if (n.channel === "EMAIL") {
            await sendEmail({ to: "receiver_email", payload });
        } else if (n.channel === "SMS") {
            await sendSms({ to: "receiver_phone", payload });
        } else if (n.channel === "WHATSAPP") {
            await sendWhatsApp({ to: "receiver_phone", payload });
        } else if (n.channel === "APP") {
            await sendInApp({ receiverId, payload });
        }

        await prisma.notification.update({
            where: { id: notificationId },
            data: {
                status: "SENT",
                sentAt: new Date(),
            },
        });
    } catch (err) {
        await prisma.notification.update({
            where: { id: notificationId },
            data: {
                status: "FAILED",
                retryCount: { increment: 1 },
                lastError: err.message,
            },
        });
        throw err; // let Pub/Sub/Cloud Tasks retry
    }
}
