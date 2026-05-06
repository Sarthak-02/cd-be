import { prisma } from "../prisma/prisma.js";
import { Prisma } from "../prisma/generated/index.js";
import { randomUUID } from "crypto";

/**
 * Create or update a single exam grade
 */
export async function upsertExamGrade({
    examId,
    examSubjectId,
    studentId,
    gradesObtained,
    remarks,
    gradedBy
}) {
    try {
        const grade = await prisma.examGrade.upsert({
            where: {
                examSubjectId_studentId: {
                    examSubjectId,
                    studentId
                }
            },
            update: {
                gradesObtained,
                remarks,
                gradedBy,
                gradedAt: new Date()
            },
            create: {
                examId,
                examSubjectId,
                studentId,
                gradesObtained,
                remarks,
                gradedBy,
                gradedAt: new Date()
            },
            include: {
                student: {
                    select: {
                        student_id: true,
                        student_first_name: true,
                        student_middle_name: true,
                        student_last_name: true,
                        student_admission_no: true,
                        student_roll_no: true
                    }
                },
                examSubject: {
                    select: {
                        id: true,
                        subjectName: true,
                        examDate: true
                    }
                }
            }
        });

        return grade;
    } catch (err) {
        console.error("Error upserting exam grade:", err);
        throw err;
    }
}

/**
 * Bulk create or update exam grades
 */
export async function bulkUpsertExamGrades(grades) {
    if (!grades?.length) return [];
    try {
        const now = new Date();
        const values = grades.map(grade =>
            Prisma.sql`(
                ${randomUUID()}, ${grade.examId}, ${grade.examSubjectId}, ${grade.studentId},
                ${grade.gradesObtained ?? null}, ${grade.remarks ?? null}, ${grade.gradedBy ?? null},
                ${now}, ${now}, ${now}
            )`
        );

        const inserted = await prisma.$queryRaw`
            INSERT INTO "ExamGrade" (id, "examId", "examSubjectId", "studentId", "gradesObtained", remarks, "gradedBy", "gradedAt", "createdAt", "updatedAt")
            VALUES ${Prisma.join(values)}
            ON CONFLICT ("examSubjectId", "studentId")
            DO UPDATE SET
                "gradesObtained" = EXCLUDED."gradesObtained",
                remarks = EXCLUDED.remarks,
                "gradedBy" = EXCLUDED."gradedBy",
                "gradedAt" = EXCLUDED."gradedAt",
                "updatedAt" = EXCLUDED."updatedAt"
            RETURNING id
        `;

        const ids = inserted.map(r => r.id);
        return await prisma.examGrade.findMany({
            where: { id: { in: ids } },
            include: {
                student: {
                    select: {
                        student_id: true,
                        student_first_name: true,
                        student_middle_name: true,
                        student_last_name: true,
                        student_admission_no: true,
                        student_roll_no: true
                    }
                },
                examSubject: {
                    select: { id: true, subjectName: true, examDate: true }
                }
            }
        });
    } catch (err) {
        console.error("Error bulk upserting exam grades:", err);
        throw err;
    }
}

/**
 * Get all grades for a specific exam
 */
export async function getGradesByExam(examId) {
    try {
        const grades = await prisma.examGrade.findMany({
            where: { examId },
            include: {
                student: {
                    select: {
                        student_id: true,
                        student_first_name: true,
                        student_middle_name: true,
                        student_last_name: true,
                        student_admission_no: true,
                        student_roll_no: true
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
                        status: true
                    }
                }
            },
            orderBy: [
                { examSubject: { examDate: "asc" } },
                { student: { student_roll_no: "asc" } }
            ]
        });

        return grades;
    } catch (err) {
        console.error("Error fetching grades by exam:", err);
        return [];
    }
}

/**
 * Get all grades for a specific exam subject
 */
export async function getGradesByExamSubject(examSubjectId) {
    try {
        const grades = await prisma.examGrade.findMany({
            where: { examSubjectId },
            include: {
                student: {
                    select: {
                        student_id: true,
                        student_first_name: true,
                        student_middle_name: true,
                        student_last_name: true,
                        student_admission_no: true,
                        student_roll_no: true
                    }
                },
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
            },
            orderBy: {
                student: {
                    student_roll_no: "asc"
                }
            }
        });

        return grades;
    } catch (err) {
        console.error("Error fetching grades by exam subject:", err);
        return [];
    }
}

/**
 * Get all grades for a specific student
 */
