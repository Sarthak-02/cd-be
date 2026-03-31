export const StudentsBySectionGetRequestSchema = {
  querystring: {
    type: 'object',
    required: ['section_id'],
    properties: {
      section_id: { type: 'string', minLength: 1 }
    }
  }
};
