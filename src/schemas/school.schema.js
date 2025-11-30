export const schoolCreateRequestSchema = {
    tags: ["School"],
    body: {
      type: "object",
      required: ["school_id", "school_name", "school_type"],
      properties: {
        school_id: { type: "string" },
        school_name: { type: "string" },
        school_type: { type: "string" },
  
        motto: { type: "string", nullable: true },
        school_website: { type: "string", nullable: true },
        school_logo: { type: "string", nullable: true },
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