export const sectionCreateRequestSchema = {
    tags: ["Section"],
    body: {
        type: "object",
        required: ["section_name", "class_id"],
        properties: {
            section_id: { type: "string" },

            section_name: { type: "string" },
            section_short_name: { type: "string", nullable: true },
            section_teacher_id: { type: "string", nullable: true },
            section_room_no: { type: "string", nullable: true },

            extras: { type: "object", nullable: true },

            class_id: { type: "string" },

        }
    }
}

export const sectionGetRequestSchema = {
    tags: ["Section"],
    querystring: {
        type: "object",
        required: ["section_id"],
        properties: {
            section_id: { type: "string" }
        }
    }
}
