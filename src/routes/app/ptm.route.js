import {
    create_ptm_slot,
    get_ptm_slot_by_id,
    get_ptm_slots_by_teacher,
    get_ptm_slots_by_campus,
    get_available_slots_for_student,
    update_ptm_slot,
    cancel_ptm_slot,
    parent_book_slot,
    create_ptm_booking,
    get_ptm_booking_by_id,
    get_ptm_bookings_by_student,
    get_ptm_bookings_by_teacher,
    complete_ptm_booking,
    mark_ptm_no_show,
    cancel_ptm_booking,
    update_ptm_notes,
    send_ptm_reminder
} from "../../controllers/app/ptm.controller.js"

import {
    PtmCreateSlotSchema,
    PtmGetSlotByIdSchema,
    PtmGetSlotsByTeacherSchema,
    PtmGetSlotsByCampusSchema,
    PtmGetAvailableSlotsSchema,
    PtmUpdateSlotSchema,
    PtmCancelSlotSchema,
    PtmParentBookSlotSchema,
    PtmCreateBookingSchema,
    PtmGetBookingByIdSchema,
    PtmGetBookingsByStudentSchema,
    PtmGetBookingsByTeacherSchema,
    PtmCompleteBookingSchema,
    PtmNoShowSchema,
    PtmCancelBookingSchema,
    PtmUpdateNotesSchema,
    PtmSendReminderSchema
} from "../../schemas/app/ptm.schema.js"

async function ptmRoutes(app) {
    // ── Slots ──────────────────────────────────────────────────────────────────

    // Create a new slot (teacher/admin)
    app.post("/ptm/slot", { schema: { body: PtmCreateSlotSchema.body } }, create_ptm_slot)

    // Get a specific slot (with booking details)
    app.get("/ptm/slot/:slot_id", { schema: { params: PtmGetSlotByIdSchema.params } }, get_ptm_slot_by_id)

    // Teacher view: all their slots (upcoming schedule)
    app.get("/ptm/slot/teacher/all", { schema: { querystring: PtmGetSlotsByTeacherSchema.querystring } }, get_ptm_slots_by_teacher)

    // Admin view: all slots for a campus
    app.get("/ptm/slot/campus/all", { schema: { querystring: PtmGetSlotsByCampusSchema.querystring } }, get_ptm_slots_by_campus)

    // Parent/student view: available slots they can book
    app.get("/ptm/slot/available", { schema: { querystring: PtmGetAvailableSlotsSchema.querystring } }, get_available_slots_for_student)

    // Update a slot (only AVAILABLE slots)
    app.patch("/ptm/slot/:slot_id", { schema: { params: PtmUpdateSlotSchema.params, body: PtmUpdateSlotSchema.body } }, update_ptm_slot)

    // Cancel a slot
    app.delete("/ptm/slot/:slot_id", { schema: { params: PtmCancelSlotSchema.params } }, cancel_ptm_slot)

    // Parent-facing: book a specific slot (slot_id in URL, no ptm_slot_id in body needed)
    app.post("/ptm/slot/:slot_id/book", { schema: { params: PtmParentBookSlotSchema.params, body: PtmParentBookSlotSchema.body } }, parent_book_slot)

    // ── Bookings ───────────────────────────────────────────────────────────────

    // Generic booking (internal / admin use)
    app.post("/ptm/booking", { schema: { body: PtmCreateBookingSchema.body } }, create_ptm_booking)

    // Get a specific booking (teacher or parent)
    app.get("/ptm/booking/:booking_id", { schema: { params: PtmGetBookingByIdSchema.params } }, get_ptm_booking_by_id)

    // Parent: past & upcoming PTMs for their child
    app.get("/ptm/booking/student/all", { schema: { querystring: PtmGetBookingsByStudentSchema.querystring } }, get_ptm_bookings_by_student)

    // Teacher: all bookings on their slots
    app.get("/ptm/booking/teacher/all", { schema: { querystring: PtmGetBookingsByTeacherSchema.querystring } }, get_ptm_bookings_by_teacher)

    // Teacher actions on a booking
    app.post("/ptm/booking/:booking_id/complete", { schema: { params: PtmCompleteBookingSchema.params, body: PtmCompleteBookingSchema.body } }, complete_ptm_booking)
    app.post("/ptm/booking/:booking_id/no-show", { schema: { params: PtmNoShowSchema.params } }, mark_ptm_no_show)
    app.post("/ptm/booking/:booking_id/cancel", { schema: { params: PtmCancelBookingSchema.params, body: PtmCancelBookingSchema.body } }, cancel_ptm_booking)

    // Teacher: update/add private notes after meeting
    app.patch("/ptm/booking/:booking_id/notes", { schema: { params: PtmUpdateNotesSchema.params, body: PtmUpdateNotesSchema.body } }, update_ptm_notes)

    // Send reminder to parent before the meeting
    app.post("/ptm/booking/:booking_id/reminder", { schema: { params: PtmSendReminderSchema.params } }, send_ptm_reminder)
}

export default ptmRoutes
