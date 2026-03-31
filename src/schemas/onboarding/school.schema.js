export const schoolCreateRequestSchema = {
    tags: ["School"],
    body: {
      type: "object",
      required: ["school_id", "school_name"],
      properties: {
        school_id: { type: "string" },
        school_name: { type: "string" },
        extras: { type: "object", nullable: true },
      }
    }
  }

  export const schoolGetRequestSchema = {
    tags: ["School"],
    querystring: {
      type: "object",
      required: ["school_id"],
      properties: {
        school_id: { type: "string" }
      }
    }
  }