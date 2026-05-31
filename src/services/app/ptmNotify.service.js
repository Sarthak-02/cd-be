import { prisma } from "../../prisma/prisma.js"
import { createNotifications, markNotificationsQueued } from "../../db/notification.db.js"
import { publishNotifications } from "../../infra/pubsub.publisher.js"
import { makeDedupeKey } from "../../utils/crypto.js"

async function getBookingWithDetails(bookingId, tx = prisma) {
    return tx.ptmBooking.findUnique({
        where: { id: bookingId },
        select: {
            id: true,
            status: true,
            ptmSlot: {
                select: {
                    id: true,
                    title: true,
                    date: true,
                    startTime: true,
                    endTime: true,
                    teacherId: true,
                    teacher: {
                        select: {
                            teacher_id: true,
                            teacher_first_name: true,
                            teacher_last_name: true,
                            teacher_email: true,
                            teacher_phone: true
                        }
                    }
                }
            },
            studentId: true,
            parentId: true,
            student: {
                select: {
                    student_id: true,
                    student_first_name: true,
                    student_last_name: true,
                    parents: {
                        select: {
                            parent_id: true,
                            name: true,
                            email: true,
                            phone: true,
                            relation_type: true
                        }
                    }
                }
            },
            parent: {
                select: { parent_id: true, name: true, email: true, phone: true }
            }
        }
    })
}

function buildStudentName(student) {
    return [student.student_first_name, student.student_last_name].filter(Boolean).join(" ")
}

function buildTeacherName(teacher) {
    return [teacher.teacher_first_name, teacher.teacher_last_name].filter(Boolean).join(" ")
}

/**
 * Notify parent (confirmation) when a PTM slot is booked
 */
export async function notifyPtmBooked({ bookingId }) {
    const { createdNotifIds } = await prisma.$transaction(async (tx) => {
        const booking = await getBookingWithDetails(bookingId, tx)
        if (!booking) throw new Error("PTM booking not found")

        const { ptmSlot, student } = booking
        const studentName = buildStudentName(student)
        const teacherName = buildTeacherName(ptmSlot.teacher)

        const notifRows = []

        // Determine which parents to notify — prefer the booking parent, fallback to all parents
        const parentsToNotify = booking.parent
            ? [booking.parent]
            : student.parents

        for (const parent of parentsToNotify) {
            const enabledChannels = ["APP"]
            if (parent.email) enabledChannels.push("EMAIL")

            for (const channel of enabledChannels) {
                const dedupeKey = makeDedupeKey({
                    sessionId: `ptm-booked-${bookingId}`,
                    parentId: parent.parent_id,
                    channel,
                    receiverId: student.student_id
                })

                notifRows.push({
                    dedupeKey,
                    parentId: parent.parent_id,
                    channel,
                    status: "PENDING",
                    sourceId: bookingId,
                    payload: {
                        bookingId,
                        ptmSlotId: ptmSlot.id,
                        title: ptmSlot.title,
                        date: ptmSlot.date,
                        startTime: ptmSlot.startTime,
                        endTime: ptmSlot.endTime,
                        teacherName,
                        studentId: student.student_id,
                        studentName,
                        parentName: parent.name,
                        notificationType: "PTM_BOOKED"
                    },
                    recipientType: "PARENT",
                    receiverId: parent.parent_id,
                    sourceType: "PTM",
                    senderId: null
                })
            }
        }

        // Also notify the teacher via APP
        const teacherDedupeKey = makeDedupeKey({
            sessionId: `ptm-booked-teacher-${bookingId}`,
            parentId: ptmSlot.teacherId,
            channel: "APP",
            receiverId: ptmSlot.teacherId
        })
        notifRows.push({
            dedupeKey: teacherDedupeKey,
            parentId: null,
            channel: "APP",
            status: "PENDING",
            sourceId: bookingId,
            payload: {
                bookingId,
                ptmSlotId: ptmSlot.id,
                title: ptmSlot.title,
                date: ptmSlot.date,
                startTime: ptmSlot.startTime,
                endTime: ptmSlot.endTime,
                studentId: student.student_id,
                studentName,
                parentName: booking.parent?.name ?? (student.parents[0]?.name ?? null),
                notificationType: "PTM_BOOKED_TEACHER"
            },
            recipientType: "TEACHER",
            receiverId: ptmSlot.teacherId,
            sourceType: "PTM",
            senderId: null
        })

        if (notifRows.length > 0) await createNotifications(notifRows, tx)

        const pending = await tx.notification.findMany({
            where: { sourceId: bookingId, status: "PENDING" },
            select: { id: true, channel: true, parentId: true, payload: true }
        })

        return { createdNotifIds: pending }
    })

    if (createdNotifIds.length > 0) {
        const published = await publishNotifications(createdNotifIds)
        await prisma.$transaction(async (tx) => {
            await markNotificationsQueued(published.map((x) => x.id), tx)
        })
    }

    return { ok: true, queuedCount: createdNotifIds.length }
}

/**
 * Notify both parties when a booking is cancelled
 */
