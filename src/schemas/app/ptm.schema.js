const timePattern = "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"

// ─── Slot schemas ─────────────────────────────────────────────────────────────

export const PtmCreateSlotSchema = {
    body: {
        type: "object",
        required: ["teacher_id", "campus_id", "title", "date", "start_time", "end_time", "created_by"],
        properties: {
            teacher_id: { type: "string" },
            campus_id: { type: "string" },
            title: { type: "string", minLength: 1 },
            description: { type: "string" },
            date: { type: "string", format: "date" },
            start_time: { type: "string", pattern: timePattern },
            end_time: { type: "string", pattern: timePattern },
            created_by: { type: "string" },
            capacity: { type: "integer", minimum: 1, default: 1 },
            // Optional: teacher-scheduled flow — pre-assign slot to a student at creation
            student_id: { type: "string" },
            parent_id: { type: "string" }
        },
        additionalProperties: false
    }
}

export const PtmGetSlotByIdSchema = {
    params: {
        type: "object",
        required: ["slot_id"],
        properties: { slot_id: { type: "string" } }
    }
}

export const PtmGetSlotsByTeacherSchema = {
    querystring: {
        type: "object",
        required: ["teacher_id"],
        properties: {
            teacher_id: { type: "string" },
            status: { type: "string", enum: ["AVAILABLE", "BOOKED", "CANCELLED"] },
            start_date: { type: "string", format: "date" },
            end_date: { type: "string", format: "date" },
            limit: { type: "string" },
            offset: { type: "string" }
        }
    }
}

export const PtmGetSlotsByCampusSchema = {
    querystring: {
        type: "object",
        required: ["campus_id"],
        properties: {
            campus_id: { type: "string" },
            status: { type: "string", enum: ["AVAILABLE", "BOOKED", "CANCELLED"] },
            start_date: { type: "string", format: "date" },
            end_date: { type: "string", format: "date" },
            teacher_id: { type: "string" },
            limit: { type: "string" },
            offset: { type: "string" }
        }
    }
}

export const PtmGetAvailableSlotsSchema = {
    querystring: {
        type: "object",
        required: ["student_id"],
        properties: {
            student_id: { type: "string" },
            teacher_id: { type: "string" },
            start_date: { type: "string", format: "date" },
            end_date: { type: "string", format: "date" }
        }
    }
}

export const PtmUpdateSlotSchema = {
    params: {
        type: "object",
        required: ["slot_id"],
        properties: { slot_id: { type: "string" } }
    },
    body: {
        type: "object",
        properties: {
            title: { type: "string", minLength: 1 },
            description: { type: "string" },
            date: { type: "string", format: "date" },
            start_time: { type: "string", pattern: timePattern },
            end_time: { type: "string", pattern: timePattern },
            capacity: { type: "integer", minimum: 1 }
        },
        additionalProperties: false
    }
}

export const PtmCancelSlotSchema = {
    params: {
        type: "object",
        required: ["slot_id"],
        properties: { slot_id: { type: "string" } }
    }
}

// ─── Booking schemas ──────────────────────────────────────────────────────────

const bookingItemSchema = {
    type: "object",
    required: ["student_id"],
    properties: {
        student_id: { type: "string" },
        parent_id: { type: "string" }
    },
    additionalProperties: false
}

export const PtmCreateBookingSchema = {
    body: {
        type: "object",
        required: ["ptm_slot_id", "bookings"],
        properties: {
            ptm_slot_id: { type: "string" },
            bookings: { type: "array", minItems: 1, items: bookingItemSchema }
        },
        additionalProperties: false
    }
}

// Parent-facing: slot_id is in the URL, body only carries who is booking
export const PtmParentBookSlotSchema = {
    params: {
        type: "object",
        required: ["slot_id"],
        properties: { slot_id: { type: "string" } }
    },
    body: {
        type: "object",
        required: ["bookings"],
        properties: {
            bookings: { type: "array", minItems: 1, items: bookingItemSchema }
        },
        additionalProperties: false
    }
}

export const PtmGetBookingByIdSchema = {
    params: {
        type: "object",
        required: ["booking_id"],
        properties: { booking_id: { type: "string" } }
    }
}

export const PtmGetBookingsByStudentSchema = {
    querystring: {
        type: "object",
        required: ["student_id"],
        properties: {
            student_id: { type: "string" },
            status: { type: "string", enum: ["SCHEDULED", "COMPLETED", "NO_SHOW", "CANCELLED"] },
            limit: { type: "string" },
            offset: { type: "string" }
        }
    }
}

export const PtmGetBookingsByTeacherSchema = {
    querystring: {
        type: "object",
        required: ["teacher_id"],
        properties: {
            teacher_id: { type: "string" },
            status: { type: "string", enum: ["SCHEDULED", "COMPLETED", "NO_SHOW", "CANCELLED"] },
            start_date: { type: "string", format: "date" },
            end_date: { type: "string", format: "date" },
            limit: { type: "string" },
            offset: { type: "string" }
        }
    }
}

export const PtmCompleteBookingSchema = {
    params: {
        type: "object",
        required: ["booking_id"],
        properties: { booking_id: { type: "string" } }
    },
    body: {
        type: "object",
        properties: {
            teacher_notes: { type: "string" }
        },
        additionalProperties: false
    }
}

export const PtmNoShowSchema = {
    params: {
        type: "object",
        required: ["booking_id"],
        properties: { booking_id: { type: "string" } }
    }
}

export const PtmCancelBookingSchema = {
    params: {
        type: "object",
        required: ["booking_id"],
        properties: { booking_id: { type: "string" } }
    },
    body: {
        type: "object",
        properties: {
            cancelled_by_role: { type: "string", enum: ["PARENT", "TEACHER", "ADMIN"] }
        },
        additionalProperties: false
    }
}

export const PtmUpdateNotesSchema = {
    params: {
        type: "object",
        required: ["booking_id"],
        properties: { booking_id: { type: "string" } }
    },
    body: {
        type: "object",
        required: ["teacher_notes"],
        properties: {
            teacher_notes: { type: "string" }
        },
        additionalProperties: false
    }
}

export const PtmSendReminderSchema = {
    params: {
        type: "object",
        required: ["booking_id"],
        properties: { booking_id: { type: "string" } }
    }
}
