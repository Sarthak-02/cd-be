export const createEndUsersRequestSchema = {
  tags: ["EndUser"],
  body: {
    type: "object",
    required: ["campus_id", "role", "use_provided_ids"],
    properties: {
      campus_id: { type: "string" },
      role: { type: "string", enum: ["STUDENT", "TEACHER"] },
      use_provided_ids: {
        type: "boolean",
        description: "true = use the userids array; false = pull all records from Student/Teacher table for this campus",
      },
      userids: {
        type: "array",
        items: { type: "string" },
        description: "Required when use_provided_ids is true",
      },
    },
  },
};
