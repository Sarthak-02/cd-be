import { prisma } from "../prisma/prisma.js"

const BOOKING_INCLUDE = {
    student: { select: { student_id: true, student_first_name: true, student_last_name: true, student_photo_url: true } },
    parent: { select: { parent_id: true, name: true, relation_type: true } }
}

// ─── Slot CRUD ────────────────────────────────────────────────────────────────

export async function createPtmSlot({ teacherId, campusId, title, description, date, startTime, endTime, createdBy, capacity = 1, studentId, parentId }) {
    // Teacher-scheduled flow: create slot + first booking atomically
    if (studentId) {
        return prisma.$transaction(async (tx) => {
            const slot = await tx.ptmSlot.create({
                data: {
                    teacherId,
                    campusId,
                    title,
                    description: description ?? null,
                    date: new Date(date),
                    startTime,
                    endTime,
                    createdBy,
                    capacity,
                    status: capacity === 1 ? "BOOKED" : "AVAILABLE"
                }
            })

            await tx.ptmBooking.create({
                data: { ptmSlotId: slot.id, studentId, parentId: parentId ?? null, status: "SCHEDULED" }
            })

            return tx.ptmSlot.findUnique({
                where: { id: slot.id },
                include: {
                    teacher: { select: { teacher_id: true, teacher_first_name: true, teacher_last_name: true } },
                    bookings: { include: BOOKING_INCLUDE },
                    _count: { select: { bookings: true } }
                }
            })
        })
    }

    return prisma.ptmSlot.create({
        data: {
            teacherId,
            campusId,
            title,
            description: description ?? null,
            date: new Date(date),
            startTime,
            endTime,
            createdBy,
            capacity
        },
        include: {
            teacher: { select: { teacher_id: true, teacher_first_name: true, teacher_last_name: true } },
            _count: { select: { bookings: true } }
        }
    })
}

export async function getPtmSlotById(slotId) {
    return prisma.ptmSlot.findUnique({
        where: { id: slotId },
        include: {
            teacher: { select: { teacher_id: true, teacher_first_name: true, teacher_last_name: true, teacher_photo_url: true } },
            bookings: {
                where: { status: { not: "CANCELLED" } },
                include: {
                    student: { select: { student_id: true, student_first_name: true, student_last_name: true, student_photo_url: true } },
                    parent: { select: { parent_id: true, name: true, phone: true, email: true, relation_type: true } }
                }
            },
            _count: { select: { bookings: { where: { status: { not: "CANCELLED" } } } } }
        }
    })
}

export async function getPtmSlotsByTeacher({ teacherId, status, startDate, endDate, limit = 50, offset = 0 }) {
    const where = { teacherId }
    if (status) where.status = status
    if (startDate || endDate) {
        where.date = {}
        if (startDate) where.date.gte = new Date(startDate)
        if (endDate) where.date.lte = new Date(endDate)
    }

    return prisma.ptmSlot.findMany({
        where,
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        skip: offset,
        take: limit,
        include: {
            bookings: {
                where: { status: { not: "CANCELLED" } },
                include: BOOKING_INCLUDE
            },
            _count: { select: { bookings: { where: { status: { not: "CANCELLED" } } } } }
        }
    })
}

export async function getPtmSlotsByCampus({ campusId, status, startDate, endDate, teacherId, limit = 50, offset = 0 }) {
    const where = { campusId }
    if (status) where.status = status
    if (teacherId) where.teacherId = teacherId
    if (startDate || endDate) {
        where.date = {}
        if (startDate) where.date.gte = new Date(startDate)
        if (endDate) where.date.lte = new Date(endDate)
    }

    return prisma.ptmSlot.findMany({
        where,
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        skip: offset,
        take: limit,
        include: {
            teacher: { select: { teacher_id: true, teacher_first_name: true, teacher_last_name: true, teacher_photo_url: true } },
            bookings: {
                where: { status: { not: "CANCELLED" } },
                select: { id: true, status: true, studentId: true }
            },
            _count: { select: { bookings: { where: { status: { not: "CANCELLED" } } } } }
        }
    })
}

/**
 * Available slots for a student — status=AVAILABLE and student hasn't already booked it
 */
