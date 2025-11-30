export const campusCreateRequestSchema = {
    tags: ["Campus"],
    body: {
      type: "object",
      required: ["campus_id", "campus_name", "campus_type", "school_id"],
      properties: {
        campus_id: { type: "string" },
        campus_name: { type: "string" },
        campus_type: { type: "string" },
  
        school_id: { type: "string" },
  
        extras: { type: "object", nullable: true },
  
      }
    }
  }

  export const campusGetRequestSchema = {
    tags: ["Campus"],
    querystring: {
      type: "object",
      required: ["campus_id"],
      properties: {
        campus_id: { type: "string" }
      }
    }
  }
  