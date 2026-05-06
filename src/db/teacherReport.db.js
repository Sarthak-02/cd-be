import { prisma } from "../prisma/prisma.js";
import { isGradeRowGraded } from "./studentReport.db.js";

async function getSectionWithClass(sectionId) {
    return prisma.section.findUnique({
        where: { section_id: sectionId },
        select: {
            section_id: true,
            section_name: true,
            classRef: {
                select: {
                    class_id: true,
                    class_name: true
                }
            }
        }
    });
}

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
        roll_number: student.student_roll_no
    };
}

function formatSection(section) {
    if (!section) return null;
    return {
        section_id: section.section_id,
        section_name: section.section_name,
        class_id: section.classRef?.class_id ?? null,
        class_name: section.classRef?.class_name ?? null
    };
}

const gradeInclude = {
    student: {
        select: {
            student_id: true,
            student_first_name: true,
            student_middle_name: true,
            student_last_name: true,
            student_roll_no: true,
            student_admission_no: true
        }
    },
    examSubject: {
        select: {
            id: true,
            subjectName: true,
            examDate: true,
            examStartTime: true,
            examEndTime: true
        }
    },
    exam: {
        select: {
            id: true,
            examType: true,
            status: true,
            gradingType: true,
            gradingExtras: true
        }
    }
};

/**
 * List sections assigned to a teacher with student counts.
 */
export async function getTeacherReportSections(teacher) {
    const sectionIds = teacher.extras?.teacher_sections ?? [];
    if (sectionIds.length === 0) return [];

    const sections = await prisma.section.findMany({
        where: { section_id: { in: sectionIds } },
        select: {
            section_id: true,
            section_name: true,
            classRef: {
                select: { class_id: true, class_name: true }
            },
            _count: {
                select: {
                    students: {
                        where: { student_current_status: "active" }
                    }
                }
            }
        },
        orderBy: { section_name: "asc" }
    });

    return sections.map((s) => ({
        section_id: s.section_id,
        section_name: s.section_name,
        class_id: s.classRef?.class_id ?? null,
        class_name: s.classRef?.class_name ?? null,
        active_student_count: s._count.students
    }));
}

/**
 * Flat grade rows for all active students in a section, with optional filters.
 */
export async function getSectionReportGradesFlat({
    sectionId,
    examId = null,
    startDate = null,
    endDate = null,
    status = "all"
}) {
    const where = {
        student: {
            student_section_id: sectionId,
            student_current_status: "active"
        }
    };

    if (examId) where.examId = examId;
    if (status === "graded") where.gradesObtained = { not: null };
    else if (status === "pending") where.gradesObtained = null;

    if (startDate || endDate) {
        where.examSubject = { examDate: {} };
        if (startDate) where.examSubject.examDate.gte = new Date(startDate);
        if (endDate) where.examSubject.examDate.lte = new Date(endDate);
    }

    return prisma.examGrade.findMany({
        where,
        include: gradeInclude,
        orderBy: [
            { examSubject: { examDate: "desc" } },
            { student: { student_roll_no: "asc" } }
        ]
    });
}

/**
 * Per-student grade summary for all active students in a section.
 */
