import {
    createPtmSlot,
    getPtmSlotById,
    getPtmSlotsByTeacher,
    getPtmSlotsByCampus,
    getAvailableSlotsForStudent,
    updatePtmSlot,
    cancelPtmSlot,
    createPtmBookings,
    createPtmBooking,
    getPtmBookingById,
    getPtmBookingsByStudent,
    getPtmBookingsByTeacher,
    completePtmBooking,
    markPtmNoShow,
    cancelPtmBooking,
    updatePtmNotes
} from "../../db/ptm.db.js"
import {
    notifyPtmBooked,
    notifyPtmCancelled,
    notifyPtmReminder
} from "../../services/app/ptmNotify.service.js"

// ─── Slot controllers ─────────────────────────────────────────────────────────

export async function create_ptm_slot(req, reply) {
    try {
        const { teacher_id, campus_id, title, description, date, start_time, end_time, created_by, capacity, student_id, parent_id } = req.body

        const slot = await createPtmSlot({
            teacherId: teacher_id,
            campusId: campus_id,
            title,
            description,
            date,
            startTime: start_time,
            endTime: end_time,
            createdBy: created_by,
            capacity,
            studentId: student_id,
            parentId: parent_id
        })

        const isPreAssigned = !!student_id
        const message = isPreAssigned
            ? "PTM slot created and assigned to student successfully"
            : "PTM slot created successfully"

        if (isPreAssigned) {
            notifyPtmBooked({ bookingId: slot.booking.id }).catch((err) =>
                console.error("PTM booking notification failed:", err)
            )
        }

        reply.code(201).send({ success: true, message, data: slot })
    } catch (err) {
        console.error(err)
        reply.code(500).send({ success: false, message: err.message || "Unable to create PTM slot" })
    }
}

export async function get_ptm_slot_by_id(req, reply) {
    try {
        const { slot_id } = req.params
        const slot = await getPtmSlotById(slot_id)

        if (!slot) return reply.code(404).send({ success: false, message: "PTM slot not found" })

        reply.send({ success: true, data: slot })
    } catch (err) {
        console.error(err)
        reply.code(500).send({ success: false, message: "Unable to fetch PTM slot" })
    }
}

export async function get_ptm_slots_by_teacher(req, reply) {
    try {
        const { teacher_id, status, start_date, end_date, limit, offset } = req.query

        const slots = await getPtmSlotsByTeacher({
            teacherId: teacher_id,
            status,
            startDate: start_date,
            endDate: end_date,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0
        })

        reply.send({ success: true, data: slots, count: slots.length })
    } catch (err) {
        console.error(err)
        reply.code(500).send({ success: false, message: "Unable to fetch PTM slots" })
    }
}

export async function get_ptm_slots_by_campus(req, reply) {
    try {
        const { campus_id, status, start_date, end_date, teacher_id, limit, offset } = req.query

        const slots = await getPtmSlotsByCampus({
            campusId: campus_id,
            status,
            startDate: start_date,
            endDate: end_date,
            teacherId: teacher_id,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0
        })

        reply.send({ success: true, data: slots, count: slots.length })
    } catch (err) {
        console.error(err)
        reply.code(500).send({ success: false, message: "Unable to fetch PTM slots" })
    }
}

export async function get_available_slots_for_student(req, reply) {
    try {
        const { student_id, teacher_id, start_date, end_date } = req.query

        const slots = await getAvailableSlotsForStudent({
            studentId: student_id,
            teacherId: teacher_id,
            startDate: start_date,
            endDate: end_date
        })

        if (slots === null) return reply.code(404).send({ success: false, message: "Student not found" })

        reply.send({ success: true, data: slots, count: slots.length })
    } catch (err) {
        console.error(err)
        reply.code(500).send({ success: false, message: "Unable to fetch available slots" })
    }
}

export async function update_ptm_slot(req, reply) {
    try {
        const { slot_id } = req.params
        const { title, description, date, start_time, end_time, capacity } = req.body

        const slot = await updatePtmSlot({
            slotId: slot_id,
            title,
            description,
            date,
            startTime: start_time,
            endTime: end_time,
            capacity
        })

        if (!slot) return reply.code(404).send({ success: false, message: "PTM slot not found or cannot be edited (only AVAILABLE slots can be updated)" })

        reply.send({ success: true, message: "PTM slot updated successfully", data: slot })
    } catch (err) {
        console.error(err)
        reply.code(500).send({ success: false, message: "Unable to update PTM slot" })
    }
}

export async function cancel_ptm_slot(req, reply) {
    try {
        const { slot_id } = req.params

        const slot = await cancelPtmSlot(slot_id)

        if (!slot) return reply.code(404).send({ success: false, message: "PTM slot not found or already cancelled" })

        reply.send({ success: true, message: "PTM slot cancelled successfully" })
    } catch (err) {
        console.error(err)
        reply.code(500).send({ success: false, message: "Unable to cancel PTM slot" })
    }
}

// ─── Booking controllers ──────────────────────────────────────────────────────

// Parent-facing: POST /ptm/slot/:slot_id/book
export async function parent_book_slot(req, reply) {
    try {
        const { slot_id } = req.params
        const { bookings } = req.body

        const created = await createPtmBookings({
            ptmSlotId: slot_id,
            bookings: bookings.map(({ student_id, parent_id }) => ({ studentId: student_id, parentId: parent_id }))
        })

        created.forEach(({ id }) =>
            notifyPtmBooked({ bookingId: id }).catch((err) =>
                console.error("PTM booking notification failed:", err)
            )
        )

        reply.code(201).send({
            success: true,
            message: `${created.length} booking(s) confirmed. Confirmation(s) will be sent shortly.`,
            data: created
        })
    } catch (err) {
        console.error(err)
        const isConflict = err.message.includes("fully booked") || err.message.includes("spot(s) remaining") || err.message.includes("already booked") || err.message.includes("Duplicate students")
        reply.code(isConflict ? 409 : 500).send({ success: false, message: err.message || "Unable to book slot" })
    }
}

