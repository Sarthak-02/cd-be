
export const BroadcastCreateRequestSchema = {
    tags: ["Attendance"],
    body: {
        type: "object",
        required: ["title", "message", "targets", "campusId"],
        properties: {
            title: { type: "string" },
            message: { type: "string" },
            category: {
                type: "string",
                description:
                    "Announcement category for UI (e.g. urgent, information, fun). Defaults to \"general\" if omitted.",
            },
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

export const BroadcastGetReceivedSchema = {
    tags: ["Broadcast"],
    querystring: {
        type: "object",
        required: ["receiverId"],
        properties: {
            receiverId: { type: "string" },
            campusId: { type: "string" }
        }
    }
}

export const BroadcastGetSentSchema = {
    tags: ["Broadcast"],
    querystring: {
        type: "object",
        required: ["createdBy"],
        properties: {
            createdBy: { type: "string" },
            campusId: { type: "string" }
        }
    }
}

export const BroadcastGetByIdSchema = {
    tags: ["Broadcast"],
    params: {
        type: "object",
        required: ["id"],
        properties: {
            id: { type: "string" }
        }
    }
}

export const BroadcastGetAllSchema = {
    tags: ["Broadcast"],
    querystring: {
        type: "object",
        properties: {
            campusId: { type: "string" },
            status: { 
                type: "string", 
                enum: ["DRAFT", "NOTIFYING", "SUBMITTED"]
            },
            sourceType: {
                type: "string",
                enum: ["ATTENDANCE", "BROADCAST", "HOMEWORK", "EXAM", "SYSTEM"],
                description: "Filter by notification source type. For broadcasts, use BROADCAST or omit."
            },
            createdBy: { type: "string" },
            category: { type: "string" },
            limit: { 
                type: "number",
                minimum: 1,
                maximum: 500,
                default: 100
            },
            offset: { 
                type: "number",
                minimum: 0,
                default: 0
            }
        }
    }
}

export const BroadcastUpdateSchema = {
    tags: ["Broadcast"],
    params: {
        type: "object",
        required: ["id"],
        properties: {
            id: { type: "string" }
        }
    },
    body: {
        type: "object",
        properties: {
            title: { type: "string" },
            message: { type: "string" },
            category: { type: "string" },
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
            }
        }
    }
}