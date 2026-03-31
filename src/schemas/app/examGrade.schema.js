export const ExamGradeUpsertSchema = {
    tags: ["ExamGrade"],
    body: {
        type: "object",
        required: ["exam_id", "exam_subject_id", "student_id"],
        properties: {
            exam_id: {
                type: "string",
                description: "Exam ID"
            },
            exam_subject_id: {
                type: "string",
                description: "Exam Subject ID"
            },
            student_id: {
                type: "string",
                description: "Student ID"
            },
            grades_obtained: {
                type: "string",
                description: "Grades obtained by the student (e.g., 'A+', '85/100', '3.5 GPA')"
            },
            remarks: {
                type: "string",
                description: "Teacher's remarks or feedback"
            },
            graded_by: {
                type: "string",
                description: "Teacher ID who graded this exam"
            }
        }
    }
};

export const ExamGradeBulkUpsertSchema = {
    tags: ["ExamGrade"],
    body: {
        type: "object",
        required: ["grades"],
        properties: {
            grades: {
                type: "array",
                minItems: 1,
                items: {
                    type: "object",
                    required: ["exam_id", "exam_subject_id", "student_id"],
                    properties: {
                        exam_id: {
                            type: "string",
                            description: "Exam ID"
                        },
                        exam_subject_id: {
                            type: "string",
                            description: "Exam Subject ID"
                        },
                        student_id: {
                            type: "string",
                            description: "Student ID"
                        },
                        grades_obtained: {
                            type: "string",
                            description: "Grades obtained by the student"
                        },
                        remarks: {
                            type: "string",
                            description: "Teacher's remarks or feedback"
                        },
                        graded_by: {
                            type: "string",
                            description: "Teacher ID who graded this exam"
                        }
                    }
                },
                description: "Array of grade objects to create or update"
            }
        }
    }
};

export const ExamGradeGetByExamSchema = {
    tags: ["ExamGrade"],
    params: {
        type: "object",
        required: ["exam_id"],
        properties: {
            exam_id: {
                type: "string",
                description: "Exam ID"
            }
        }
    }
};

export const ExamGradeGetByExamSubjectSchema = {
    tags: ["ExamGrade"],
    params: {
        type: "object",
        required: ["exam_subject_id"],
        properties: {
            exam_subject_id: {
                type: "string",
                description: "Exam Subject ID"
            }
        }
    }
};

export const ExamGradeGetByStudentSchema = {
    tags: ["ExamGrade"],
    querystring: {
        type: "object",
        required: ["student_id"],
        properties: {
            student_id: {
                type: "string",
                description: "Student ID"
            },
            exam_id: {
                type: "string",
                description: "Filter by specific exam ID"
            },
            start_date: {
                type: "string",
                format: "date",
                description: "Start date for exam date filter (YYYY-MM-DD)"
            },
            end_date: {
                type: "string",
                format: "date",
                description: "End date for exam date filter (YYYY-MM-DD)"
            }
        }
    }
};

export const ExamGradeGetByIdSchema = {
    tags: ["ExamGrade"],
    params: {
        type: "object",
        required: ["grade_id"],
        properties: {
            grade_id: {
                type: "string",
                description: "Grade ID"
            }
        }
    }
};

export const ExamGradeUpdateSchema = {
    tags: ["ExamGrade"],
    params: {
        type: "object",
        required: ["grade_id"],
        properties: {
            grade_id: {
                type: "string",
                description: "Grade ID"
            }
        }
    },
    body: {
        type: "object",
        properties: {
            grades_obtained: {
                type: "string",
                description: "Grades obtained by the student"
            },
            remarks: {
                type: "string",
                description: "Teacher's remarks or feedback"
            },
            graded_by: {
                type: "string",
                description: "Teacher ID who graded this exam"
            }
        },
        minProperties: 1
    }
};

export const ExamGradeDeleteSchema = {
    tags: ["ExamGrade"],
    params: {
        type: "object",
        required: ["grade_id"],
        properties: {
            grade_id: {
                type: "string",
                description: "Grade ID to delete"
            }
        }
    }
};

export const ExamGradeDeleteByExamSubjectSchema = {
    tags: ["ExamGrade"],
    params: {
        type: "object",
        required: ["exam_subject_id"],
        properties: {
            exam_subject_id: {
                type: "string",
                description: "Exam Subject ID - all grades for this subject will be deleted"
            }
        }
    }
};

export const ExamGradeGetStatisticsSchema = {
    tags: ["ExamGrade"],
    params: {
        type: "object",
        required: ["exam_id"],
        properties: {
            exam_id: {
                type: "string",
                description: "Exam ID to get statistics for"
            }
        }
    }
};

export const ExamGradeGetStudentReportSchema = {
    tags: ["ExamGrade"],
    querystring: {
        type: "object",
        required: ["student_id", "exam_id"],
        properties: {
            student_id: {
                type: "string",
                description: "Student ID"
            },
            exam_id: {
                type: "string",
                description: "Exam ID"
            }
        }
    }
};