export async function getAvailableSlotsForStudent({ studentId, teacherId, startDate, endDate }) {
    const student = await prisma.student.findUnique({
        where: { student_id: studentId },
        select: { campus_id: true }
    })
    if (!student) return null

    const where = {
        campusId: student.campus_id,
        status: "AVAILABLE",
        date: { gte: new Date() },
        bookings: { none: { studentId, status: { not: "CANCELLED" } } } // exclude already-booked by this student
    }
    if (teacherId) where.teacherId = teacherId
    if (startDate) where.date.gte = new Date(startDate)
    if (endDate) where.date.lte = new Date(endDate)

    return prisma.ptmSlot.findMany({
        where,
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        include: {
            teacher: { select: { teacher_id: true, teacher_first_name: true, teacher_last_name: true, teacher_photo_url: true } },
            _count: { select: { bookings: { where: { status: { not: "CANCELLED" } } } } }
        }
    })
}

export async function updatePtmSlot({ slotId, title, description, date, startTime, endTime, capacity }) {
    const slot = await prisma.ptmSlot.findUnique({ where: { id: slotId }, select: { status: true } })
    if (!slot) return null
    if (slot.status === "CANCELLED") return null

    const data = {}
    if (title !== undefined) data.title = title
    if (description !== undefined) data.description = description
    if (date !== undefined) data.date = new Date(date)
    if (startTime !== undefined) data.startTime = startTime
    if (endTime !== undefined) data.endTime = endTime
    if (capacity !== undefined) data.capacity = capacity

    return prisma.ptmSlot.update({ where: { id: slotId }, data })
}

export async function cancelPtmSlot(slotId) {
    const slot = await prisma.ptmSlot.findUnique({ where: { id: slotId }, select: { status: true } })
    if (!slot) return null
    if (slot.status === "CANCELLED") return null

    return prisma.ptmSlot.update({ where: { id: slotId }, data: { status: "CANCELLED" } })
}

// ─── Booking CRUD ─────────────────────────────────────────────────────────────

/**
 * Book one or more students into a slot atomically.
 * bookings = [{ studentId, parentId? }, ...]
 */
export async function createPtmBookings({ ptmSlotId, bookings }) {
    // Catch duplicate studentIds within the same request before hitting the DB
    const studentIds = bookings.map((b) => b.studentId)
    const uniqueStudentIds = new Set(studentIds)
    if (uniqueStudentIds.size !== studentIds.length) {
        throw new Error("Duplicate students in the same booking request")
    }

    try {
        return await prisma.$transaction(async (tx) => {
            const slot = await tx.ptmSlot.findUnique({
                where: { id: ptmSlotId },
                select: { id: true, status: true, capacity: true }
            })
            if (!slot) throw new Error("PTM slot not found")
            if (slot.status === "CANCELLED") throw new Error("PTM slot is cancelled")
            if (slot.status === "BOOKED") throw new Error("PTM slot is fully booked")

            const activeCount = await tx.ptmBooking.count({
                where: { ptmSlotId, status: { not: "CANCELLED" } }
            })

            const remaining = slot.capacity - activeCount
            if (bookings.length > remaining) {
                throw new Error(`Only ${remaining} spot(s) remaining in this slot`)
            }

            // Check if any of these students already have an active booking for this slot
            const existing = await tx.ptmBooking.findMany({
                where: {
                    ptmSlotId,
                    studentId: { in: studentIds },
                    status: { not: "CANCELLED" }
                },
                select: { studentId: true }
            })
            if (existing.length > 0) {
                const duplicates = existing.map((b) => b.studentId).join(", ")
                throw new Error(`Student(s) already booked for this slot: ${duplicates}`)
            }

            const created = await Promise.all(
                bookings.map(({ studentId, parentId }) =>
                    tx.ptmBooking.create({
                        data: { ptmSlotId, studentId, parentId: parentId ?? null, status: "SCHEDULED" },
                        include: {
                            ptmSlot: {
                                include: { teacher: { select: { teacher_id: true, teacher_first_name: true, teacher_last_name: true } } }
                            },
                            student: { select: { student_id: true, student_first_name: true, student_last_name: true } },
                            parent: { select: { parent_id: true, name: true, relation_type: true } }
                        }
                    })
                )
            )

            if (activeCount + bookings.length >= slot.capacity) {
                await tx.ptmSlot.update({ where: { id: ptmSlotId }, data: { status: "BOOKED" } })
            }

            return created
        })
    } catch (err) {
        // Prisma unique constraint violation — belt-and-suspenders catch
        if (err.code === "P2002" && err.meta?.target?.includes("studentId")) {
            throw new Error("One or more students are already booked for this slot")
        }
        throw err
    }
}

