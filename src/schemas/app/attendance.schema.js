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

export const AttendanceGetDetailsSchema = {
  tags: ["Attendance"],
  querystring: {
    type: "object",
    required: ["section_id", "date"],
    properties: {
      section_id: { 
        type: "string",
        description: "Section ID to fetch attendance for"
      },
      date: { 
        type: "string", 
        format: "date",
        description: "Date in YYYY-MM-DD format"
      },
      campus_session: { 
        type: "string",
        enum: ["MORNING", "EVENING", "FULL_DAY"],
        description: "Optional campus session filter"
      },
      period: { 
        type: "string",
        description: "Optional period filter (e.g., OVERALL, P1, P2, etc.)"
      }
    }
  }
}

export const StudentAttendanceGetSchema = {
  tags: ["Attendance"],
  body: {
    type: "object",
    required: ["student_id", "section_id"],
    properties: {
      student_id: { 
        type: "string",
        description: "Student ID to fetch attendance for"
      },
      section_id: { 
        type: "string",
        description: "Section ID to filter attendance records"
      },
      start_date: { 
        type: "string", 
        format: "date",
        description: "Optional start date for date range filter (YYYY-MM-DD)"
      },
      end_date: { 
        type: "string", 
        format: "date",
        description: "Optional end date for date range filter (YYYY-MM-DD)"
      }
    }
  }
}

export const TodayScheduleGetSchema = {
  tags: ["Attendance"],
  querystring: {
    type: "object",
    required: ["section_id"],
    properties: {
      section_id: { 
        type: "string",
        description: "Section ID to fetch today's schedule for"
      }
    }
  }
}