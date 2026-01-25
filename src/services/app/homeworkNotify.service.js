import { prisma } from "../../prisma/prisma.js";
import { createNotifications, markNotificationsQueued } from "../../db/notification.db.js";
import { publishNotifications } from "../../infra/pubsub.publisher.js";
import { makeDedupeKey } from "../../utils/crypto.js";

/**
 * Resolve all students affected by homework targets
 */
async function resolveStudentsForHomework(homeworkId, tx = prisma) {
    const targets = await tx.homeworkTarget.findMany({
        where: { homeworkId },
        select: { targetType: true, targetId: true }
    });

    // Use a Map to deduplicate students (same student may be in multiple targets)
    const studentMap = new Map();

    const addStudent = (student, targetType, targetId) => {
        if (!studentMap.has(student.student_id)) {
            studentMap.set(student.student_id, {
                ...student,
                targetType,
                targetId
            });
        }
    };

    // 1️⃣ STUDENT targets - direct student IDs
    const studentTargets = targets.filter(t => t.targetType === "STUDENT");
    if (studentTargets.length > 0) {
        const studentIds = studentTargets.map(t => t.targetId);
        const students = await tx.student.findMany({
            where: { 
                student_id: { in: studentIds },
                student_current_status: "active"
            },
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
                    }
                }
            }
        });

        students.forEach(s => addStudent(s, "STUDENT", s.student_id));
    }

    // 2️⃣ SECTION targets
    const sectionTargets = targets.filter(t => t.targetType === "SECTION");
    if (sectionTargets.length > 0) {
        const sectionIds = sectionTargets.map(t => t.targetId);
        const students = await tx.student.findMany({
            where: {
                student_section_id: { in: sectionIds },
                student_current_status: "active"
            },
            select: {
                student_id: true,
                student_first_name: true,
                student_middle_name: true,
                student_last_name: true,
                student_section_id: true,
                parents: {
                    select: {
                        parent_id: true,
                        name: true,
                        email: true,
                        phone: true,
                        relation_type: true,
                    }
                }
            }
        });

        students.forEach(s => addStudent(s, "SECTION", s.student_section_id));
    }

    // 3️⃣ CLASS targets
    const classTargets = targets.filter(t => t.targetType === "CLASS");
    if (classTargets.length > 0) {
        const classIds = classTargets.map(t => t.targetId);
        const students = await tx.student.findMany({
            where: {
                student_current_status: "active",
                section: {
                    class_id: { in: classIds }
                }
            },
            select: {
                student_id: true,
                student_first_name: true,
                student_middle_name: true,
                student_last_name: true,
                section: {
                    select: {
                        class_id: true
                    }
                },
                parents: {
                    select: {
                        parent_id: true,
                        name: true,
                        email: true,
                        phone: true,
                        relation_type: true,
                    }
                }
            }
        });

        students.forEach(s => addStudent(s, "CLASS", s.section.class_id));
    }

    return Array.from(studentMap.values());
}

/**
 * Finalize homework and send notifications to all target students' parents
 */
export async function publishHomeworkAndNotify({ homeworkId, triggeredByTeacherId }) {
    // Step A: Build notifications + update homework status in ONE transaction
    const { createdNotifIds } = await prisma.$transaction(async (tx) => {
        // Get homework details
        const homework = await tx.homework.findUnique({
            where: { id: homeworkId },
            select: {
                id: true,
                title: true,
                description: true,
                dueDate: true,
                subject: true,
                status: true,
                createdBy: true,
            }
        });

        if (!homework) throw new Error("Homework not found");
        if (homework.status !== "DRAFT") throw new Error("Homework is not in DRAFT state");
        if (homework.createdBy !== triggeredByTeacherId) {
            throw new Error("Not allowed to publish this homework");
        }

        // Update homework status to PUBLISHED
        await tx.homework.update({
            where: { id: homeworkId },
            data: { status: "PUBLISHED" }
        });

        // Resolve all affected students
        const students = await resolveStudentsForHomework(homeworkId, tx);

        // Build notification rows (one per parent per enabled channel per student)
        const notifRows = [];

        for (const student of students) {
            const studentName = [
                student.student_first_name,
                student.student_middle_name,
                student.student_last_name
            ].filter(Boolean).join(" ");

            for (const parent of student.parents) {
                // For now, using APP channel only
                // In future, fetch enabled channels from preferences
                const enabledChannels = ["APP"];

                for (const channel of enabledChannels) {
                    // Skip channel if contact info missing
                    if (channel === "EMAIL" && !parent.email) continue;
                    if ((channel === "SMS" || channel === "WHATSAPP") && !parent.phone) continue;

                    const dedupeKey = makeDedupeKey({
                        sessionId: homeworkId,
                        parentId: parent.parent_id,
                        channel,
                        receiverId: student.student_id
                    });

                    notifRows.push({
                        dedupeKey,
                        parentId: parent.parent_id,
                        channel,
                        status: "PENDING",
                        sourceId: homeworkId,
                        payload: {
                            homeworkId: homework.id,
                            homeworkTitle: homework.title,
                            homeworkDescription: homework.description,
                            subject: homework.subject,
                            dueDate: homework.dueDate,
                            studentId: student.student_id,
                            studentName,
                            parentName: parent.name,
                            notificationType: "HOMEWORK_PUBLISHED"
                        },
                        recipientType: "PARENT",
                        receiverId: parent.parent_id,
                        sourceType: "HOMEWORK",
                        senderId: triggeredByTeacherId
                    });
                }
            }
        }

        // Create all notifications (skipDuplicates makes this safe on retry)
        if (notifRows.length > 0) {
            await createNotifications(notifRows, tx);
        }

        // Fetch IDs of created notifications for this homework in PENDING state
        const pending = await tx.notification.findMany({
            where: { sourceId: homeworkId, status: "PENDING" },
            select: { id: true, channel: true, parentId: true, payload: true }
        });

        return { createdNotifIds: pending, studentCount: students.length };
    });

    // Step B: Publish to queue OUTSIDE transaction
    // (If publish fails, homework is already PUBLISHED but notifications remain PENDING -> recoverable)
    let publishRes = [];
    if (createdNotifIds.length > 0) {
        publishRes = await publishNotifications(createdNotifIds);

        // Step C: Mark notifications as queued
        await prisma.$transaction(async (tx) => {
            const ids = publishRes.map((x) => x.id);
            await markNotificationsQueued(ids, tx);
        });
    }

    return {
        ok: true,
        queuedCount: createdNotifIds.length,
        studentCount: createdNotifIds.studentCount || 0
    };
}

