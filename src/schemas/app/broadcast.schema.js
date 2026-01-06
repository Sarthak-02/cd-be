
export const BroadcastCreateRequestSchema = {
    tags: ["Attendance"],
    body: {
        type: "object",
        required: ["title", "message", "targetType", "targetId"],
        properties: {
            title: { type: "string" },
            message: { type: "string" },
            attachmentUrls: {
                type: "array",
                items: { type: "string" }
            },
            targets: {
                type: "array",
                item: {
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