export const teacherCreateRequestSchema = {
    tags: ["Teacher"],
    body: {
        type: "object",
        required: [
            "teacher_employee_code",
            "teacher_first_name",
            "teacher_last_name",
            "teacher_gender",
            "teacher_dob",
            "teacher_email",
            "teacher_status",
            "campus_id"
        ],
        properties: {
            teacher_id: { type: "string" },

            teacher_employee_code: { type: "string" },
            teacher_first_name: { type: "string" },
            teacher_middle_name: { type: "string", nullable: true },
            teacher_last_name: { type: "string" },
            teacher_gender: { type: "string" },
            teacher_dob: { type: "string", format: "date-time" },
            teacher_photo_url: { type: "string", nullable: true },
            teacher_email: { type: "string" },
            teacher_phone: { type: "string", nullable: true },
            teacher_status: { type: "string" },

            extras: { type: "object", nullable: true },

            campus_id: { type: "string" },

        }
    }
}

export const teacherGetRequestSchema = {
    tags: ["Teacher"],
    querystring: {
        type: "object",
        required: ["teacher_id"],
        properties: {
            teacher_id: { type: "string" }
        }
    }
}

export const teacherByCampusGetRequestSchema = {
    tags: ["Teacher"],
    querystring: {
        type: "object",
        properties: {
            campus_id: { type: "string" }
        }
    }
}