/**
 * Send notification when homework is updated (optional - can be called separately)
 */
export async function notifyHomeworkUpdate({ homeworkId, triggeredByTeacherId, updateType = "UPDATED" }) {
    const { createdNotifIds } = await prisma.$transaction(async (tx) => {
        // Get homework details
        const homework = await tx.homework.findUnique({
            where: { id: homeworkId },
            select: {
                id: true,
                title: true,
                description: true,
                dueDate: true,
                subject: true,
                status: true,
                createdBy: true,
            }
        });

        if (!homework) throw new Error("Homework not found");
        if (homework.status !== "PUBLISHED") throw new Error("Only PUBLISHED homework can send update notifications");
        if (homework.createdBy !== triggeredByTeacherId) {
            throw new Error("Not allowed to send notifications for this homework");
        }

        // Resolve all affected students
        const students = await resolveStudentsForHomework(homeworkId, tx);

        // Build notification rows
        const notifRows = [];

        for (const student of students) {
            const studentName = [
                student.student_first_name,
                student.student_middle_name,
                student.student_last_name
            ].filter(Boolean).join(" ");

            for (const parent of student.parents) {
                const enabledChannels = ["APP"];

                for (const channel of enabledChannels) {
                    if (channel === "EMAIL" && !parent.email) continue;
                    if ((channel === "SMS" || channel === "WHATSAPP") && !parent.phone) continue;

                    // Use timestamp in dedupe key to allow multiple update notifications
                    const dedupeKey = makeDedupeKey({
                        sessionId: `${homeworkId}-${updateType}-${Date.now()}`,
                        parentId: parent.parent_id,
                        channel,
                        receiverId: student.student_id
                    });

                    notifRows.push({
                        dedupeKey,
                        parentId: parent.parent_id,
                        channel,
                        status: "PENDING",
                        sourceId: homeworkId,
                        payload: {
                            homeworkId: homework.id,
                            homeworkTitle: homework.title,
                            homeworkDescription: homework.description,
                            subject: homework.subject,
                            dueDate: homework.dueDate,
                            studentId: student.student_id,
                            studentName,
                            parentName: parent.name,
                            notificationType: updateType === "CLOSED" ? "HOMEWORK_CLOSED" : "HOMEWORK_UPDATED"
                        },
                        recipientType: "PARENT",
                        receiverId: parent.parent_id,
                        sourceType: "HOMEWORK",
                        senderId: triggeredByTeacherId
                    });
                }
            }
        }

        // Create all notifications
        if (notifRows.length > 0) {
            await createNotifications(notifRows, tx);
        }

        // Fetch IDs of created notifications
        const pending = await tx.notification.findMany({
            where: {
                sourceId: homeworkId,
                status: "PENDING",
                createdAt: { gte: new Date(Date.now() - 5000) } // last 5 seconds
            },
            select: { id: true, channel: true, parentId: true, payload: true }
        });

        return { createdNotifIds: pending };
    });

    // Publish to queue
    let publishRes = [];
    if (createdNotifIds.length > 0) {
        publishRes = await publishNotifications(createdNotifIds);

        // Mark as queued
        await prisma.$transaction(async (tx) => {
            const ids = publishRes.map((x) => x.id);
            await markNotificationsQueued(ids, tx);
        });
    }

    return {
        ok: true,
        queuedCount: createdNotifIds.length
    };
}
