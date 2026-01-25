import {
    createExam,
    getExamById,
    getExamsByCampus,
    getExamsByTeacher,
    getExamsByTarget,
    getExamsForStudent,
    updateExam,
    completeExam,
    deleteExam,
    addExamSubjects,
    updateExamSubject,
    removeExamSubject,
    addExamTargets,
    removeExamTarget,
    getExamStatsByCampus,
    getUpcomingExams,
    getOngoingExams
} from "../../db/exam.db.js";
import { publishExamAndNotify, notifyExamUpdate, sendExamReminder } from "../../services/app/examNotify.service.js";

/**
 * Create new exam
 */
export async function create_exam(req, reply) {
    try {
        const data = req.body;
        const {
            exam_type,
            target,
            grading_type,
            grading_extras,
            teacher_id,
            campus_id,
            subjects = [],
            targets = [],
            publish = false
        } = data;

        if (!exam_type || !target || !teacher_id || !campus_id) {
            return reply.code(400).send({
                success: false,
                message: "exam_type, target, teacher_id, and campus_id are required"
            });
        }

        if (!subjects || subjects.length === 0) {
            return reply.code(400).send({
                success: false,
                message: "At least one subject is required"
            });
        }

        if (!targets || targets.length === 0) {
            return reply.code(400).send({
                success: false,
                message: "At least one target is required"
            });
        }

        const exam = await createExam({
            examType: exam_type,
            target,
            gradingType: grading_type,
            gradingExtras: grading_extras,
            createdBy: teacher_id,
            campusId: campus_id,
            subjects,
            targets
        });

        if (!exam) {
            throw new Error("Failed to create exam");
        }

        // If publish flag is true, publish immediately and send notifications
        if (publish) {
            const publishResult = await publishExamAndNotify({
                examId: exam.id,
                triggeredByTeacherId: teacher_id
            });

            if (!publishResult.ok) {
                throw new Error("Failed to publish exam and send notifications");
            }

            // Fetch updated exam after publishing
            const updatedExam = await getExamById(exam.id);

            return reply.send({
                success: true,
                message: "Exam created and published successfully",
                data: updatedExam,
                notificationStats: {
                    queuedCount: publishResult.queuedCount,
                    studentCount: publishResult.studentCount
                }
            });
        }

        reply.send({
            success: true,
            message: "Exam created successfully",
            data: exam
        });
    } catch (err) {
        console.error("Controller error creating exam:");
        console.error("Error name:", err.name);
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
        if (err.code) console.error("Error code:", err.code);
        if (err.meta) console.error("Error meta:", err.meta);
        
        reply.code(500).send({
            success: false,
            message: err.message || "Unable to create exam",
            ...(process.env.NODE_ENV === 'development' && { 
                error: {
                    name: err.name,
                    message: err.message,
                    code: err.code,
                    meta: err.meta
                }
            })
        });
    }
}

/**
 * Get exam by ID
 */
export async function get_exam_by_id(req, reply) {
    try {
        const { exam_id } = req.params;

        const exam = await getExamById(exam_id);

        if (!exam) {
            return reply.code(404).send({
                success: false,
                message: "Exam not found"
            });
        }

        reply.send({
            success: true,
            data: exam
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch exam"
        });
    }
}

/**
 * Get all exams for a campus
 */
export async function get_exams_by_campus(req, reply) {
    try {
        const { campus_id, status, exam_type, start_date, end_date, limit, offset } = req.query;

        if (!campus_id) {
            return reply.code(400).send({
                success: false,
                message: "campus_id is required"
            });
        }

        const exams = await getExamsByCampus({
            campusId: campus_id,
            status,
            examType: exam_type,
            startDate: start_date,
            endDate: end_date,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0
        });

        reply.send({
            success: true,
            data: exams,
            count: exams.length
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch exams"
        });
    }
}

/**
 * Get all exams created by a teacher
 */
export async function get_exams_by_teacher(req, reply) {
    try {
        const { teacher_id, status, start_date, end_date, limit, offset } = req.query;

        if (!teacher_id) {
            return reply.code(400).send({
                success: false,
                message: "teacher_id is required"
            });
        }

        const exams = await getExamsByTeacher({
            teacherId: teacher_id,
            status,
            startDate: start_date,
            endDate: end_date,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0
        });

        reply.send({
            success: true,
            data: exams,
            count: exams.length
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch exams"
        });
    }
}

/**
 * Get exams for a specific target (student/section/school)
 */
