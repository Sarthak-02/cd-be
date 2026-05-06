import { getTeacher } from "../../db/teacher.db.js";
import {
    getTeacherReportSections,
    getSectionReportGradesFlat,
    getSectionReportSummary,
    getSectionExamReport
} from "../../db/teacherReport.db.js";
import { isGradeRowGraded } from "../../db/studentReport.db.js";

function mapGradeRow(g) {
    return {
        grade_id: g.id,
        exam_id: g.examId,
        exam_subject_id: g.examSubjectId,
        exam_name: g.exam.examType,
        subject_name: g.examSubject.subjectName,
        grading_type: g.exam.gradingType,
        grading_extras: g.exam.gradingExtras ?? null,
        grades_obtained: g.gradesObtained,
        remarks: g.remarks,
        graded_by: g.gradedBy,
        graded_at: g.gradedAt,
        is_graded: isGradeRowGraded(g),
        student: {
            student_id: g.student.student_id,
            name: [
                g.student.student_first_name,
                g.student.student_middle_name,
                g.student.student_last_name
            ]
                .filter(Boolean)
                .join(" "),
            admission_number: g.student.student_admission_no,
            roll_number: g.student.student_roll_no
        }
    };
}

async function assertTeacherSectionAccess(req, reply, teacherId, sectionId) {
    const teacher = await getTeacher(teacherId);
    if (!teacher) {
        reply.code(404).send({ success: false, message: "Teacher not found" });
        return null;
    }

    const info = req.token_info;
    if (!info) {
        reply.code(401).send({ success: false, message: "Unauthorized" });
        return null;
    }

    const role = info.role;

    if (role === "ADMIN") {
        if (sectionId) {
            const sectionIds = teacher.extras?.teacher_sections ?? [];
            if (!sectionIds.includes(sectionId)) {
                reply.code(404).send({
                    success: false,
                    message: "Section not assigned to this teacher"
                });
                return null;
            }
        }
        return teacher;
    }

    if (role === "TEACHER") {
        if (info.userid !== teacherId) {
            reply.code(403).send({ success: false, message: "Forbidden" });
            return null;
        }
        if (sectionId) {
            const sectionIds = teacher.extras?.teacher_sections ?? [];
            if (!sectionIds.includes(sectionId)) {
                reply.code(403).send({
                    success: false,
                    message: "Section not assigned to this teacher"
                });
                return null;
            }
        }
        return teacher;
    }

    reply.code(403).send({ success: false, message: "Forbidden" });
    return null;
}

/**
 * GET .../teachers/:teacher_id/report/sections
 */
export async function teacher_report_sections_get(req, reply) {
    try {
        const { teacher_id } = req.params;

        const teacher = await assertTeacherSectionAccess(req, reply, teacher_id, null);
        if (!teacher) return;

        const sections = await getTeacherReportSections(teacher);

        reply.send({
            success: true,
            data: {
                teacher_id,
                sections,
                count: sections.length
            }
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch teacher sections"
        });
    }
}

/**
 * GET .../teachers/:teacher_id/report/sections/:section_id/summary
 */
export async function teacher_report_section_summary_get(req, reply) {
    try {
        const { teacher_id, section_id } = req.params;
        const { start_date = null, end_date = null } = req.query;

        const teacher = await assertTeacherSectionAccess(req, reply, teacher_id, section_id);
        if (!teacher) return;

        const summary = await getSectionReportSummary({
            sectionId: section_id,
            startDate: start_date,
            endDate: end_date
        });

        reply.send({
            success: true,
            data: summary
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch section report summary"
        });
    }
}

/**
 * GET .../teachers/:teacher_id/report/sections/:section_id/grades
 */
export async function teacher_report_section_grades_get(req, reply) {
    try {
        const { teacher_id, section_id } = req.params;
        const {
            exam_id = null,
            start_date = null,
            end_date = null,
            status = "all"
        } = req.query;

        const teacher = await assertTeacherSectionAccess(req, reply, teacher_id, section_id);
        if (!teacher) return;

        const grades = await getSectionReportGradesFlat({
            sectionId: section_id,
            examId: exam_id,
            startDate: start_date,
            endDate: end_date,
            status
        });

        reply.send({
            success: true,
            data: {
                section_id,
                filters: { exam_id, start_date, end_date, status },
                items: grades.map(mapGradeRow),
                count: grades.length
            }
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch section grade report"
        });
    }
}

/**
 * GET .../teachers/:teacher_id/report/sections/:section_id/exams/:exam_id
 */
export async function teacher_report_section_exam_get(req, reply) {
    try {
        const { teacher_id, section_id, exam_id } = req.params;

        const teacher = await assertTeacherSectionAccess(req, reply, teacher_id, section_id);
        if (!teacher) return;

        const report = await getSectionExamReport({
            sectionId: section_id,
            examId: exam_id
        });

        if (!report.exam) {
            return reply.code(404).send({
                success: false,
                message: "No grades found for this exam in the section"
            });
        }

        reply.send({
            success: true,
            data: report
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({
            success: false,
            message: "Unable to fetch section exam report"
        });
    }
}
