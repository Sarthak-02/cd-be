export const TeacherSummaryPostSchema = {
  body: {
    type: "object",
    required: ["campus_id", "teacher_id", "teacher_sections"],
    properties: {
      campus_id: { type: "string", minLength: 1 },
      teacher_id: { type: "string", minLength: 1 },
      teacher_sections: {
        type: "array",
        minItems: 1,
        items: { type: "string", minLength: 1 },
      },
    },
  },
};
