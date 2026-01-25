export const TeacherPermissionsGetRequestSchema = {
  querystring: {
    type: 'object',
    required: ['teacher_id'],
    properties: {
      teacher_id: { type: 'string', minLength: 1 }
    }
  }
};
