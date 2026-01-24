export const HomeworkCreateSchema = {
    tags: ["Homework"],
    body: {
        type: "object",
        required: ["title", "description", "due_date", "subject", "teacher_id", "targets"],
        properties: {
            title: {
                type: "string",
                minLength: 1,
                description: "Homework title"
            },
            description: {
                type: "string",
                minLength: 1,
                description: "Detailed description of the homework"
            },
            due_date: {
                type: "string",
                format: "date-time",
                description: "Due date for homework submission"
            },
            subject: {
                type: "string",
                description: "Subject name"
            },
            teacher_id: {
                type: "string",
                description: "ID of the teacher creating the homework"
            },
            attachments: {
                type: "array",
                items: {
                    type: "object",
                    required: ["fileUrl", "fileName", "fileType", "fileSize"],
                    properties: {
                        fileUrl: { type: "string" },
                        fileName: { type: "string" },
                        fileType: { type: "string" },
                        fileSize: { type: "integer" }
                    }
                },
                description: "Optional array of file attachments"
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
                            enum: ["CLASS", "SECTION", "STUDENT"],
                            description: "Type of target"
                        },
                        targetId: {
                            type: "string",
                            description: "ID of the target (class_id, section_id, or student_id)"
                        }
                    }
                },
                description: "Array of targets (at least one required)"
            },
            publish: {
                type: "boolean",
                description: "If true, publish homework immediately and send notifications (default: false, keeps as DRAFT)"
            }
        }
    }
};

export const HomeworkGetByIdSchema = {
    tags: ["Homework"],
    params: {
        type: "object",
        required: ["homework_id"],
        properties: {
            homework_id: {
                type: "string",
                description: "Homework ID"
            }
        }
    }
};

export const HomeworkGetByTeacherSchema = {
    tags: ["Homework"],
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
                enum: ["DRAFT", "PUBLISHED", "CLOSED"],
                description: "Filter by homework status"
            },
            start_date: {
                type: "string",
                format: "date",
                description: "Start date for due date filter (YYYY-MM-DD)"
            },
            end_date: {
                type: "string",
                format: "date",
                description: "End date for due date filter (YYYY-MM-DD)"
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

export const HomeworkGetByTargetSchema = {
    tags: ["Homework"],
    querystring: {
        type: "object",
        required: ["target_type", "target_id"],
        properties: {
            target_type: {
                type: "string",
                enum: ["CLASS", "SECTION", "STUDENT"],
                description: "Type of target"
            },
            target_id: {
                type: "string",
                description: "ID of the target"
            },
            status: {
                type: "string",
                enum: ["DRAFT", "PUBLISHED", "CLOSED"],
                description: "Filter by homework status (default: PUBLISHED)"
            },
            start_date: {
                type: "string",
                format: "date",
                description: "Start date for due date filter (YYYY-MM-DD)"
            },
            end_date: {
                type: "string",
                format: "date",
                description: "End date for due date filter (YYYY-MM-DD)"
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

export const HomeworkGetForStudentSchema = {
    tags: ["Homework"],
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
                enum: ["DRAFT", "PUBLISHED", "CLOSED"],
                description: "Filter by homework status (default: PUBLISHED)"
            },
            start_date: {
                type: "string",
                format: "date",
                description: "Start date for due date filter (YYYY-MM-DD)"
            },
            end_date: {
                type: "string",
                format: "date",
                description: "End date for due date filter (YYYY-MM-DD)"
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

export const HomeworkUpdateSchema = {
    tags: ["Homework"],
    params: {
        type: "object",
        required: ["homework_id"],
        properties: {
            homework_id: {
                type: "string",
                description: "Homework ID"
            }
        }
    },
    body: {
        type: "object",
        properties: {
            title: {
                type: "string",
                minLength: 1,
                description: "Homework title"
            },
            description: {
                type: "string",
                minLength: 1,
                description: "Detailed description of the homework"
            },
            due_date: {
                type: "string",
                format: "date-time",
                description: "Due date for homework submission"
            },
            subject: {
                type: "string",
                description: "Subject name"
            }
        },
        minProperties: 1
    }
};

export const HomeworkPublishSchema = {
    tags: ["Homework"],
    params: {
        type: "object",
        required: ["homework_id"],
        properties: {
            homework_id: {
                type: "string",
                description: "Homework ID"
            }
        }
    },
    body: {
        type: "object",
        required: ["teacher_id"],
        properties: {
            teacher_id: {
                type: "string",
                description: "Teacher ID who is publishing the homework"
            }
        }
    }
};

export const HomeworkCloseSchema = {
    tags: ["Homework"],
    params: {
        type: "object",
        required: ["homework_id"],
        properties: {
            homework_id: {
                type: "string",
                description: "Homework ID"
            }
        }
    },
    body: {
        type: "object",
        required: ["teacher_id"],
        properties: {
            teacher_id: {
                type: "string",
                description: "Teacher ID who is closing the homework"
            },
            notify: {
                type: "boolean",
                description: "Whether to send closure notification to parents (default: false)"
            }
        }
    }
};

export const HomeworkDeleteSchema = {
    tags: ["Homework"],
    params: {
        type: "object",
        required: ["homework_id"],
        properties: {
            homework_id: {
                type: "string",
                description: "Homework ID (must be in DRAFT status)"
            }
        }
    }
};

export const HomeworkAddAttachmentsSchema = {
    tags: ["Homework"],
    params: {
        type: "object",
        required: ["homework_id"],
        properties: {
            homework_id: {
                type: "string",
                description: "Homework ID"
            }
        }
    },
    body: {
        type: "object",
        required: ["attachments"],
        properties: {
            attachments: {
                type: "array",
                minItems: 1,
                items: {
                    type: "object",
                    required: ["fileUrl", "fileName", "fileType", "fileSize"],
                    properties: {
                        fileUrl: { type: "string" },
                        fileName: { type: "string" },
                        fileType: { type: "string" },
                        fileSize: { type: "integer" }
                    }
                }
            }
        }
    }
};

export const HomeworkRemoveAttachmentSchema = {
    tags: ["Homework"],
    params: {
        type: "object",
        required: ["attachment_id"],
        properties: {
            attachment_id: {
                type: "string",
                description: "Attachment ID to remove"
            }
        }
    }
};

export const HomeworkAddTargetsSchema = {
    tags: ["Homework"],
    params: {
        type: "object",
        required: ["homework_id"],
        properties: {
            homework_id: {
                type: "string",
                description: "Homework ID"
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
                            enum: ["CLASS", "SECTION", "STUDENT"]
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

export const HomeworkRemoveTargetSchema = {
    tags: ["Homework"],
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

export const HomeworkGetStatsSchema = {
    tags: ["Homework"],
    querystring: {
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

export const HomeworkGetUpcomingSchema = {
    tags: ["Homework"],
    querystring: {
        type: "object",
        required: ["target_type", "target_id"],
        properties: {
            target_type: {
                type: "string",
                enum: ["CLASS", "SECTION", "STUDENT"],
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

export const HomeworkGetOverdueSchema = {
    tags: ["Homework"],
    querystring: {
        type: "object",
        required: ["target_type", "target_id"],
        properties: {
            target_type: {
                type: "string",
                enum: ["CLASS", "SECTION", "STUDENT"],
                description: "Type of target"
            },
            target_id: {
                type: "string",
                description: "ID of the target"
            }
        }
    }
};
