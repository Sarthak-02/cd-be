export const ExamCreateSchema = {
    tags: ["Exam"],
    body: {
        type: "object",
        required: ["exam_type", "target", "teacher_id", "campus_id", "subjects", "targets"],
        properties: {
            exam_type: {
                type: "string",
                minLength: 1,
                description: "Exam type (e.g., 'Mid-Term', 'Final', 'Unit Test')"
            },
            target: {
                type: "string",
                enum: ["CLASS", "STUDENT", "SECTION", "SCHOOL", "GROUP"],
                description: "Target level of the exam"
            },
            grading_type: {
                type: "string",
                description: "Grading type (e.g., 'Percentage', 'Grade Points', 'Pass/Fail')"
            },
            grading_extras: {
                type: "object",
                description: "Additional grading configuration"
            },
            teacher_id: {
                type: "string",
                description: "ID of the teacher creating the exam"
            },
            campus_id: {
                type: "string",
                description: "Campus ID"
            },
            subjects: {
                type: "array",
                minItems: 1,
                items: {
                    type: "object",
                    required: ["subjectName", "examDate", "examStartTime", "examEndTime"],
                    properties: {
                        subjectName: { 
                            type: "string",
                            description: "Subject name"
                        },
                        examDate: { 
                            type: "string",
                            format: "date",
                            description: "Exam date (YYYY-MM-DD)"
                        },
                        examStartTime: { 
                            type: "string",
                            pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$",
                            description: "Exam start time (HH:MM or HH:MM:SS)"
                        },
                        examEndTime: { 
                            type: "string",
                            pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$",
                            description: "Exam end time (HH:MM or HH:MM:SS)"
                        },
                        extras: {
                            type: "object",
                            description: "Additional subject-specific details"
                        }
                    }
                },
                description: "Array of exam subjects"
            },
            targets: {
                type: "array",
                minItems: 1,
                items: {
                    type: "object",
                    required: ["targetType", "targetId"],
                    properties: {
                        targetType: {
                            type: "string",
                            enum: ["CLASS", "STUDENT", "SECTION", "SCHOOL", "GROUP"],
                            description: "Type of target"
                        },
                        targetId: {
                            type: "string",
                            description: "ID of the target (student_id, section_id, school_id, or group_id)"
                        }
                    }
                },
                description: "Array of targets (at least one required)"
            },
            publish: {
                type: "boolean",
                description: "If true, publish exam immediately and send notifications (default: false, keeps as DRAFT)"
            }
        }
    }
};

export const ExamGetByIdSchema = {
    tags: ["Exam"],
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

export const ExamGetByCampusSchema = {
    tags: ["Exam"],
    querystring: {
        type: "object",
        required: ["campus_id"],
        properties: {
            campus_id: {
                type: "string",
                description: "Campus ID"
            },
            status: {
                type: "string",
                enum: ["DRAFT", "PUBLISHED", "COMPLETED"],
                description: "Filter by exam status"
            },
            exam_type: {
                type: "string",
                description: "Filter by exam type"
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
            },
            limit: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                description: "Number of records to return (default: 50)"
            },
            offset: {
                type: "integer",
                minimum: 0,
                description: "Number of records to skip (default: 0)"
            }
        }
    }
};

export const ExamGetByTeacherSchema = {
    tags: ["Exam"],
    querystring: {
        type: "object",
        required: ["teacher_id"],
        properties: {
            teacher_id: {
                type: "string",
                description: "Teacher ID"
            },
            status: {
                type: "string",
                enum: ["DRAFT", "PUBLISHED", "COMPLETED"],
                description: "Filter by exam status"
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
            },
            limit: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                description: "Number of records to return (default: 50)"
            },
            offset: {
                type: "integer",
                minimum: 0,
                description: "Number of records to skip (default: 0)"
            }
        }
    }
};

export const ExamGetByTargetSchema = {
    tags: ["Exam"],
    querystring: {
        type: "object",
        required: ["target_type", "target_id"],
        properties: {
            target_type: {
                type: "string",
                enum: ["STUDENT", "SECTION", "SCHOOL", "GROUP"],
                description: "Type of target"
            },
            target_id: {
                type: "string",
                description: "ID of the target"
            },
            status: {
                type: "string",
                enum: ["DRAFT", "PUBLISHED", "COMPLETED"],
                description: "Filter by exam status (default: PUBLISHED)"
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
            },
            limit: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                description: "Number of records to return (default: 50)"
            },
            offset: {
                type: "integer",
                minimum: 0,
                description: "Number of records to skip (default: 0)"
            }
        }
    }
};