export async function get_exams_by_target(req, reply) {
    try {
        const { target_type, target_id, status, start_date, end_date, limit, offset } = req.query;

        if (!target_type || !target_id) {
            return reply.code(400).send({
                success: false,
                message: "target_type and target_id are required"
            });
        }

        const exams = await getExamsByTarget({
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
            data: exams,
            count: exams.length
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch exams"
        });
    }
}

/**
 * Get exams for a student
 */
export async function get_exams_for_student(req, reply) {
    try {
        const { student_id, status, start_date, end_date, limit, offset } = req.query;

        if (!student_id) {
            return reply.code(400).send({
                success: false,
                message: "student_id is required"
            });
        }

        const exams = await getExamsForStudent({
            studentId: student_id,
            status: status || "PUBLISHED",
            startDate: start_date,
            endDate: end_date,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0
        });

        reply.send({
            success: true,
            data: exams,
            count: exams.length
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch exams"
        });
    }
}

/**
 * Update exam (comprehensive update like create)
 */
export async function update_exam(req, reply) {
    try {
        const { exam_id } = req.params;
        const { 
            exam_type, 
            target, 
            grading_type, 
            grading_extras,
            subjects,
            targets
        } = req.body;

        // Validate that at least one field is being updated
        if (!exam_type && !target && !grading_type && grading_extras === undefined && !subjects && !targets) {
            return reply.code(400).send({
                success: false,
                message: "At least one field must be provided for update"
            });
        }

        // If subjects are provided, validate them
        if (subjects !== undefined) {
            if (!Array.isArray(subjects)) {
                return reply.code(400).send({
                    success: false,
                    message: "subjects must be an array"
                });
            }
            
            if (subjects.length === 0) {
                return reply.code(400).send({
                    success: false,
                    message: "At least one subject is required"
                });
            }
        }

        // If targets are provided, validate them
        if (targets !== undefined) {
            if (!Array.isArray(targets)) {
                return reply.code(400).send({
                    success: false,
                    message: "targets must be an array"
                });
            }
            
            if (targets.length === 0) {
                return reply.code(400).send({
                    success: false,
                    message: "At least one target is required"
                });
            }
        }

        const exam = await updateExam({
            examId: exam_id,
            examType: exam_type,
            target,
            gradingType: grading_type,
            gradingExtras: grading_extras,
            subjects: subjects !== undefined ? subjects : null,
            targets: targets !== undefined ? targets : null
        });

        if (!exam) {
            return reply.code(404).send({
                success: false,
                message: "Exam not found or unable to update"
            });
        }

        reply.send({
            success: true,
            message: "Exam updated successfully",
            data: exam
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: err.message || "Unable to update exam"
        });
    }
}

/**
 * Publish exam and send notifications
 */
export async function publish_exam(req, reply) {
    try {
        const { exam_id } = req.params;
        const { teacher_id } = req.body;

        if (!teacher_id) {
            return reply.code(400).send({
                success: false,
                message: "teacher_id is required"
            });
        }

        // Publish exam and send notifications
        const result = await publishExamAndNotify({
            examId: exam_id,
            triggeredByTeacherId: teacher_id
        });

        if (!result.ok) {
            throw new Error("Failed to publish exam and send notifications");
        }

        // Fetch updated exam
        const exam = await getExamById(exam_id);

        reply.send({
            success: true,
            message: "Exam published and notifications sent successfully",
            data: exam,
            notificationStats: {
                queuedCount: result.queuedCount,
                studentCount: result.studentCount
            }
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: err.message || "Unable to publish exam"
        });
    }
}

/**
 * Complete exam and optionally notify
 */
export async function complete_exam(req, reply) {
    try {
        const { exam_id } = req.params;
        const { teacher_id, notify = false } = req.body;

        if (!teacher_id) {
            return reply.code(400).send({
                success: false,
                message: "teacher_id is required"
            });
        }

        const exam = await completeExam(exam_id);

        if (!exam) {
            return reply.code(404).send({
                success: false,
                message: "Exam not found or unable to complete"
            });
        }

        // Optionally send completion notification
        let notificationStats = null;
        if (notify) {
            const result = await notifyExamUpdate({
                examId: exam_id,
                triggeredByTeacherId: teacher_id,
                updateType: "COMPLETED"
            });

            notificationStats = {
                queuedCount: result.queuedCount
            };
        }

        reply.send({
            success: true,
            message: "Exam completed successfully",
            data: exam,
            notificationStats
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: err.message || "Unable to complete exam"
        });
    }
}

/**
 * Delete exam (only DRAFT)
 */
