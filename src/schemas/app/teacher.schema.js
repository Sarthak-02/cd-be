export const TeacherListBySectionPostSchema = {
  body: {
    type: "object",
    required: ["campus_id", "section_id"],
    properties: {
      campus_id: { type: "string", minLength: 1 },
      section_id: { type: "string", minLength: 1 },
    },
  },
};

export const TeacherPermissionsGetRequestSchema = {
  querystring: {
    type: 'object',
    required: ['teacher_id'],
    properties: {
      teacher_id: { type: 'string', minLength: 1 }
    }
  }
};
