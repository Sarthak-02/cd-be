import {
    upsertExamGrade,
    bulkUpsertExamGrades,
    getGradesByExam,
    getGradesByExamSubject,
    getGradesByStudent,
    getGradeById,
    updateExamGrade,
    deleteExamGrade,
    deleteGradesByExamSubject,
    getExamGradeStatistics,
    getStudentExamReport
} from "../../db/examGrade.db.js";

/**
 * Create or update a single exam grade
 */
export async function upsert_exam_grade(req, reply) {
    try {
        const {
            exam_id,
            exam_subject_id,
            student_id,
            grades_obtained,
            remarks,
            graded_by
        } = req.body;

        if (!exam_id || !exam_subject_id || !student_id) {
            return reply.code(400).send({
                success: false,
                message: "exam_id, exam_subject_id, and student_id are required"
            });
        }

        const grade = await upsertExamGrade({
            examId: exam_id,
            examSubjectId: exam_subject_id,
            studentId: student_id,
            gradesObtained: grades_obtained,
            remarks,
            gradedBy: graded_by
        });

        reply.send({
            success: true,
            message: "Grade saved successfully",
            data: grade
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: err.message || "Unable to save grade"
        });
    }
}

/**
 * Bulk create or update exam grades
 */
export async function bulk_upsert_exam_grades(req, reply) {
    try {
        const { grades } = req.body;

        if (!grades || !Array.isArray(grades) || grades.length === 0) {
            return reply.code(400).send({
                success: false,
                message: "grades array is required and must not be empty"
            });
        }

        // Validate each grade object
        for (const grade of grades) {
            if (!grade.exam_id || !grade.exam_subject_id || !grade.student_id) {
                return reply.code(400).send({
                    success: false,
                    message: "Each grade must have exam_id, exam_subject_id, and student_id"
                });
            }
        }

        const mappedGrades = grades.map(grade => ({
            examId: grade.exam_id,
            examSubjectId: grade.exam_subject_id,
            studentId: grade.student_id,
            gradesObtained: grade.grades_obtained,
            remarks: grade.remarks,
            gradedBy: grade.graded_by
        }));

        const results = await bulkUpsertExamGrades(mappedGrades);

        reply.send({
            success: true,
            message: `${results.length} grades saved successfully`,
            data: results
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: err.message || "Unable to save grades"
        });
    }
}

/**
 * Get all grades for a specific exam
 */
export async function get_grades_by_exam(req, reply) {
    try {
        const { exam_id } = req.params;

        const grades = await getGradesByExam(exam_id);

        reply.send({
            success: true,
            data: grades,
            count: grades.length
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch grades"
        });
    }
}

/**
 * Get all grades for a specific exam subject
 */
export async function get_grades_by_exam_subject(req, reply) {
    try {
        const { exam_subject_id } = req.params;

        const grades = await getGradesByExamSubject(exam_subject_id);

        reply.send({
            success: true,
            data: grades,
            count: grades.length
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch grades"
        });
    }
}

/**
 * Get all grades for a specific student
 */
export async function get_grades_by_student(req, reply) {
    try {
        const { student_id, exam_id, start_date, end_date } = req.query;

        if (!student_id) {
            return reply.code(400).send({
                success: false,
                message: "student_id is required"
            });
        }

        const grades = await getGradesByStudent({
            studentId: student_id,
            examId: exam_id,
            startDate: start_date,
            endDate: end_date
        });

        reply.send({
            success: true,
            data: grades,
            count: grades.length
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch grades"
        });
    }
}

/**
 * Get a specific grade by ID
 */
export async function get_grade_by_id(req, reply) {
    try {
        const { grade_id } = req.params;

        const grade = await getGradeById(grade_id);

        if (!grade) {
            return reply.code(404).send({
                success: false,
                message: "Grade not found"
            });
        }

        reply.send({
            success: true,
            data: grade
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch grade"
        });
    }
}

/**
 * Update an existing exam grade
 */
export async function update_exam_grade(req, reply) {
    try {
        const { grade_id } = req.params;
        const { grades_obtained, remarks, graded_by } = req.body;

        // Validate that at least one field is being updated
        if (grades_obtained === undefined && remarks === undefined && graded_by === undefined) {
            return reply.code(400).send({
                success: false,
                message: "At least one field must be provided for update"
            });
        }

        const grade = await updateExamGrade({
            gradeId: grade_id,
            gradesObtained: grades_obtained,
            remarks,
            gradedBy: graded_by
        });

        reply.send({
            success: true,
            message: "Grade updated successfully",
            data: grade
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: err.message || "Unable to update grade"
        });
    }
}

/**
 * Delete an exam grade
 */
export async function delete_exam_grade(req, reply) {
    try {
        const { grade_id } = req.params;

        const deleted = await deleteExamGrade(grade_id);

        if (!deleted) {
            return reply.code(404).send({
                success: false,
                message: "Grade not found or unable to delete"
            });
        }

        reply.send({
            success: true,
            message: "Grade deleted successfully"
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to delete grade"
        });
    }
}

/**
 * Delete all grades for a specific exam subject
 */
export async function delete_grades_by_exam_subject(req, reply) {
    try {
        const { exam_subject_id } = req.params;

        const count = await deleteGradesByExamSubject(exam_subject_id);

        reply.send({
            success: true,
            message: `${count} grades deleted successfully`,
            deletedCount: count
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to delete grades"
        });
    }
}

/**
 * Get grade statistics for an exam
 */
export async function get_exam_grade_statistics(req, reply) {
    try {
        const { exam_id } = req.params;

        const stats = await getExamGradeStatistics(exam_id);

        if (!stats) {
            return reply.code(404).send({
                success: false,
                message: "Unable to fetch statistics"
            });
        }

        reply.send({
            success: true,
            data: stats
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch grade statistics"
        });
    }
}

/**
 * Get student's grade report for an exam (all subjects)
 */
export async function get_student_exam_report(req, reply) {
    try {
        const { student_id, exam_id } = req.query;

        if (!student_id || !exam_id) {
            return reply.code(400).send({
                success: false,
                message: "student_id and exam_id are required"
            });
        }

        const grades = await getStudentExamReport({
            studentId: student_id,
            examId: exam_id
        });

        reply.send({
            success: true,
            data: grades,
            count: grades.length
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch student exam report"
        });
    }
}
