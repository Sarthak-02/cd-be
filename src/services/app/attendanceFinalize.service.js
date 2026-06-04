import { prisma } from "../../prisma/prisma.js";
import { createNotifications, markNotificationsQueued } from "../../db/notification.db.js";
import { publishNotifications } from "../../infra/pubsub.publisher.js";
import { makeDedupeKey } from "../../utils/crypto.js";

export async function finalizeAttendanceAndNotify({ sessionId, triggeredByTeacherId }) {
    // Step A: Validate + lock session (minimal transaction — no JOINs inside)
    const session = await prisma.$transaction(async (tx) => {
        const s = await tx.attendanceSession.findUnique({
            where: { id: sessionId },
            select: { id: true, status: true, teacherId: true, date: true },
        });

        if (!s) throw new Error("Attendance session not found");
        if (s.status !== "DRAFT" && s.status !== "NOTIFYING") throw new Error("Session is not in a finalizable state");
        if (s.teacherId !== triggeredByTeacherId) throw new Error("Not allowed to finalize this session");

        if (s.status === "DRAFT") {
            await tx.attendanceSession.update({
                where: { id: sessionId },
                data: { status: "NOTIFYING" },
            });
        }

        return s;
    });

    // Step B: Fetch records + parents OUTSIDE transaction (no locks held during slow JOIN)
    const records = await prisma.attendanceRecord.findMany({
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

    // Step C: Build notification rows in memory (pure JS, no DB)
    const notifRows = [];
    for (const r of records) {
        const student = r.student;
        const studentName = [student.student_first_name, student.student_middle_name, student.student_last_name].filter(Boolean).join(" ");

        for (const parent of student.parents) {
            const enabledChannels = ["APP"];

            for (const channel of enabledChannels) {
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
                    recipientType: "PARENT",
                    receiverId: student.student_id,
                    sourceType: "ATTENDANCE",
                    senderId: triggeredByTeacherId,
                });
            }
        }
    }

    // Step D: Insert notifications + fetch their IDs in one transaction
    const createdNotifIds = await prisma.$transaction(async (tx) => {
        await createNotifications(notifRows, tx);

        return tx.notification.findMany({
            where: { sourceId: sessionId, status: "PENDING" },
            select: { id: true, channel: true, parentId: true, payload: true },
        });
    });

    // Step E: Publish to queue OUTSIDE transaction
    const publishRes = await publishNotifications(createdNotifIds);

    // Step F: Mark queued + mark session submitted
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
