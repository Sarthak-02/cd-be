import { getStudent } from "../../db/student.db.js";
import { getExamDetailsForStudent } from "../../db/exam.db.js";
import {
    getStudentReportGradesFlat,
    getStudentReportGradesBySubjectName,
    getStudentReportSummary,
    isGradeRowGraded,
    parseMaxGradePossibleFromGradingExtras
} from "../../db/studentReport.db.js";

function publicStudentSnippet(student) {
    return {
        student_id: student.student_id,
        name: [
            student.student_first_name,
            student.student_middle_name,
            student.student_last_name
        ]
            .filter(Boolean)
            .join(" "),
        admission_number: student.student_admission_no,
        roll_number: student.student_roll_no,
        campus_id: student.campus_id
    };
}

function mapGradeRow(g) {
    const gradingExtras = g.exam.gradingExtras ?? null;
    return {
        grade_id: g.id,
        exam_id: g.examId,
        exam_subject_id: g.examSubjectId,
        exam_name: g.exam.examType,
        subject_name: g.examSubject.subjectName,
        grading_type: g.exam.gradingType,
        grading_extras: gradingExtras,
        grades_obtained: g.gradesObtained,
        remarks: g.remarks,
        graded_by: g.gradedBy,
        graded_at: g.gradedAt,
        is_graded: isGradeRowGraded(g)
    };
}

async function assertStudentReportAccess(req, reply, studentId) {
    const student = await getStudent(studentId);
    if (!student) {
        reply.code(404).send({
            success: false,
            message: "Student not found"
        });
        return null;
    }

    const info = req.token_info;
    if (!info) {
        reply.code(401).send({
            success: false,
            message: "Unauthorized"
        });
        return null;
    }

    const role = info.role;

    if (role === "ADMIN") {
        return student;
    }

    if (role === "STUDENT") {
        if (info.userid !== studentId) {
            reply.code(403).send({
                success: false,
                message: "Forbidden"
            });
            return null;
        }
        return student;
    }

    if (role === "TEACHER") {
        const campusId = info.details?.campus_id;
        if (!campusId || campusId !== student.campus_id) {
            reply.code(403).send({
                success: false,
                message: "Forbidden"
            });
            return null;
        }
        return student;
    }

    reply.code(403).send({
        success: false,
        message: "Forbidden"
    });
    return null;
}

/**
 * GET .../students/:student_id/report/grades
 */
export async function student_report_grades_get(req, reply) {
    try {
        const { student_id } = req.params;
        const {
            exam_id = null,
            start_date = null,
            end_date = null,
            status = "all"
        } = req.query;

        const student = await assertStudentReportAccess(req, reply, student_id);
        if (!student) {
            return;
        }

        const grades = await getStudentReportGradesFlat({
            studentId: student_id,
            examId: exam_id,
            startDate: start_date,
            endDate: end_date,
            status
        });

        reply.send({
            success: true,
            data: {
                student: publicStudentSnippet(student),
                filters: {
                    exam_id,
                    start_date,
                    end_date,
                    status
                },
                items: grades.map(mapGradeRow),
                count: grades.length
            }
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch student grade report"
        });
    }
}

/**
 * GET .../students/:student_id/report/exams/:exam_id
 */
export async function student_report_exam_get(req, reply) {
    try {
        const { student_id, exam_id } = req.params;

        const student = await assertStudentReportAccess(req, reply, student_id);
        if (!student) {
            return;
        }

        const examDetails = await getExamDetailsForStudent({
            examId: exam_id,
            studentId: student_id
        });

        if (examDetails === null) {
            return reply.code(404).send({
                success: false,
                message: "Exam not found"
            });
        }

        if (examDetails.error === "STUDENT_NOT_ELIGIBLE") {
            return reply.code(403).send({
                success: false,
                message: examDetails.message
            });
        }

        reply.send({
            success: true,
            data: {
                student: publicStudentSnippet(student),
                ...examDetails
            }
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch exam report for student"
        });
    }
}

/**
 * GET .../students/:student_id/report/subjects
 */
export async function student_report_subjects_get(req, reply) {
    try {
        const { student_id } = req.params;
        const { subject_name, start_date = null, end_date = null } =
            req.query;

        const student = await assertStudentReportAccess(req, reply, student_id);
        if (!student) {
            return;
        }

        const grades = await getStudentReportGradesBySubjectName({
            studentId: student_id,
            subjectName: subject_name,
            startDate: start_date,
            endDate: end_date
        });

        reply.send({
            success: true,
            data: {
                student: publicStudentSnippet(student),
                subject_name: subject_name.trim(),
                filters: {
                    start_date,
                    end_date
                },
                items: grades.map(mapGradeRow),
                count: grades.length
            }
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch subject grade report"
        });
    }
}

/**
 * GET .../students/:student_id/report/summary
 */
export async function student_report_summary_get(req, reply) {
    try {
        const { student_id } = req.params;
        const { start_date = null, end_date = null } = req.query;

        const student = await assertStudentReportAccess(req, reply, student_id);
        if (!student) {
            return;
        }

        const summary = await getStudentReportSummary({
            studentId: student_id,
            startDate: start_date,
            endDate: end_date
        });

        reply.send({
            success: true,
            data: {
                student: publicStudentSnippet(student),
                ...summary
            }
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch student report summary"
        });
    }
}
