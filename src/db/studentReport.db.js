import { prisma } from "../prisma/prisma.js";
import { getGradesByStudent } from "./examGrade.db.js";

export function isGradeRowGraded(g) {
    return (
        g.gradesObtained != null && String(g.gradesObtained).trim() !== ""
    );
}

/**
 * Best-effort max points / cap from Exam.gradingExtras (Json).
 * Supports common top-level keys and simple nested shapes.
 */
export function parseMaxGradePossibleFromGradingExtras(gradingExtras) {
    if (gradingExtras == null || typeof gradingExtras !== "object") {
        return null;
    }
    const ex = gradingExtras;
    const candidates = [
        ex.max_marks,
        ex.maxMarks,
        ex.maximum_marks,
        ex.total_marks,
        ex.totalMarks,
        ex.max_grade,
        ex.maxGrade,
        ex.maximum,
        ex.max,
        ex.marks?.max,
        ex.marks?.total,
        ex.per_subject_max_marks,
        ex.perSubjectMaxMarks
    ];
    for (const v of candidates) {
        if (v != null && v !== "" && Number.isFinite(Number(v))) {
            const n = Number(v);
            if (n >= 0) {
                return n;
            }
        }
    }
    return null;
}

/**
 * Flat grade rows for a student with optional filters (reuses examGrade query).
 */
export async function getStudentReportGradesFlat({
    studentId,
    examId = null,
    startDate = null,
    endDate = null,
    status = "all"
}) {
    return getGradesByStudent({ studentId, examId, startDate, endDate, status });
}

/**
 * All grade rows for a student in a given subject name (case-insensitive).
 */
export async function getStudentReportGradesBySubjectName({
    studentId,
    subjectName,
    startDate = null,
    endDate = null
}) {
    const name = subjectName.trim();
    if (!name) {
        return [];
    }

    const examSubjectFilter = {
        subjectName: { equals: name, mode: "insensitive" }
    };

    if (startDate || endDate) {
        examSubjectFilter.examDate = {};
        if (startDate) {
            examSubjectFilter.examDate.gte = new Date(startDate);
        }
        if (endDate) {
            examSubjectFilter.examDate.lte = new Date(endDate);
        }
    }

    return prisma.examGrade.findMany({
        where: {
            studentId,
            examSubject: examSubjectFilter
        },
        include: {
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
        },
        orderBy: {
            examSubject: {
                examDate: "desc"
            }
        }
    });
}

/**
 * Aggregated reporting stats for a student (from existing ExamGrade rows).
 */
export async function getStudentReportSummary({
    studentId,
    startDate = null,
    endDate = null
}) {
    const whereClause = { studentId };

    if (startDate || endDate) {
        whereClause.examSubject = {
            examDate: {}
        };
        if (startDate) {
            whereClause.examSubject.examDate.gte = new Date(startDate);
        }
        if (endDate) {
            whereClause.examSubject.examDate.lte = new Date(endDate);
        }
    }

    const grades = await prisma.examGrade.findMany({
        where: whereClause,
        include: {
            examSubject: {
                select: {
                    id: true,
                    subjectName: true,
                    examDate: true
                }
            },
            exam: {
                select: {
                    id: true,
                    examType: true,
                    status: true
                }
            }
        }
    });

    const examIds = [...new Set(grades.map((g) => g.examId))];
    const subjectNames = new Set(
        grades.map((g) => g.examSubject.subjectName)
    );

    const subjectCountRows = await prisma.examSubject.groupBy({
        by: ["examId"],
        where: { examId: { in: examIds } },
        _count: { id: true }
    });
    const subjectCountMap = new Map(subjectCountRows.map((r) => [r.examId, r._count.id]));

    const byExam = examIds.map((examId) => {
        const totalSubjects = subjectCountMap.get(examId) ?? 0;
        const rows = grades.filter((g) => g.examId === examId);
        const gradedSubjects = rows.filter(isGradeRowGraded).length;
        const examMeta = rows[0]?.exam;
        return {
            exam_id: examId,
            exam_type: examMeta?.examType ?? null,
            exam_status: examMeta?.status ?? null,
            grade_rows: rows.length,
            graded_subjects: gradedSubjects,
            total_subjects_in_exam: totalSubjects,
            completion_percentage:
                totalSubjects > 0
                    ? Math.round((gradedSubjects / totalSubjects) * 100)
                    : 0
        };
    });

    byExam.sort((a, b) =>
        String(a.exam_type || "").localeCompare(String(b.exam_type || ""))
    );

    const bySubjectMap = new Map();
    for (const g of grades) {
        const subjName = g.examSubject.subjectName;
        if (!bySubjectMap.has(subjName)) {
            bySubjectMap.set(subjName, { attempts: 0, graded_attempts: 0 });
        }
        const entry = bySubjectMap.get(subjName);
        entry.attempts += 1;
        if (isGradeRowGraded(g)) {
            entry.graded_attempts += 1;
        }
    }

    const by_subject = [...bySubjectMap.entries()]
        .map(([subject_name, v]) => ({
            subject_name,
            attempts: v.attempts,
            graded_attempts: v.graded_attempts
        }))
        .sort((a, b) => a.subject_name.localeCompare(b.subject_name));

    return {
        student_id: studentId,
        period: {
            start_date: startDate ?? null,
            end_date: endDate ?? null
        },
        exams: {
            distinct_exam_count: examIds.length,
            grade_rows_total: grades.length
        },
        subjects: {
            distinct_subject_name_count: subjectNames.size,
            graded_count: grades.filter(isGradeRowGraded).length,
            pending_count: grades.filter((g) => !isGradeRowGraded(g)).length
        },
        by_exam: byExam,
        by_subject
    };
}