export async function create_ptm_booking(req, reply) {
    try {
        const { ptm_slot_id, bookings } = req.body

        const created = await createPtmBookings({
            ptmSlotId: ptm_slot_id,
            bookings: bookings.map(({ student_id, parent_id }) => ({ studentId: student_id, parentId: parent_id }))
        })

        created.forEach(({ id }) =>
            notifyPtmBooked({ bookingId: id }).catch((err) =>
                console.error("PTM booking notification failed:", err)
            )
        )

        reply.code(201).send({
            success: true,
            message: `${created.length} booking(s) created successfully.`,
            data: created
        })
    } catch (err) {
        console.error(err)
        const isConflict = err.message.includes("fully booked") || err.message.includes("spot(s) remaining") || err.message.includes("already booked") || err.message.includes("Duplicate students")
        reply.code(isConflict ? 409 : 500).send({ success: false, message: err.message || "Unable to book PTM slot" })
    }
}

export async function get_ptm_booking_by_id(req, reply) {
    try {
        const { booking_id } = req.params
        const booking = await getPtmBookingById(booking_id)

        if (!booking) return reply.code(404).send({ success: false, message: "PTM booking not found" })

        reply.send({ success: true, data: booking })
    } catch (err) {
        console.error(err)
        reply.code(500).send({ success: false, message: "Unable to fetch PTM booking" })
    }
}

export async function get_ptm_bookings_by_student(req, reply) {
    try {
        const { student_id, status, limit, offset } = req.query

        const bookings = await getPtmBookingsByStudent({
            studentId: student_id,
            status,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0
        })

        reply.send({ success: true, data: bookings, count: bookings.length })
    } catch (err) {
        console.error(err)
        reply.code(500).send({ success: false, message: "Unable to fetch PTM bookings" })
    }
}

export async function get_ptm_bookings_by_teacher(req, reply) {
    try {
        const { teacher_id, status, start_date, end_date, limit, offset } = req.query

        const bookings = await getPtmBookingsByTeacher({
            teacherId: teacher_id,
            status,
            startDate: start_date,
            endDate: end_date,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0
        })

        reply.send({ success: true, data: bookings, count: bookings.length })
    } catch (err) {
        console.error(err)
        reply.code(500).send({ success: false, message: "Unable to fetch PTM bookings" })
    }
}

export async function complete_ptm_booking(req, reply) {
    try {
        const { booking_id } = req.params
        const { teacher_notes } = req.body ?? {}

        const booking = await completePtmBooking({ bookingId: booking_id, teacherNotes: teacher_notes })

        if (!booking) return reply.code(404).send({ success: false, message: "PTM booking not found or not in SCHEDULED state" })

        reply.send({ success: true, message: "PTM meeting marked as completed", data: booking })
    } catch (err) {
        console.error(err)
        reply.code(500).send({ success: false, message: "Unable to complete PTM booking" })
    }
}

export async function mark_ptm_no_show(req, reply) {
    try {
        const { booking_id } = req.params

        const booking = await markPtmNoShow(booking_id)

        if (!booking) return reply.code(404).send({ success: false, message: "PTM booking not found or not in SCHEDULED state" })

        reply.send({ success: true, message: "PTM booking marked as no-show", data: booking })
    } catch (err) {
        console.error(err)
        reply.code(500).send({ success: false, message: "Unable to mark PTM as no-show" })
    }
}

export async function cancel_ptm_booking(req, reply) {
    try {
        const { booking_id } = req.params
        const { cancelled_by_role = "PARENT" } = req.body ?? {}

        const booking = await cancelPtmBooking(booking_id)

        if (!booking) return reply.code(404).send({ success: false, message: "PTM booking not found or cannot be cancelled" })

        notifyPtmCancelled({ bookingId: booking_id, cancelledByRole: cancelled_by_role }).catch((err) =>
            console.error("PTM cancel notification failed:", err)
        )

        reply.send({ success: true, message: "PTM booking cancelled successfully" })
    } catch (err) {
        console.error(err)
        reply.code(500).send({ success: false, message: "Unable to cancel PTM booking" })
    }
}

export async function update_ptm_notes(req, reply) {
    try {
        const { booking_id } = req.params
        const { teacher_notes } = req.body

        const booking = await updatePtmNotes({ bookingId: booking_id, teacherNotes: teacher_notes })

        if (!booking) return reply.code(404).send({ success: false, message: "PTM booking not found" })

        reply.send({ success: true, message: "Notes updated successfully", data: booking })
    } catch (err) {
        console.error(err)
        reply.code(500).send({ success: false, message: "Unable to update PTM notes" })
    }
}

export async function send_ptm_reminder(req, reply) {
    try {
        const { booking_id } = req.params

        const result = await notifyPtmReminder({ bookingId: booking_id })

        if (!result.ok) throw new Error("Failed to send reminder")

        reply.send({ success: true, message: "PTM reminder sent successfully", notificationStats: { queuedCount: result.queuedCount } })
    } catch (err) {
        console.error(err)
        reply.code(500).send({ success: false, message: err.message || "Unable to send PTM reminder" })
    }
}