export async function getSectionReportSummary({
    sectionId,
    startDate = null,
    endDate = null
}) {
    const section = await getSectionWithClass(sectionId);

    const where = {
        student: {
            student_section_id: sectionId,
            student_current_status: "active"
        }
    };

    if (startDate || endDate) {
        where.examSubject = { examDate: {} };
        if (startDate) where.examSubject.examDate.gte = new Date(startDate);
        if (endDate) where.examSubject.examDate.lte = new Date(endDate);
    }

    const grades = await prisma.examGrade.findMany({
        where,
        include: {
            student: {
                select: {
                    student_id: true,
                    student_first_name: true,
                    student_middle_name: true,
                    student_last_name: true,
                    student_roll_no: true,
                    student_admission_no: true
                }
            },
            examSubject: {
                select: { id: true, subjectName: true, examDate: true }
            },
            exam: {
                select: { id: true, examType: true, status: true }
            }
        }
    });

    const studentMap = new Map();
    for (const g of grades) {
        const sid = g.studentId;
        if (!studentMap.has(sid)) {
            studentMap.set(sid, { student: g.student, grades: [] });
        }
        studentMap.get(sid).grades.push(g);
    }

    const students = [...studentMap.values()].map(
        ({ student, grades: sGrades }) => {
            const examIds = [...new Set(sGrades.map((g) => g.examId))];
            const subjectNames = new Set(
                sGrades.map((g) => g.examSubject.subjectName)
            );
            const gradedCount = sGrades.filter(isGradeRowGraded).length;

            const byExam = examIds.map((eid) => {
                const rows = sGrades.filter((g) => g.examId === eid);
                const meta = rows[0]?.exam;
                return {
                    exam_id: eid,
                    exam_type: meta?.examType ?? null,
                    exam_status: meta?.status ?? null,
                    graded_subjects: rows.filter(isGradeRowGraded).length,
                    total_subjects: rows.length
                };
            });

            const bySubjectMap = new Map();
            for (const g of sGrades) {
                const name = g.examSubject.subjectName;
                if (!bySubjectMap.has(name)) {
                    bySubjectMap.set(name, { attempts: 0, graded_attempts: 0 });
                }
                const e = bySubjectMap.get(name);
                e.attempts += 1;
                if (isGradeRowGraded(g)) e.graded_attempts += 1;
            }

            const bySubject = [...bySubjectMap.entries()]
                .map(([subject_name, v]) => ({
                    subject_name,
                    attempts: v.attempts,
                    graded_attempts: v.graded_attempts
                }))
                .sort((a, b) => a.subject_name.localeCompare(b.subject_name));

            return {
                ...publicStudentSnippet(student),
                exams: {
                    distinct_exam_count: examIds.length,
                    grade_rows_total: sGrades.length
                },
                subjects: {
                    distinct_subject_name_count: subjectNames.size,
                    graded_count: gradedCount,
                    pending_count: sGrades.length - gradedCount
                },
                by_exam: byExam,
                by_subject: bySubject
            };
        }
    );

    students.sort((a, b) =>
        (a.roll_number || "").localeCompare(b.roll_number || "")
    );

    const totalGrades = grades.length;
    const gradedTotal = grades.filter(isGradeRowGraded).length;

    return {
        section: formatSection(section),
        period: { start_date: startDate ?? null, end_date: endDate ?? null },
        students,
        aggregate: {
            total_students: students.length,
            total_grade_rows: totalGrades,
            graded_count: gradedTotal,
            pending_count: totalGrades - gradedTotal
        }
    };
}

/**
 * Full exam breakdown for all active students in a section.
 */
export async function getSectionExamReport({ sectionId, examId }) {
    const section = await getSectionWithClass(sectionId);

    const grades = await prisma.examGrade.findMany({
        where: {
            examId,
            student: {
                student_section_id: sectionId,
                student_current_status: "active"
            }
        },
        include: gradeInclude,
        orderBy: [
            { student: { student_roll_no: "asc" } },
            { examSubject: { examDate: "asc" } }
        ]
    });

    if (grades.length === 0) {
        return {
            section: formatSection(section),
            exam: null,
            students: [],
            aggregate: { total_students: 0, total_grade_rows: 0, graded_count: 0, pending_count: 0 }
        };
    }

    const examMeta = grades[0].exam;

    const studentMap = new Map();
    for (const g of grades) {
        const sid = g.studentId;
        if (!studentMap.has(sid)) {
            studentMap.set(sid, { student: g.student, grades: [] });
        }
        studentMap.get(sid).grades.push(g);
    }

    const students = [...studentMap.values()].map(({ student, grades: sGrades }) => ({
        ...publicStudentSnippet(student),
        graded_count: sGrades.filter(isGradeRowGraded).length,
        total_subjects: sGrades.length,
        grades: sGrades.map((g) => ({
            grade_id: g.id,
            exam_subject_id: g.examSubjectId,
            subject_name: g.examSubject.subjectName,
            exam_date: g.examSubject.examDate,
            grades_obtained: g.gradesObtained,
            remarks: g.remarks,
            graded_by: g.gradedBy,
            graded_at: g.gradedAt,
            is_graded: isGradeRowGraded(g)
        }))
    }));

    const totalGrades = grades.length;
    const gradedCount = grades.filter(isGradeRowGraded).length;

    return {
        section: formatSection(section),
        exam: {
            id: examMeta.id,
            exam_type: examMeta.examType,
            status: examMeta.status,
            grading_type: examMeta.gradingType,
            grading_extras: examMeta.gradingExtras
        },
        students,
        aggregate: {
            total_students: students.length,
            total_grade_rows: totalGrades,
            graded_count: gradedCount,
            pending_count: totalGrades - gradedCount
        }
    };
}