export async function getGradesByStudent({
    studentId,
    examId = null,
    startDate = null,
    endDate = null,
    status = "all"
}) {
    try {
        const whereClause = { studentId };

        if (examId) whereClause.examId = examId;
        if (status === "graded") whereClause.gradesObtained = { not: null };
        else if (status === "pending") whereClause.gradesObtained = null;

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

        return grades;
    } catch (err) {
        console.error("Error fetching grades by student:", err);
        return [];
    }
}

/**
 * Get a specific grade by ID
 */
export async function getGradeById(gradeId) {
    try {
        const grade = await prisma.examGrade.findUnique({
            where: { id: gradeId },
            include: {
                student: {
                    select: {
                        student_id: true,
                        student_first_name: true,
                        student_middle_name: true,
                        student_last_name: true,
                        student_admission_no: true,
                        student_roll_no: true
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
            }
        });

        return grade;
    } catch (err) {
        console.error("Error fetching grade by ID:", err);
        return null;
    }
}

/**
 * Update an existing exam grade
 */
export async function updateExamGrade({
    gradeId,
    gradesObtained,
    remarks,
    gradedBy
}) {
    try {
        const updateData = {};
        
        if (gradesObtained !== undefined) updateData.gradesObtained = gradesObtained;
        if (remarks !== undefined) updateData.remarks = remarks;
        if (gradedBy !== undefined) {
            updateData.gradedBy = gradedBy;
            updateData.gradedAt = new Date();
        }

        const grade = await prisma.examGrade.update({
            where: { id: gradeId },
            data: updateData,
            include: {
                student: {
                    select: {
                        student_id: true,
                        student_first_name: true,
                        student_middle_name: true,
                        student_last_name: true,
                        student_admission_no: true,
                        student_roll_no: true
                    }
                },
                examSubject: {
                    select: {
                        id: true,
                        subjectName: true,
                        examDate: true
                    }
                }
            }
        });

        return grade;
    } catch (err) {
        console.error("Error updating exam grade:", err);
        throw err;
    }
}

/**
 * Delete an exam grade
 */
export async function deleteExamGrade(gradeId) {
    try {
        await prisma.examGrade.delete({
            where: { id: gradeId }
        });

        return true;
    } catch (err) {
        console.error("Error deleting exam grade:", err);
        return false;
    }
}

/**
 * Delete all grades for a specific exam subject
 */
export async function deleteGradesByExamSubject(examSubjectId) {
    try {
        const result = await prisma.examGrade.deleteMany({
            where: { examSubjectId }
        });

        return result.count;
    } catch (err) {
        console.error("Error deleting grades by exam subject:", err);
        return 0;
    }
}

/**
 * Get grade statistics for an exam
 */
export async function getExamGradeStatistics(examId) {
    try {
        // Get all grades for this exam
        const grades = await prisma.examGrade.findMany({
            where: { examId },
            include: {
                examSubject: {
                    select: {
                        id: true,
                        subjectName: true
                    }
                }
            }
        });

        // Group by subject
        const subjectStats = {};
        
        grades.forEach(grade => {
            const subjectId = grade.examSubject.id;
            const subjectName = grade.examSubject.subjectName;
            
            if (!subjectStats[subjectId]) {
                subjectStats[subjectId] = {
                    subjectId,
                    subjectName,
                    totalStudents: 0,
                    gradedStudents: 0,
                    pendingStudents: 0
                };
            }
            
            subjectStats[subjectId].totalStudents++;
            
            if (grade.gradesObtained !== null) {
                subjectStats[subjectId].gradedStudents++;
            } else {
                subjectStats[subjectId].pendingStudents++;
            }
        });

        return {
            examId,
            totalGrades: grades.length,
            gradedCount: grades.filter(g => g.gradesObtained !== null).length,
            pendingCount: grades.filter(g => g.gradesObtained === null).length,
            subjectStats: Object.values(subjectStats)
        };
    } catch (err) {
        console.error("Error fetching exam grade statistics:", err);
        return null;
    }
}

/**
 * Get student's grade report for an exam (all subjects)
 */
export async function getStudentExamReport({
    studentId,
    examId
}) {
    try {
        const grades = await prisma.examGrade.findMany({
            where: {
                studentId,
                examId
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
                    examDate: "asc"
                }
            }
        });

        return grades;
    } catch (err) {
        console.error("Error fetching student exam report:", err);
        return [];
    }
}
