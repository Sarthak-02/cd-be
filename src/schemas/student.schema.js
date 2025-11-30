export const studentCreateRequestSchema = {
    tags: ["Student"],
    body: {
        type: "object",
        required: [
            "student_admission_no",
            "student_first_name",
            "student_gender",
            "student_dob",
            "student_current_status",
            "campus_id"
        ],
        properties: {
            student_id: { type: "string" },

            student_admission_no: { type: "string" },
            student_roll_no: { type: "string", nullable: false },
            student_photo_url: { type: "string", nullable: true },
            student_first_name: { type: "string" },
            student_middle_name: { type: "string", nullable: true },
            student_last_name: { type: "string", nullable: true },
            student_gender: { type: "string" },
            student_dob: { type: "string", format: "date-time" },
            student_current_status: { type: "string" },

            extras: { type: "object", nullable: true },

            campus_id: { type: "string" },
        }
    }
}

export const studentGetRequestSchema = {
    tags: ["Student"],
    querystring: {
        type: "object",
        required: ["student_id"],
        properties: {
            student_id: { type: "string" }
        }
    }
}