export async function notifyPtmCancelled({ bookingId, cancelledByRole }) {
    const { createdNotifIds } = await prisma.$transaction(async (tx) => {
        const booking = await getBookingWithDetails(bookingId, tx)
        if (!booking) throw new Error("PTM booking not found")

        const { ptmSlot, student } = booking
        const studentName = buildStudentName(student)
        const teacherName = buildTeacherName(ptmSlot.teacher)
        const notifRows = []
        const ts = Date.now()

        const parentsToNotify = booking.parent ? [booking.parent] : student.parents

        for (const parent of parentsToNotify) {
            const dedupeKey = makeDedupeKey({
                sessionId: `ptm-cancelled-${bookingId}-${ts}`,
                parentId: parent.parent_id,
                channel: "APP",
                receiverId: student.student_id
            })
            notifRows.push({
                dedupeKey,
                parentId: parent.parent_id,
                channel: "APP",
                status: "PENDING",
                sourceId: bookingId,
                payload: {
                    bookingId,
                    title: ptmSlot.title,
                    date: ptmSlot.date,
                    startTime: ptmSlot.startTime,
                    teacherName,
                    studentName,
                    cancelledByRole,
                    notificationType: "PTM_CANCELLED"
                },
                recipientType: "PARENT",
                receiverId: parent.parent_id,
                sourceType: "PTM",
                senderId: null
            })
        }

        if (cancelledByRole !== "TEACHER") {
            const dedupeKey = makeDedupeKey({
                sessionId: `ptm-cancelled-teacher-${bookingId}-${ts}`,
                parentId: ptmSlot.teacherId,
                channel: "APP",
                receiverId: ptmSlot.teacherId
            })
            notifRows.push({
                dedupeKey,
                parentId: null,
                channel: "APP",
                status: "PENDING",
                sourceId: bookingId,
                payload: {
                    bookingId,
                    title: ptmSlot.title,
                    date: ptmSlot.date,
                    startTime: ptmSlot.startTime,
                    studentName,
                    cancelledByRole,
                    notificationType: "PTM_CANCELLED_TEACHER"
                },
                recipientType: "TEACHER",
                receiverId: ptmSlot.teacherId,
                sourceType: "PTM",
                senderId: null
            })
        }

        if (notifRows.length > 0) await createNotifications(notifRows, tx)

        const pending = await tx.notification.findMany({
            where: { sourceId: bookingId, status: "PENDING", createdAt: { gte: new Date(Date.now() - 5000) } },
            select: { id: true, channel: true, parentId: true, payload: true }
        })

        return { createdNotifIds: pending }
    })

    if (createdNotifIds.length > 0) {
        const published = await publishNotifications(createdNotifIds)
        await prisma.$transaction(async (tx) => {
            await markNotificationsQueued(published.map((x) => x.id), tx)
        })
    }

    return { ok: true, queuedCount: createdNotifIds.length }
}

/**
 * Send a reminder to the parent before the meeting
 */
export async function notifyPtmReminder({ bookingId }) {
    const { createdNotifIds } = await prisma.$transaction(async (tx) => {
        const booking = await getBookingWithDetails(bookingId, tx)
        if (!booking) throw new Error("PTM booking not found")
        if (booking.status !== "SCHEDULED") throw new Error("Only SCHEDULED bookings can receive reminders")

        const { ptmSlot, student } = booking
        const studentName = buildStudentName(student)
        const teacherName = buildTeacherName(ptmSlot.teacher)
        const ts = Date.now()
        const notifRows = []

        const parentsToNotify = booking.parent ? [booking.parent] : student.parents

        for (const parent of parentsToNotify) {
            const dedupeKey = makeDedupeKey({
                sessionId: `ptm-reminder-${bookingId}-${ts}`,
                parentId: parent.parent_id,
                channel: "APP",
                receiverId: student.student_id
            })
            notifRows.push({
                dedupeKey,
                parentId: parent.parent_id,
                channel: "APP",
                status: "PENDING",
                sourceId: bookingId,
                payload: {
                    bookingId,
                    title: ptmSlot.title,
                    date: ptmSlot.date,
                    startTime: ptmSlot.startTime,
                    endTime: ptmSlot.endTime,
                    teacherName,
                    studentName,
                    parentName: parent.name,
                    notificationType: "PTM_REMINDER"
                },
                recipientType: "PARENT",
                receiverId: parent.parent_id,
                sourceType: "PTM",
                senderId: null
            })
        }

        if (notifRows.length > 0) await createNotifications(notifRows, tx)

        const pending = await tx.notification.findMany({
            where: { sourceId: bookingId, status: "PENDING", createdAt: { gte: new Date(Date.now() - 5000) } },
            select: { id: true, channel: true, parentId: true, payload: true }
        })

        return { createdNotifIds: pending }
    })

    if (createdNotifIds.length > 0) {
        const published = await publishNotifications(createdNotifIds)
        await prisma.$transaction(async (tx) => {
            await markNotificationsQueued(published.map((x) => x.id), tx)
        })
    }

    return { ok: true, queuedCount: createdNotifIds.length }
}
