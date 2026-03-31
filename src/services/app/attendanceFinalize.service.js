import { prisma } from "../../prisma/prisma.js";
import { createNotifications, markNotificationsQueued } from "../../db/notification.db.js";
import { publishNotifications } from "../../infra/pubsub.publisher.js";
import { makeDedupeKey } from "../../utils/crypto.js";

export async function finalizeAttendanceAndNotify({ sessionId, triggeredByTeacherId }) {
    // Step A: Build notifications + move session to NOTIFYING in ONE transaction
    const { createdNotifIds } = await prisma.$transaction(async (tx) => {
        const session = await tx.attendanceSession.findUnique({
            where: { id: sessionId },
            select: { id: true, status: true, teacherId: true, date: true },
        });

        if (!session) throw new Error("Attendance session not found");
        if (session.status !== "DRAFT") throw new Error("Session is not in DRAFT state");
        if (session.teacherId !== triggeredByTeacherId) {
            throw new Error("Not allowed to finalize this session");
        }

        // Move to NOTIFYING (prevents further edits/bulk create in your service rules)
        await tx.attendanceSession.update({
            where: { id: sessionId },
            data: { status: "NOTIFYING" },
        });

        // Get records + parents + preferences
        const records = await tx.attendanceRecord.findMany({
            where: { attendanceSessionId: sessionId },
            select: {
              status: true,
              studentId: true,
              student: {
                select: {
                  student_id: true,
                  student_first_name: true,
                  student_middle_name: true,
                  student_last_name: true,
                  parents: {
                    select: {
                      parent_id: true,
                      name: true,
                      email: true,
                      phone: true,
                      relation_type: true,
                    },
                  },
                },
              },
            },
          });
          

        // Build notification rows (one per parent per enabled channel per student record)
        const notifRows = [];
        //case: fetch enable channels from the campus table
        for (const r of records) {
            const student = r.student;
            const studentName = [student.student_first_name,student.student_middle_name, student.student_last_name].filter(Boolean).join(" ");
            
            for (const parent of student.parents) {
                
                // const enabledChannels = parent.preferences
                //     .filter((p) => p.enabled)
                //     .map((p) => p.channel);

                const enabledChannels = ["APP"]

                for (const channel of enabledChannels) {
                    // Optional: skip channel if contact missing
                    if (channel === "EMAIL" && !parent.email) continue;
                    if ((channel === "SMS" || channel === "WHATSAPP") && !parent.phone) continue;

                    const dedupeKey = makeDedupeKey({
                        sessionId,
                        parentId: parent.parent_id,
                        channel,
                        studentId: student.student_id,
                    });

                    notifRows.push({
                        dedupeKey,
                        parentId: parent.parent_id,
                        channel,
                        status: "PENDING",
                        sourceId: sessionId,
                        payload: {
                            date: session.date,
                            studentId: student.student_id,
                            studentName,
                            attendanceStatus: r.status,
                        },
                        recipientType:"PARENT",
                        receiverId:student.student_id,//it may be changed to parent id
                        sourceType:"ATTENDANCE",
                        senderId:triggeredByTeacherId
                    });
                }
            }
        }

        // Create all notifications (skipDuplicates makes this safe on retry)
        await createNotifications(notifRows, tx);

        // Fetch IDs of created notifications for this session in PENDING state
        const pending = await tx.notification.findMany({
            where: { sourceId: sessionId, status: "PENDING" },
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
    
        await tx.attendanceSession.update({
          where: { id: sessionId },
          data: { status: "SUBMITTED", submittedAt: new Date() },
        });
      });

    return { ok: true, queuedCount: createdNotifIds.length };
}
