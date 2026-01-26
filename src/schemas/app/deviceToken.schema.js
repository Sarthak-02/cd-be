export const RegisterDeviceTokenSchema = {
  tags: ["Device Token"],
  description: "Register a device token for push notifications",
  body: {
    type: "object",
    required: ["token", "platform"],
    properties: {
      token: { 
        type: "string", 
        minLength: 10,
        description: "FCM device token"
      },
      platform: { 
        type: "string", 
        enum: ["ios", "android", "web"],
        description: "Device platform"
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            userType: { type: "string" },
            token: { type: "string" },
            platform: { type: "string" },
            createdAt: { type: "string" },
            updatedAt: { type: "string" },
            lastUsedAt: { type: "string" }
          }
        }
      }
    }
  }
};

export const UnregisterDeviceTokenSchema = {
  tags: ["Device Token"],
  description: "Unregister a specific device token",
  body: {
    type: "object",
    required: ["token"],
    properties: {
      token: { 
        type: "string",
        minLength: 10,
        description: "FCM device token to remove"
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" }
      }
    }
  }
};

export const UnregisterAllDeviceTokensSchema = {
  tags: ["Device Token"],
  description: "Unregister all device tokens for the authenticated user",
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            count: { type: "number" }
          }
        }
      }
    }
  }
};

export const GetDeviceTokensSchema = {
  tags: ["Device Token"],
  description: "Get all device tokens for the authenticated user",
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              token: { type: "string" },
              platform: { type: "string" },
              createdAt: { type: "string" },
              lastUsedAt: { type: "string" }
            }
          }
        }
      }
    }
  }
};