export const ExamGetForStudentSchema = {
    tags: ["Exam"],
    querystring: {
        type: "object",
        required: ["student_id"],
        properties: {
            student_id: {
                type: "string",
                description: "Student ID"
            },
            status: {
                type: "string",
                enum: ["DRAFT", "PUBLISHED", "COMPLETED"],
                description: "Filter by exam status (default: PUBLISHED)"
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
            },
            limit: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                description: "Number of records to return (default: 50)"
            },
            offset: {
                type: "integer",
                minimum: 0,
                description: "Number of records to skip (default: 0)"
            }
        }
    }
};

export const ExamUpdateSchema = {
    tags: ["Exam"],
    params: {
        type: "object",
        required: ["exam_id"],
        properties: {
            exam_id: {
                type: "string",
                description: "Exam ID (must be in DRAFT status)"
            }
        }
    },
    body: {
        type: "object",
        properties: {
            exam_type: {
                type: "string",
                minLength: 1,
                description: "Exam type (e.g., 'Mid-Term', 'Final', 'Unit Test')"
            },
            target: {
                type: "string",
                enum: ["CLASS","STUDENT", "SECTION", "SCHOOL", "GROUP"],
                description: "Target level of the exam"
            },
            grading_type: {
                type: "string",
                description: "Grading type (e.g., 'Percentage', 'Grade Points', 'Pass/Fail')"
            },
            grading_extras: {
                type: "object",
                description: "Additional grading configuration"
            },
            subjects: {
                type: "array",
                items: {
                    type: "object",
                    required: ["subjectName", "examDate", "examStartTime", "examEndTime"],
                    properties: {
                        subjectName: { 
                            type: "string",
                            description: "Subject name"
                        },
                        examDate: { 
                            type: "string",
                            format: "date",
                            description: "Exam date (YYYY-MM-DD)"
                        },
                        examStartTime: { 
                            type: "string",
                            pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$",
                            description: "Exam start time (HH:MM or HH:MM:SS)"
                        },
                        examEndTime: { 
                            type: "string",
                            pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$",
                            description: "Exam end time (HH:MM or HH:MM:SS)"
                        },
                        extras: {
                            type: "object",
                            description: "Additional subject-specific details"
                        }
                    }
                },
                description: "Array of exam subjects (if provided, replaces all existing subjects)"
            },
            targets: {
                type: "array",
                items: {
                    type: "object",
                    required: ["targetType", "targetId"],
                    properties: {
                        targetType: {
                            type: "string",
                            enum: ["CLASS","STUDENT", "SECTION", "SCHOOL", "GROUP"],
                            description: "Type of target"
                        },
                        targetId: {
                            type: "string",
                            description: "ID of the target (student_id, section_id, school_id, or group_id)"
                        }
                    }
                },
                description: "Array of targets (if provided, replaces all existing targets)"
            }
        },
        minProperties: 1
    }
};

export const ExamPublishSchema = {
    tags: ["Exam"],
    params: {
        type: "object",
        required: ["exam_id"],
        properties: {
            exam_id: {
                type: "string",
                description: "Exam ID"
            }
        }
    },
    body: {
        type: "object",
        required: ["teacher_id"],
        properties: {
            teacher_id: {
                type: "string",
                description: "Teacher ID who is publishing the exam"
            }
        }
    }
};

export const ExamCompleteSchema = {
    tags: ["Exam"],
    params: {
        type: "object",
        required: ["exam_id"],
        properties: {
            exam_id: {
                type: "string",
                description: "Exam ID"
            }
        }
    },
    body: {
        type: "object",
        required: ["teacher_id"],
        properties: {
            teacher_id: {
                type: "string",
                description: "Teacher ID who is completing the exam"
            },
            notify: {
                type: "boolean",
                description: "Whether to send completion notification to parents (default: false)"
            }
        }
    }
};

export const ExamDeleteSchema = {
    tags: ["Exam"],
    params: {
        type: "object",
        required: ["exam_id"],
        properties: {
            exam_id: {
                type: "string",
                description: "Exam ID (must be in DRAFT status)"
            }
        }
    }
};