export async function delete_exam(req, reply) {
    try {
        const { exam_id } = req.params;

        const deleted = await deleteExam(exam_id);

        if (!deleted) {
            return reply.code(400).send({
                success: false,
                message: "Unable to delete exam. Only DRAFT exams can be deleted."
            });
        }

        reply.send({
            success: true,
            message: "Exam deleted successfully"
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to delete exam"
        });
    }
}

/**
 * Add subjects to exam
 */
export async function add_exam_subjects(req, reply) {
    try {
        const { exam_id } = req.params;
        const { subjects } = req.body;

        if (!subjects || subjects.length === 0) {
            return reply.code(400).send({
                success: false,
                message: "subjects array is required"
            });
        }

        const result = await addExamSubjects(exam_id, subjects);

        if (!result) {
            throw new Error("Failed to add subjects");
        }

        reply.send({
            success: true,
            message: "Subjects added successfully",
            data: result
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to add subjects"
        });
    }
}

/**
 * Update exam subject
 */
export async function update_exam_subject(req, reply) {
    try {
        const { subject_id } = req.params;
        const { subject_name, exam_date, exam_start_time, exam_end_time, extras } = req.body;

        const subject = await updateExamSubject({
            subjectId: subject_id,
            subjectName: subject_name,
            examDate: exam_date,
            examStartTime: exam_start_time,
            examEndTime: exam_end_time,
            extras
        });

        if (!subject) {
            return reply.code(404).send({
                success: false,
                message: "Subject not found or unable to update"
            });
        }

        reply.send({
            success: true,
            message: "Subject updated successfully",
            data: subject
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to update subject"
        });
    }
}

/**
 * Remove subject from exam
 */
export async function remove_exam_subject(req, reply) {
    try {
        const { subject_id } = req.params;

        const removed = await removeExamSubject(subject_id);

        if (!removed) {
            return reply.code(404).send({
                success: false,
                message: "Subject not found or unable to remove"
            });
        }

        reply.send({
            success: true,
            message: "Subject removed successfully"
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to remove subject"
        });
    }
}

/**
 * Add targets to exam
 */
export async function add_exam_targets(req, reply) {
    try {
        const { exam_id } = req.params;
        const { targets } = req.body;

        if (!targets || targets.length === 0) {
            return reply.code(400).send({
                success: false,
                message: "targets array is required"
            });
        }

        const result = await addExamTargets(exam_id, targets);

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
 * Remove target from exam
 */
export async function remove_exam_target(req, reply) {
    try {
        const { target_id } = req.params;

        const removed = await removeExamTarget(target_id);

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
 * Get exam statistics for a campus
 */
export async function get_exam_stats(req, reply) {
    try {
        const { campus_id } = req.query;

        if (!campus_id) {
            return reply.code(400).send({
                success: false,
                message: "campus_id is required"
            });
        }

        const stats = await getExamStatsByCampus(campus_id);

        reply.send({
            success: true,
            data: stats
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch exam statistics"
        });
    }
}

/**
 * Get upcoming exams
 */
export async function get_upcoming_exams(req, reply) {
    try {
        const { target_type, target_id, days } = req.query;

        if (!target_type || !target_id) {
            return reply.code(400).send({
                success: false,
                message: "target_type and target_id are required"
            });
        }

        const exams = await getUpcomingExams({
            targetType: target_type,
            targetId: target_id,
            days: days ? parseInt(days) : 7
        });

        reply.send({
            success: true,
            data: exams,
            count: exams.length
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch upcoming exams"
        });
    }
}

/**
 * Get ongoing exams (today)
 */
export async function get_ongoing_exams(req, reply) {
    try {
        const { target_type, target_id } = req.query;

        if (!target_type || !target_id) {
            return reply.code(400).send({
                success: false,
                message: "target_type and target_id are required"
            });
        }

        const exams = await getOngoingExams({
            targetType: target_type,
            targetId: target_id
        });

        reply.send({
            success: true,
            data: exams,
            count: exams.length
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch ongoing exams"
        });
    }
}

/**
 * Send exam reminder notification
 */
export async function send_exam_reminder(req, reply) {
    try {
        const { exam_id } = req.params;
        const { teacher_id } = req.body;

        if (!teacher_id) {
            return reply.code(400).send({
                success: false,
                message: "teacher_id is required"
            });
        }

        const result = await sendExamReminder({
            examId: exam_id,
            triggeredByTeacherId: teacher_id
        });

        if (!result.ok) {
            throw new Error("Failed to send exam reminder");
        }

        reply.send({
            success: true,
            message: "Exam reminder sent successfully",
            notificationStats: {
                queuedCount: result.queuedCount
            }
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: err.message || "Unable to send exam reminder"
        });
    }
}
