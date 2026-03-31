export const loginRequestSchema = {
    tags: ["Auth"],
    body: {
      type: "object",
      required: ["userid", "password"],
      properties: {
        userId: { type: "string" },
        password: { type: "string" }
      },
    },
    response:{
        type:"object"
    }
  };


  