import {
    createHomework,
    getHomeworkById,
    getHomeworkByTeacher,
    getHomeworkByTarget,
    getHomeworkForStudent,
    updateHomework,
    publishHomework,
    closeHomework,
    deleteHomework,
    addHomeworkAttachments,
    removeHomeworkAttachment,
    addHomeworkTargets,
    removeHomeworkTarget,
    getHomeworkStatsByTeacher,
    getUpcomingHomework,
    getOverdueHomework
} from "../../db/homework.db.js";
import { publishHomeworkAndNotify, notifyHomeworkUpdate } from "../../services/app/homeworkNotify.service.js";
import { generateDocumentUploadSignedUrl } from "../../services/gcsSignedUrl.js";

/**
 * Create new homework
 */
export async function create_homework(req, reply) {
    try {
        const data = req.body;
        const {
            title,
            description,
            due_date,
            subject,
            teacher_id,
            attachments = [],
            targets = [],
            publish = false
        } = data;

        if (!title || !description || !due_date || !subject || !teacher_id) {
            return reply.code(400).send({
                success: false,
                message: "title, description, due_date, subject, and teacher_id are required"
            });
        }

        if (!targets || targets.length === 0) {
            return reply.code(400).send({
                success: false,
                message: "At least one target is required"
            });
        }

        const homework = await createHomework({
            title,
            description,
            dueDate: due_date,
            subject,
            createdBy: teacher_id,
            attachments,
            targets
        });

        if (!homework) {
            throw new Error("Failed to create homework");
        }

        // If publish flag is true, publish immediately and send notifications
        if (publish) {
            const publishResult = await publishHomeworkAndNotify({
                homeworkId: homework.id,
                triggeredByTeacherId: teacher_id
            });

            if (!publishResult.ok) {
                throw new Error("Failed to publish homework and send notifications");
            }

            return reply.send({
                success: true,
                message: "Homework created and published successfully",
                data: { ...homework, status: "PUBLISHED" },
                notificationStats: {
                    queuedCount: publishResult.queuedCount,
                    studentCount: publishResult.studentCount
                }
            });
        }

        reply.send({
            success: true,
            message: "Homework created successfully",
            data: homework
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: err.message || "Unable to create homework"
        });
    }
}

/**
 * Get homework by ID
 */
export async function get_homework_by_id(req, reply) {
    try {
        const { homework_id } = req.params;

        const homework = await getHomeworkById(homework_id);

        if (!homework) {
            return reply.code(404).send({
                success: false,
                message: "Homework not found"
            });
        }

        reply.send({
            success: true,
            data: homework
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch homework"
        });
    }
}

/**
 * Get all homework created by a teacher
 */
export async function get_homework_by_teacher(req, reply) {
    try {
        const { teacher_id, status, start_date, end_date, limit, offset } = req.query;

        if (!teacher_id) {
            return reply.code(400).send({
                success: false,
                message: "teacher_id is required"
            });
        }

        const homework = await getHomeworkByTeacher({
            teacherId: teacher_id,
            status,
            startDate: start_date,
            endDate: end_date,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0
        });

        reply.send({
            success: true,
            data: homework,
            count: homework.length
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch homework"
        });
    }
}

/**
 * Get homework for a specific target (class/section/student)
 */
export async function get_homework_by_target(req, reply) {
    try {
        const { target_type, target_id, status, start_date, end_date, limit, offset } = req.query;

        if (!target_type || !target_id) {
            return reply.code(400).send({
                success: false,
                message: "target_type and target_id are required"
            });
        }

        const homework = await getHomeworkByTarget({
            targetType: target_type,
            targetId: target_id,
            status: status || "PUBLISHED",
            startDate: start_date,
            endDate: end_date,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0
        });

        reply.send({
            success: true,
            data: homework,
            count: homework.length
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch homework"
        });
    }
}

/**
 * Get homework for a student
 */
export async function get_homework_for_student(req, reply) {
    try {
        const { student_id, status, start_date, end_date, limit, offset } = req.query;

        if (!student_id) {
            return reply.code(400).send({
                success: false,
                message: "student_id is required"
            });
        }

        const homework = await getHomeworkForStudent({
            studentId: student_id,
            status: status || "PUBLISHED",
            startDate: start_date,
            endDate: end_date,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0
        });

        reply.send({
            success: true,
            data: homework,
            count: homework.length
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch homework"
        });
    }
}

