export const AttendanceBulkCreateRequestSchema = {
  tags: ["Attendance"],
  body: {
    type: "object",
    required: ["section_id", "teacher_id", "date", "records"],
    properties: {
      section_id: { type: "string" },
      teacher_id: { type: "string" },
      campus_session: { type: "string" },
      date: { type: "string", format: "date-time" },
      period: { type: "string" },
      records: {
        type: "array",
        items: {
          type: "object",
          required: ["student_id", "status"],
          properties: {
            student_id: {
              type: "string"
            },
            status: {
              type: "string",
              enum: ["PRESENT", "ABSENT", "LATE","EXCUSED"]
            }
          },
          additionalProperties: false
        }
      }
    }
  }
}