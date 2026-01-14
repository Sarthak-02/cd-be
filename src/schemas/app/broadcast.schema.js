
export const BroadcastCreateRequestSchema = {
    tags: ["Attendance"],
    body: {
        type: "object",
        required: ["title", "message", "targets"],
        properties: {
            title: { type: "string" },
            message: { type: "string" },
            attachmentUrls: {
                type: "array",
                items: { type: "object" }
            },
            targets: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        targetType: { type: "string", enum: ["CAMPUS", "CLASS", "SECTION", "STUDENT"] },
                        targetId: { type: "string" },
                    }
                }
            },

            campusId: { type: "string" }
        }
    }
}