/**
 * Update homework
 */
export async function update_homework(req, reply) {
    try {
        const { homework_id } = req.params;
        const { title, description, due_date, subject, teacher_id, targets, publish } = req.body;

        // First, check if homework exists and get its current status
        const existingHomework = await getHomeworkById(homework_id);
        if (!existingHomework) {
            return reply.code(404).send({
                success: false,
                message: "Homework not found"
            });
        }

        // Update homework with all provided fields
        const homework = await updateHomework({
            homeworkId: homework_id,
            title,
            description,
            dueDate: due_date,
            subject,
            createdBy: teacher_id,
            targets
        });

        if (!homework) {
            return reply.code(500).send({
                success: false,
                message: "Unable to update homework"
            });
        }

        // If publish is true and homework is in DRAFT status, publish it
        if (publish === true && homework.status === 'DRAFT') {
            const publishedHomework = await publishHomework(homework_id);
            
            return reply.send({
                success: true,
                message: "Homework updated and published successfully",
                data: publishedHomework
            });
        }

        reply.send({
            success: true,
            message: "Homework updated successfully",
            data: homework
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: err.message || "Unable to update homework"
        });
    }
}

/**
 * Publish homework and send notifications
 */
export async function publish_homework(req, reply) {
    try {
        const { homework_id } = req.params;
        const { teacher_id } = req.body;

        if (!teacher_id) {
            return reply.code(400).send({
                success: false,
                message: "teacher_id is required"
            });
        }

        // Publish homework and send notifications
        const result = await publishHomeworkAndNotify({
            homeworkId: homework_id,
            triggeredByTeacherId: teacher_id
        });

        if (!result.ok) {
            throw new Error("Failed to publish homework and send notifications");
        }

        // Fetch updated homework
        const homework = await getHomeworkById(homework_id);

        reply.send({
            success: true,
            message: "Homework published and notifications sent successfully",
            data: homework,
            notificationStats: {
                queuedCount: result.queuedCount,
                studentCount: result.studentCount
            }
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: err.message || "Unable to publish homework"
        });
    }
}

/**
 * Close homework and optionally notify
 */
export async function close_homework(req, reply) {
    try {
        const { homework_id } = req.params;
        const { teacher_id, notify = false } = req.body;

        if (!teacher_id) {
            return reply.code(400).send({
                success: false,
                message: "teacher_id is required"
            });
        }

        const homework = await closeHomework(homework_id);

        if (!homework) {
            return reply.code(404).send({
                success: false,
                message: "Homework not found or unable to close"
            });
        }

        // Optionally send closure notification
        let notificationStats = null;
        if (notify) {
            const result = await notifyHomeworkUpdate({
                homeworkId: homework_id,
                triggeredByTeacherId: teacher_id,
                updateType: "CLOSED"
            });

            notificationStats = {
                queuedCount: result.queuedCount
            };
        }

        reply.send({
            success: true,
            message: "Homework closed successfully",
            data: homework,
            notificationStats
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: err.message || "Unable to close homework"
        });
    }
}

/**
 * Delete homework (only DRAFT)
 */
export async function delete_homework(req, reply) {
    try {
        const { homework_id } = req.params;

        const deleted = await deleteHomework(homework_id);

        if (!deleted) {
            return reply.code(400).send({
                success: false,
                message: "Unable to delete homework. Only DRAFT homework can be deleted."
            });
        }

        reply.send({
            success: true,
            message: "Homework deleted successfully"
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to delete homework"
        });
    }
}

/**
 * Add attachments to homework
 */
export async function add_homework_attachments(req, reply) {
    try {
        const { homework_id } = req.params;
        const { attachments } = req.body;

        if (!attachments || attachments.length === 0) {
            return reply.code(400).send({
                success: false,
                message: "attachments array is required"
            });
        }

        const result = await addHomeworkAttachments(homework_id, attachments);

        if (!result) {
            throw new Error("Failed to add attachments");
        }

        reply.send({
            success: true,
            message: "Attachments added successfully",
            data: result
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to add attachments"
        });
    }
}

