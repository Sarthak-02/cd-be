export const StudentGroupCreateSchema = {
    body: {
        type: "object",
        required: ["name", "campus_id", "created_by"],
        properties: {
            name: { type: "string", minLength: 1 },
            description: { type: "string" },
            campus_id: { type: "string", minLength: 1 },
            created_by: { type: "string", minLength: 1 },
            student_ids: {
                type: "array",
                items: { type: "string", minLength: 1 },
                description: "Optional list of student IDs to add as members on creation",
            },
        },
    },
};

export const StudentGroupGetByIdSchema = {
    params: {
        type: "object",
        required: ["group_id"],
        properties: {
            group_id: { type: "string", minLength: 1 },
        },
    },
};

export const StudentGroupListSchema = {
    querystring: {
        type: "object",
        required: ["campus_id"],
        properties: {
            campus_id: { type: "string", minLength: 1 },
            created_by: { type: "string" },
            limit: { type: "integer", minimum: 1, maximum: 200, default: 50 },
            offset: { type: "integer", minimum: 0, default: 0 },
        },
    },
};

export const StudentGroupUpdateSchema = {
    params: {
        type: "object",
        required: ["group_id"],
        properties: {
            group_id: { type: "string", minLength: 1 },
        },
    },
    body: {
        type: "object",
        minProperties: 1,
        properties: {
            name: { type: "string", minLength: 1 },
            description: { type: ["string", "null"] },
        },
    },
};

export const StudentGroupDeleteSchema = {
    params: {
        type: "object",
        required: ["group_id"],
        properties: {
            group_id: { type: "string", minLength: 1 },
        },
    },
};

export const StudentGroupAddMembersSchema = {
    params: {
        type: "object",
        required: ["group_id"],
        properties: {
            group_id: { type: "string", minLength: 1 },
        },
    },
    body: {
        type: "object",
        required: ["student_ids"],
        properties: {
            student_ids: {
                type: "array",
                items: { type: "string", minLength: 1 },
                minItems: 1,
            },
        },
    },
};

export const StudentGroupRemoveMembersSchema = {
    params: {
        type: "object",
        required: ["group_id"],
        properties: {
            group_id: { type: "string", minLength: 1 },
        },
    },
    body: {
        type: "object",
        required: ["student_ids"],
        properties: {
            student_ids: {
                type: "array",
                items: { type: "string", minLength: 1 },
                minItems: 1,
            },
        },
    },
};
