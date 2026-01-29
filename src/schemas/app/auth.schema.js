export const SignupRequestSchema = {
  tags: ["Auth"],
  body: {
    type: "object",
    required: ["username", "userid", "password", "role"],
    properties: {
      username: { type: "string", minLength: 3 },
      userid: { type: "string", minLength: 3 },
      password: { type: "string", minLength: 6 },
      role: { 
        type: "string", 
        enum: ["STUDENT", "TEACHER", "ADMIN", "PARENT"] 
      }
    },
    additionalProperties: false
  },
  response: {
    type: "object"
  }
};

export const LoginRequestSchema = {
  tags: ["Auth"],
  body: {
    type: "object",
    required: ["username", "password"],
    properties: {
      username: { type: "string" },
      password: { type: "string" }
    },
    additionalProperties: false
  },
  response: {
    type: "object"
  }
};

export const LogoutRequestSchema = {
  tags: ["Auth"],
  description: "Logout user and clear cache",
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