/**
 * Remove attachment from homework
 */
export async function remove_homework_attachment(req, reply) {
    try {
        const { attachment_id } = req.params;

        const removed = await removeHomeworkAttachment(attachment_id);

        if (!removed) {
            return reply.code(404).send({
                success: false,
                message: "Attachment not found or unable to remove"
            });
        }

        reply.send({
            success: true,
            message: "Attachment removed successfully"
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to remove attachment"
        });
    }
}

/**
 * Add targets to homework
 */
export async function add_homework_targets(req, reply) {
    try {
        const { homework_id } = req.params;
        const { targets } = req.body;

        if (!targets || targets.length === 0) {
            return reply.code(400).send({
                success: false,
                message: "targets array is required"
            });
        }

        const result = await addHomeworkTargets(homework_id, targets);

        if (!result) {
            throw new Error("Failed to add targets");
        }

        reply.send({
            success: true,
            message: "Targets added successfully",
            data: result
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to add targets"
        });
    }
}

/**
 * Remove target from homework
 */
export async function remove_homework_target(req, reply) {
    try {
        const { target_id } = req.params;

        const removed = await removeHomeworkTarget(target_id);

        if (!removed) {
            return reply.code(404).send({
                success: false,
                message: "Target not found or unable to remove"
            });
        }

        reply.send({
            success: true,
            message: "Target removed successfully"
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to remove target"
        });
    }
}

/**
 * Get homework statistics for a teacher
 */
export async function get_homework_stats(req, reply) {
    try {
        const { teacher_id } = req.query;

        if (!teacher_id) {
            return reply.code(400).send({
                success: false,
                message: "teacher_id is required"
            });
        }

        const stats = await getHomeworkStatsByTeacher(teacher_id);

        reply.send({
            success: true,
            data: stats
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch homework statistics"
        });
    }
}

/**
 * Get upcoming homework
 */
export async function get_upcoming_homework(req, reply) {
    try {
        const { target_type, target_id, days } = req.query;

        if (!target_type || !target_id) {
            return reply.code(400).send({
                success: false,
                message: "target_type and target_id are required"
            });
        }

        const homework = await getUpcomingHomework({
            targetType: target_type,
            targetId: target_id,
            days: days ? parseInt(days) : 7
        });

        reply.send({
            success: true,
            data: homework,
            count: homework.length
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch upcoming homework"
        });
    }
}

/**
 * Get overdue homework
 */
export async function get_overdue_homework(req, reply) {
    try {
        const { target_type, target_id } = req.query;

        if (!target_type || !target_id) {
            return reply.code(400).send({
                success: false,
                message: "target_type and target_id are required"
            });
        }

        const homework = await getOverdueHomework({
            targetType: target_type,
            targetId: target_id
        });

        reply.send({
            success: true,
            data: homework,
            count: homework.length
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch overdue homework"
        });
    }
}

/**
 * Generate signed URL for homework attachment upload
 */
export async function generate_attachment_upload_url(req, reply) {
    try {
        let { homework_id, file_name, mime_type } = req.body;

        if (!file_name || !mime_type) {
            return reply.code(400).send({
                success: false,
                message: "file_name and mime_type are required"
            });
        }

        // Generate temporary ID if not provided
        if (!homework_id) {
            homework_id = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        }

        // Validate mime type for documents and images
        const allowedMimeTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain",
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",
            "image/tiff",
            "image/bmp",
            "image/ico"
        ];

        if (!allowedMimeTypes.includes(mime_type)) {
            return reply.code(400).send({
                success: false,
                message: "Invalid file type. Only PDF, Word, Excel, PowerPoint, text files, and images are allowed."
            });
        }

        const result = await generateDocumentUploadSignedUrl({
            entity: "homework",
            entityId: homework_id,
            fileName: file_name,
            mimeType: mime_type
        });

        reply.send({
            success: true,
            message: "Signed URL generated successfully",
            data: {
                homeworkId: homework_id,  // Return the homework_id (temp or provided)
                uploadUrl: result.uploadUrl,
                publicUrl: result.publicUrl,
                objectPath: result.objectPath
            }
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: err.message || "Unable to generate upload URL"
        });
    }
}
