export const classCreateRequestSchema = {
    tags: ["Class"],
    body: {
        type: "object",
        required: ["class_name", "campus_id"],
        properties: {
            class_id: { type: "string" },

            class_name: { type: "string" },
            class_short_name: { type: "string", nullable: true },
            class_description: { type: "string", nullable: true },
            class_room_no: { type: "string", nullable: true },
            class_teacher_id: { type: "string", nullable: true },
            class_has_sections: { type: "boolean", nullable: true },
            class_type: { type: "string", nullable: true },
            class_stream: { type: "string", nullable: true },
            class_shift: { type: "string", nullable: true },

            extras: { type: "object", nullable: true },

            campus_id: { type: "string" },

        }
    }
}


export const classGetRequestSchema = {
    tags: ["Class"],
    querystring: {
        type: "object",
        required: ["class_id"],
        properties: {
            class_id: { type: "string" }
        }
    }
}
