export const userCreateRequestSchema = {
  tags: ["User"],
  body: {
    type: "object",
    required: [
      "userid",
      "username",
      "password",
      "isadmin",
      "site_permissions",
      "page_permissions"
    ],
    properties: {
      userid: { type: "string" },
      username: { type: "string" },
      password: { type: "string" },
      isadmin: { type: "boolean" },
      site_permissions: { type: "array" },
      page_permissions: { type: "array" }
    }
  }
}

export const userEditRequestSchema = {
  tags: ["User"],
  body: {
    type: "object",
    required: [
      "userid",
      "username",
      "isadmin",
      "site_permissions",
      "page_permissions"
    ],
    properties: {
      userid: { type: "string" },
      username: { type: "string" },
      password: { type: "string" },
      isadmin: { type: "boolean" },
      site_permissions: { type: "array" },
      page_permissions: { type: "array" }
    }
  }
}

export const userGetRequestSchema = {
  tags: ["User"],
  querystring: {
    type: "object",
    required: ["userid"],
    properties: {
      userid: { type: "string" }
    }
  }
}