// kept for single-booking callers inside the codebase
export async function createPtmBooking({ ptmSlotId, studentId, parentId }) {
    const results = await createPtmBookings({ ptmSlotId, bookings: [{ studentId, parentId }] })
    return results[0]
}

export async function getPtmBookingById(bookingId) {
    return prisma.ptmBooking.findUnique({
        where: { id: bookingId },
        include: {
            ptmSlot: {
                include: { teacher: { select: { teacher_id: true, teacher_first_name: true, teacher_last_name: true, teacher_photo_url: true } } }
            },
            student: { select: { student_id: true, student_first_name: true, student_last_name: true, student_photo_url: true } },
            parent: { select: { parent_id: true, name: true, phone: true, email: true, relation_type: true } }
        }
    })
}

export async function getPtmBookingsByStudent({ studentId, status, limit = 50, offset = 0 }) {
    const where = { studentId }
    if (status) where.status = status

    return prisma.ptmBooking.findMany({
        where,
        orderBy: { ptmSlot: { date: "desc" } },
        skip: offset,
        take: limit,
        include: {
            ptmSlot: {
                include: { teacher: { select: { teacher_id: true, teacher_first_name: true, teacher_last_name: true, teacher_photo_url: true } } }
            },
            student: { select: { student_id: true, student_first_name: true, student_last_name: true } },
            parent: { select: { parent_id: true, name: true, relation_type: true } }
        }
    })
}

export async function getPtmBookingsByTeacher({ teacherId, status, startDate, endDate, limit = 50, offset = 0 }) {
    const slotWhere = { teacherId }
    if (startDate || endDate) {
        slotWhere.date = {}
        if (startDate) slotWhere.date.gte = new Date(startDate)
        if (endDate) slotWhere.date.lte = new Date(endDate)
    }

    const bookingWhere = { ptmSlot: slotWhere }
    if (status) bookingWhere.status = status

    return prisma.ptmBooking.findMany({
        where: bookingWhere,
        orderBy: { ptmSlot: { date: "asc" } },
        skip: offset,
        take: limit,
        include: {
            ptmSlot: true,
            student: { select: { student_id: true, student_first_name: true, student_last_name: true, student_photo_url: true } },
            parent: { select: { parent_id: true, name: true, relation_type: true } }
        }
    })
}

export async function completePtmBooking({ bookingId, teacherNotes }) {
    const booking = await prisma.ptmBooking.findUnique({ where: { id: bookingId }, select: { status: true } })
    if (!booking) return null
    if (booking.status !== "SCHEDULED") return null

    return prisma.ptmBooking.update({
        where: { id: bookingId },
        data: { status: "COMPLETED", completedAt: new Date(), teacherNotes: teacherNotes ?? null }
    })
}

export async function markPtmNoShow(bookingId) {
    const booking = await prisma.ptmBooking.findUnique({ where: { id: bookingId }, select: { status: true } })
    if (!booking) return null
    if (booking.status !== "SCHEDULED") return null

    return prisma.ptmBooking.update({ where: { id: bookingId }, data: { status: "NO_SHOW" } })
}

export async function cancelPtmBooking(bookingId) {
    return prisma.$transaction(async (tx) => {
        const booking = await tx.ptmBooking.findUnique({
            where: { id: bookingId },
            select: { status: true, ptmSlotId: true }
        })
        if (!booking) return null
        if (booking.status === "COMPLETED" || booking.status === "CANCELLED") return null

        const cancelled = await tx.ptmBooking.update({
            where: { id: bookingId },
            data: { status: "CANCELLED" }
        })

        // Reopen the slot if it was BOOKED and now has capacity again
        const slot = await tx.ptmSlot.findUnique({
            where: { id: booking.ptmSlotId },
            select: { status: true, capacity: true }
        })
        if (slot && slot.status === "BOOKED") {
            const remaining = await tx.ptmBooking.count({
                where: { ptmSlotId: booking.ptmSlotId, status: { not: "CANCELLED" } }
            })
            if (remaining < slot.capacity) {
                await tx.ptmSlot.update({ where: { id: booking.ptmSlotId }, data: { status: "AVAILABLE" } })
            }
        }

        return cancelled
    })
}

export async function updatePtmNotes({ bookingId, teacherNotes }) {
    const booking = await prisma.ptmBooking.findUnique({ where: { id: bookingId }, select: { id: true } })
    if (!booking) return null

    return prisma.ptmBooking.update({ where: { id: bookingId }, data: { teacherNotes } })
}
