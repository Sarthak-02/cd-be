import { prisma } from "../../prisma/prisma.js";
import { createNotifications, markNotificationsQueued } from "../../db/notification.db.js";
import { publishNotifications } from "../../infra/pubsub.publisher.js";
import { makeDedupeKey } from "../../utils/crypto.js";

/**
 * Resolve all students affected by exam targets
 */
async function resolveStudentsForExam(examId, tx = prisma) {
    const exam = await tx.exam.findUnique({
        where: { id: examId },
        select: {
            target: true,
            targets: {
                select: { targetType: true, targetId: true }
            }
        }
    });

    if (!exam) {
        throw new Error("Exam not found");
    }

    const targets = exam.targets;

    // Use a Map to deduplicate students
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

    // 3️⃣ SCHOOL targets
    const schoolTargets = targets.filter(t => t.targetType === "SCHOOL");
    if (schoolTargets.length > 0) {
        const schoolIds = schoolTargets.map(t => t.targetId);
        const students = await tx.student.findMany({
            where: {
                student_current_status: "active",
                campus: {
                    school_id: { in: schoolIds }
                }
            },
            select: {
                student_id: true,
                student_first_name: true,
                student_middle_name: true,
                student_last_name: true,
                campus: {
                    select: {
                        school_id: true
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

        students.forEach(s => addStudent(s, "SCHOOL", s.campus.school_id));
    }

    return Array.from(studentMap.values());
}

/**
 * Publish exam and send notifications to all target students' parents
 */
export async function publishExamAndNotify({ examId, triggeredByTeacherId }) {
    // Step A: Build notifications + update exam status in ONE transaction
    const { createdNotifIds, studentCount } = await prisma.$transaction(async (tx) => {
        // Get exam details
        const exam = await tx.exam.findUnique({
            where: { id: examId },
            select: {
                id: true,
                examType: true,
                target: true,
                status: true,
                createdBy: true,
                gradingType: true,
                subjects: {
                    orderBy: {
                        examDate: "asc"
                    },
                    select: {
                        subjectName: true,
                        examDate: true,
                        examStartTime: true,
                        examEndTime: true
                    }
                }
            }
        });

        if (!exam) throw new Error("Exam not found");
        if (exam.status !== "DRAFT") throw new Error("Exam is not in DRAFT state");
        if (exam.createdBy !== triggeredByTeacherId) {
            throw new Error("Not allowed to publish this exam");
        }

        // Validate that exam has at least one subject
        if (!exam.subjects || exam.subjects.length === 0) {
            throw new Error("Exam must have at least one subject");
        }

        // Update exam status to PUBLISHED
        await tx.exam.update({
            where: { id: examId },
            data: { status: "PUBLISHED" }
        });

        // Resolve all affected students
        const students = await resolveStudentsForExam(examId, tx);

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
                        sessionId: examId,
                        parentId: parent.parent_id,
                        channel,
                        receiverId: student.student_id
                    });

                    notifRows.push({
                        dedupeKey,
                        parentId: parent.parent_id,
                        channel,
                        status: "PENDING",
                        sourceId: examId,
                        payload: {
                            examId: exam.id,
                            examType: exam.examType,
                            gradingType: exam.gradingType,
                            subjects: exam.subjects,
                            studentId: student.student_id,
                            studentName,
                            parentName: parent.name,
                            notificationType: "EXAM_PUBLISHED"
                        },
                        recipientType: "PARENT",
                        receiverId: parent.parent_id,
                        sourceType: "EXAM",
                        senderId: triggeredByTeacherId
                    });
                }
            }
        }

        // Create all notifications (skipDuplicates makes this safe on retry)
        if (notifRows.length > 0) {
            await createNotifications(notifRows, tx);
        }

        // Fetch IDs of created notifications for this exam in PENDING state
        const pending = await tx.notification.findMany({
            where: { sourceId: examId, status: "PENDING" },
            select: { id: true, channel: true, parentId: true, payload: true }
        });

        return { createdNotifIds: pending, studentCount: students.length };
    });

    // Step B: Publish to queue OUTSIDE transaction
    // (If publish fails, exam is already PUBLISHED but notifications remain PENDING -> recoverable)
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
        studentCount: studentCount || 0
    };
}

/**
 * Send notification when exam is updated (optional - can be called separately)
 */
export async function notifyExamUpdate({ examId, triggeredByTeacherId, updateType = "UPDATED" }) {
    const { createdNotifIds } = await prisma.$transaction(async (tx) => {
        // Get exam details
        const exam = await tx.exam.findUnique({
            where: { id: examId },
            select: {
                id: true,
                examType: true,
                target: true,
                status: true,
                createdBy: true,
                gradingType: true,
                subjects: {
                    orderBy: {
                        examDate: "asc"
                    },
                    select: {
                        subjectName: true,
                        examDate: true,
                        examStartTime: true,
                        examEndTime: true
                    }
                }
            }
        });

        if (!exam) throw new Error("Exam not found");
        if (exam.status !== "PUBLISHED" && exam.status !== "COMPLETED") {
            throw new Error("Only PUBLISHED or COMPLETED exams can send update notifications");
        }
        if (exam.createdBy !== triggeredByTeacherId) {
            throw new Error("Not allowed to send notifications for this exam");
        }

        // Resolve all affected students
        const students = await resolveStudentsForExam(examId, tx);

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
                        sessionId: `${examId}-${updateType}-${Date.now()}`,
                        parentId: parent.parent_id,
                        channel,
                        receiverId: student.student_id
                    });

                    let notificationType = "EXAM_UPDATED";
                    if (updateType === "COMPLETED") {
                        notificationType = "EXAM_COMPLETED";
                    } else if (updateType === "RESCHEDULED") {
                        notificationType = "EXAM_RESCHEDULED";
                    }

                    notifRows.push({
                        dedupeKey,
                        parentId: parent.parent_id,
                        channel,
                        status: "PENDING",
                        sourceId: examId,
                        payload: {
                            examId: exam.id,
                            examType: exam.examType,
                            gradingType: exam.gradingType,
                            subjects: exam.subjects,
                            studentId: student.student_id,
                            studentName,
                            parentName: parent.name,
                            notificationType
                        },
                        recipientType: "PARENT",
                        receiverId: parent.parent_id,
                        sourceType: "EXAM",
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
                sourceId: examId,
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

/**
 * Send reminder notification for upcoming exam
 */
export async function sendExamReminder({ examId, triggeredByTeacherId }) {
    return await notifyExamUpdate({
        examId,
        triggeredByTeacherId,
        updateType: "REMINDER"
    });
}
