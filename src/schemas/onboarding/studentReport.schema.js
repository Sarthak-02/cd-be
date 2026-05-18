export const StudentReportGradesSchema = {
    tags: ["StudentReport"],
    params: {
        type: "object",
        required: ["student_id"],
        properties: {
            student_id: { type: "string", description: "Student ID" }
        }
    },
    querystring: {
        type: "object",
        properties: {
            exam_id: { type: "string", description: "Filter to one exam" },
            start_date: { type: "string", format: "date", description: "Filter by exam date (from), YYYY-MM-DD" },
            end_date: { type: "string", format: "date", description: "Filter by exam date (to), YYYY-MM-DD" },
            status: {
                type: "string",
                enum: ["all", "graded", "pending"],
                default: "all",
                description: "Filter rows by whether a mark is recorded"
            }
        }
    }
};

export const StudentReportExamSchema = {
    tags: ["StudentReport"],
    params: {
        type: "object",
        required: ["student_id", "exam_id"],
        properties: {
            student_id: { type: "string", description: "Student ID" },
            exam_id: { type: "string", description: "Exam ID" }
        }
    }
};

export const StudentReportSubjectsSchema = {
    tags: ["StudentReport"],
    params: {
        type: "object",
        required: ["student_id"],
        properties: {
            student_id: { type: "string", description: "Student ID" }
        }
    },
    querystring: {
        type: "object",
        required: ["subject_name"],
        properties: {
            subject_name: { type: "string", minLength: 1, description: "Exam subject name" },
            start_date: { type: "string", format: "date", description: "Filter by exam date (from), YYYY-MM-DD" },
            end_date: { type: "string", format: "date", description: "Filter by exam date (to), YYYY-MM-DD" }
        }
    }
};

export const StudentReportSummarySchema = {
    tags: ["StudentReport"],
    params: {
        type: "object",
        required: ["student_id"],
        properties: {
            student_id: { type: "string", description: "Student ID" }
        }
    },
    querystring: {
        type: "object",
        properties: {
            start_date: { type: "string", format: "date", description: "Filter by exam date (from), YYYY-MM-DD" },
            end_date: { type: "string", format: "date", description: "Filter by exam date (to), YYYY-MM-DD" }
        }
    }
};