export const ExamAddSubjectsSchema = {
    tags: ["Exam"],
    params: {
        type: "object",
        required: ["exam_id"],
        properties: {
            exam_id: {
                type: "string",
                description: "Exam ID"
            }
        }
    },
    body: {
        type: "object",
        required: ["subjects"],
        properties: {
            subjects: {
                type: "array",
                minItems: 1,
                items: {
                    type: "object",
                    required: ["subjectName", "examDate", "examStartTime", "examEndTime"],
                    properties: {
                        subjectName: { type: "string" },
                        examDate: { type: "string", format: "date" },
                        examStartTime: { type: "string", pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$" },
                        examEndTime: { type: "string", pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$" },
                        extras: { type: "object" }
                    }
                }
            }
        }
    }
};

export const ExamUpdateSubjectSchema = {
    tags: ["Exam"],
    params: {
        type: "object",
        required: ["subject_id"],
        properties: {
            subject_id: {
                type: "string",
                description: "Subject ID"
            }
        }
    },
    body: {
        type: "object",
        properties: {
            subject_name: {
                type: "string",
                description: "Subject name"
            },
            exam_date: {
                type: "string",
                format: "date",
                description: "Exam date (YYYY-MM-DD)"
            },
            exam_start_time: {
                type: "string",
                pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$",
                description: "Exam start time (HH:MM or HH:MM:SS)"
            },
            exam_end_time: {
                type: "string",
                pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$",
                description: "Exam end time (HH:MM or HH:MM:SS)"
            },
            extras: {
                type: "object",
                description: "Additional subject-specific details"
            }
        },
        minProperties: 1
    }
};

export const ExamRemoveSubjectSchema = {
    tags: ["Exam"],
    params: {
        type: "object",
        required: ["subject_id"],
        properties: {
            subject_id: {
                type: "string",
                description: "Subject ID to remove"
            }
        }
    }
};

export const ExamAddTargetsSchema = {
    tags: ["Exam"],
    params: {
        type: "object",
        required: ["exam_id"],
        properties: {
            exam_id: {
                type: "string",
                description: "Exam ID"
            }
        }
    },
    body: {
        type: "object",
        required: ["targets"],
        properties: {
            targets: {
                type: "array",
                minItems: 1,
                items: {
                    type: "object",
                    required: ["targetType", "targetId"],
                    properties: {
                        targetType: {
                            type: "string",
                            enum: ["STUDENT", "SECTION", "SCHOOL", "GROUP"]
                        },
                        targetId: {
                            type: "string"
                        }
                    }
                }
            }
        }
    }
};

export const ExamRemoveTargetSchema = {
    tags: ["Exam"],
    params: {
        type: "object",
        required: ["target_id"],
        properties: {
            target_id: {
                type: "string",
                description: "Target ID to remove"
            }
        }
    }
};

export const ExamGetStatsSchema = {
    tags: ["Exam"],
    querystring: {
        type: "object",
        required: ["campus_id"],
        properties: {
            campus_id: {
                type: "string",
                description: "Campus ID"
            }
        }
    }
};

export const ExamGetUpcomingSchema = {
    tags: ["Exam"],
    querystring: {
        type: "object",
        required: ["target_type", "target_id"],
        properties: {
            target_type: {
                type: "string",
                enum: ["STUDENT", "SECTION", "SCHOOL", "GROUP"],
                description: "Type of target"
            },
            target_id: {
                type: "string",
                description: "ID of the target"
            },
            days: {
                type: "integer",
                minimum: 1,
                maximum: 90,
                description: "Number of days to look ahead (default: 7)"
            }
        }
    }
};

export const ExamGetOngoingSchema = {
    tags: ["Exam"],
    querystring: {
        type: "object",
        required: ["target_type", "target_id"],
        properties: {
            target_type: {
                type: "string",
                enum: ["STUDENT", "SECTION", "SCHOOL", "GROUP"],
                description: "Type of target"
            },
            target_id: {
                type: "string",
                description: "ID of the target"
            }
        }
    }
};

export const ExamSendReminderSchema = {
    tags: ["Exam"],
    params: {
        type: "object",
        required: ["exam_id"],
        properties: {
            exam_id: {
                type: "string",
                description: "Exam ID"
            }
        }
    },
    body: {
        type: "object",
        required: ["teacher_id"],
        properties: {
            teacher_id: {
                type: "string",
                description: "Teacher ID sending the reminder"
            }
        }
    }
};

export const ExamGetStudentsSchema = {
    tags: ["Exam"],
    params: {
        type: "object",
        required: ["exam_id"],
        properties: {
            exam_id: {
                type: "string",
                description: "Exam ID to get students for"
            }
        }
    }
};

export const ExamDownloadGradesTemplateSchema = {
    tags: ["Exam"],
    params: {
        type: "object",
        required: ["exam_id"],
        properties: {
            exam_id: {
                type: "string",
                description: "Exam ID for the grades Excel template"
            }
        }
    }
};

export const ExamUploadGradesXlsxSchema = {
    tags: ["Exam"],
    params: {
        type: "object",
        required: ["exam_id"],
        properties: {
            exam_id: {
                type: "string",
                description: "Exam ID for grades Excel upload"
            }
        }
    }
};

export const ExamGetGradesSchema = {
    tags: ["Exam"],
    querystring: {
        type: "object",
        required: ["exam_id"],
        properties: {
            exam_id: {
                type: "string",
                description: "Exam ID to fetch grades for"
            }
        }
    }
};

export const ExamGetDetailsForStudentSchema = {
    tags: ["Exam"],
    querystring: {
        type: "object",
        required: ["exam_id", "student_id"],
        properties: {
            exam_id: {
                type: "string",
                description: "Exam ID"
            },
            student_id: {
                type: "string",
                description: "Student ID to fetch exam details and grades for"
            }
        }
    }
};
