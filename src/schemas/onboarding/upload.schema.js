export const generateUploadUrlSchema = {
    body: {
      type: "object",
      required: ["entity", "entityId", "mimeType", "fileSize"],
      properties: {
        entity: {
          type: "string",
          enum: ["student", "teacher"],
        },
        entityId: {
          type: "string",
          minLength: 1,
        },
        mimeType: {
          type: "string",
          enum: ["image/jpeg", "image/png", "image/webp"],
        },
        fileSize: {
          type: "number",
          maximum: 2 * 1024 * 1024, // 2MB
        },
      },
    },
  
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          uploadUrl: { type: "string" },
          objectPath: { type: "string" },
          expectedUrls: {
            type: "object",
            properties: {
              full: { type: "string" },
              medium: { type: "string" },
              thumb: { type: "string" },
            },
          },
        },
      },
      400: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
    },
  };
  