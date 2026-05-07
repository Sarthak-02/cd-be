export const StudentsBySectionGetRequestSchema = {
  querystring: {
    type: 'object',
    required: ['section_id'],
    properties: {
      section_id: { type: 'string', minLength: 1 }
    }
  }
};

export const StudentPermissionsGetRequestSchema = {
  querystring: {
    type: 'object',
    required: ['student_id'],
    properties: {
      student_id: { type: 'string', minLength: 1 }
    }
  }
};
