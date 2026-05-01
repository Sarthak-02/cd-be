export const TeacherReportSectionsSchema = {
    tags: ["TeacherReport"],
    params: {
        type: "object",
        required: ["teacher_id"],
        properties: {
            teacher_id: {
                type: "string",
                description: "Teacher ID"
            }
        }
    }
};

export const TeacherReportSectionSummarySchema = {
    tags: ["TeacherReport"],
    params: {
        type: "object",
        required: ["teacher_id", "section_id"],
        properties: {
            teacher_id: {
                type: "string",
                description: "Teacher ID"
            },
            section_id: {
                type: "string",
                description: "Section ID"
            }
        }
    },
    querystring: {
        type: "object",
        properties: {
            start_date: {
                type: "string",
                format: "date",
                description: "Filter by exam date (from), YYYY-MM-DD"
            },
            end_date: {
                type: "string",
                format: "date",
                description: "Filter by exam date (to), YYYY-MM-DD"
            }
        }
    }
};

export const TeacherReportSectionGradesSchema = {
    tags: ["TeacherReport"],
    params: {
        type: "object",
        required: ["teacher_id", "section_id"],
        properties: {
            teacher_id: {
                type: "string",
                description: "Teacher ID"
            },
            section_id: {
                type: "string",
                description: "Section ID"
            }
        }
    },
    querystring: {
        type: "object",
        properties: {
            exam_id: {
                type: "string",
                description: "Filter to one exam"
            },
            start_date: {
                type: "string",
                format: "date",
                description: "Filter by exam date (from), YYYY-MM-DD"
            },
            end_date: {
                type: "string",
                format: "date",
                description: "Filter by exam date (to), YYYY-MM-DD"
            },
            status: {
                type: "string",
                enum: ["all", "graded", "pending"],
                default: "all",
                description: "Filter rows by whether a mark is recorded"
            }
        }
    }
};

export const TeacherReportSectionExamSchema = {
    tags: ["TeacherReport"],
    params: {
        type: "object",
        required: ["teacher_id", "section_id", "exam_id"],
        properties: {
            teacher_id: {
                type: "string",
                description: "Teacher ID"
            },
            section_id: {
                type: "string",
                description: "Section ID"
            },
            exam_id: {
                type: "string",
                description: "Exam ID"
            }
        }
    }
};
