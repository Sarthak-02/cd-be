// ─── Authorized Pickup Persons ────────────────────────────────────────────────

export const PickupAuthorizedPersonCreateSchema = {
    tags: ["Pickup"],
    body: {
        type: "object",
        required: ["student_id", "name", "relationship"],
        properties: {
            student_id: { type: "string" },
            name: { type: "string", minLength: 1 },
            relationship: { type: "string", minLength: 1 },
            photo_url: { type: "string" },
            remarks: { type: "string" }
        }
    }
};

export const PickupAuthorizedPersonListSchema = {
    tags: ["Pickup"],
    querystring: {
        type: "object",
        required: ["student_id"],
        properties: {
            student_id: { type: "string" },
            include_inactive: { type: "boolean" }
        }
    }
};

export const PickupAuthorizedPersonUpdateSchema = {
    tags: ["Pickup"],
    params: {
        type: "object",
        required: ["id"],
        properties: {
            id: { type: "string" }
        }
    },
    body: {
        type: "object",
        minProperties: 1,
        properties: {
            name: { type: "string", minLength: 1 },
            relationship: { type: "string", minLength: 1 },
            photo_url: { type: "string" },
            remarks: { type: "string" },
            is_active: { type: "boolean" }
        }
    }
};

export const PickupAuthorizedPersonDeleteSchema = {
    tags: ["Pickup"],
    params: {
        type: "object",
        required: ["id"],
        properties: {
            id: { type: "string" }
        }
    }
};

// ─── Pickup Requests (one-time) ───────────────────────────────────────────────

export const PickupRequestCreateSchema = {
    tags: ["Pickup"],
    body: {
        type: "object",
        required: ["student_id", "requested_by", "name", "relationship", "valid_date"],
        properties: {
            student_id: { type: "string" },
            requested_by: { type: "string", description: "parent_id" },
            name: { type: "string", minLength: 1 },
            relationship: { type: "string", minLength: 1 },
            photo_url: { type: "string", description: "Pre-submitted photo of person for identity verification" },
            remarks: { type: "string" },
            valid_date: { type: "string", format: "date", description: "Date this request is valid for (YYYY-MM-DD)" }
        }
    }
};

export const PickupRequestListSchema = {
    tags: ["Pickup"],
    querystring: {
        type: "object",
        required: ["student_id"],
        properties: {
            student_id: { type: "string" },
            date: { type: "string", format: "date" },
            status: {
                type: "string",
                enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED", "EXPIRED"]
            }
        }
    }
};

export const PickupRequestPendingSchema = {
    tags: ["Pickup"],
    querystring: {
        type: "object",
        required: ["campus_id"],
        properties: {
            campus_id: { type: "string" },
            date: { type: "string", format: "date", description: "Defaults to today" }
        }
    }
};

export const PickupRequestApproveSchema = {
    tags: ["Pickup"],
    params: {
        type: "object",
        required: ["id"],
        properties: {
            id: { type: "string" }
        }
    },
    body: {
        type: "object",
        required: ["approved_by"],
        properties: {
            approved_by: { type: "string", description: "teacher_id or admin who is approving" }
        }
    }
};

export const PickupRequestRejectSchema = {
    tags: ["Pickup"],
    params: {
        type: "object",
        required: ["id"],
        properties: {
            id: { type: "string" }
        }
    },
    body: {
        type: "object",
        required: ["rejected_by"],
        properties: {
            rejected_by: { type: "string" },
            rejection_note: { type: "string" }
        }
    }
};

// ─── Pickup Logs (teacher confirmation) ──────────────────────────────────────

export const PickupLogCreateSchema = {
    tags: ["Pickup"],
    body: {
        type: "object",
        required: ["student_id", "confirmed_by", "source", "person_name", "person_relationship"],
        properties: {
            student_id: { type: "string" },
            confirmed_by: { type: "string", description: "teacher_id confirming the pickup" },
            picked_up_at: { type: "string", format: "date-time", description: "Defaults to now if not provided" },
            pickup_photo_url: { type: "string", description: "Optional photo taken at pickup time" },
            source: {
                type: "string",
                enum: ["AUTHORIZED_PERSON", "ONE_TIME_REQUEST", "MANUAL"]
            },
            authorized_person_id: { type: "string" },
            pickup_request_id: { type: "string" },
            person_name: { type: "string", minLength: 1 },
            person_relationship: { type: "string", minLength: 1 },
            notes: { type: "string" }
        }
    }
};

export const PickupLogListSchema = {
    tags: ["Pickup"],
    querystring: {
        type: "object",
        required: ["student_id"],
        properties: {
            student_id: { type: "string" },
            limit: { type: "integer", minimum: 1, maximum: 100 },
            offset: { type: "integer", minimum: 0 }
        }
    }
};

export const PickupLogTodaySchema = {
    tags: ["Pickup"],
    querystring: {
        type: "object",
        required: ["campus_id"],
        properties: {
            campus_id: { type: "string" },
            date: { type: "string", format: "date", description: "Defaults to today" }
        }
    }
};

// ─── Photo Upload ─────────────────────────────────────────────────────────────

export const PickupPhotoUploadUrlSchema = {
    tags: ["Pickup"],
    body: {
        type: "object",
        required: ["entity", "entity_id", "mime_type"],
        properties: {
            entity: {
                type: "string",
                enum: ["authorized_person", "pickup_log"],
                description: "What this photo belongs to"
            },
            entity_id: { type: "string", description: "ID of the authorized person or a temp UUID" },
            mime_type: {
                type: "string",
                enum: ["image/jpeg", "image/png", "image/webp"]
            }
        }
    }
};

export const PickupPhotoProcessSchema = {
    tags: ["Pickup"],
    body: {
        type: "object",
        required: ["object_path", "entity", "entity_id"],
        properties: {
            object_path: { type: "string", description: "The objectPath returned from the upload-url step" },
            entity: {
                type: "string",
                enum: ["authorized_person", "pickup_log"]
            },
            entity_id: { type: "string" }
        }
    }
};
