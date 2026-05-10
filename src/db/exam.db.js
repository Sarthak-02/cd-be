import { prisma } from "../prisma/prisma.js"

/**
 * Helper function to convert time string to proper format for PostgreSQL TIME
 * @param {string} timeStr - Time string (HH:MM or HH:MM:SS)
 * @returns {string} Time string in HH:MM:SS format
 */
function parseTimeString(timeStr) {
    try {
        // Validate the time string format
        if (!timeStr || typeof timeStr !== 'string') {
            throw new Error(`Invalid time string: ${timeStr}`);
        }
        
        // If the time string already has seconds, return as is
        if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
            return timeStr;
        }
        
        // If the time string is HH:MM, add :00 for seconds
        if (/^\d{2}:\d{2}$/.test(timeStr)) {
            return `${timeStr}:00`;
        }
        
        throw new Error(`Invalid time string format: ${timeStr}. Expected HH:MM or HH:MM:SS`);
    } catch (err) {
        console.error(`Error parsing time string: ${timeStr}`, err);
        throw err;
    }
}

/**
 * Create a new exam with subjects and targets
 */
export async function createExam({
    examType,
    target,
    gradingType,
    gradingExtras,
    createdBy,
    campusId,
    subjects = [], // [{ subjectName, examDate, examStartTime, examEndTime, extras }]
    targets = [], // [{ targetType, targetId }]
}) {
    try {
        const exam = await prisma.exam.create({
            data: {
                examType,
                target,
                gradingType,
                gradingExtras,
                createdBy,
                campusId,
                status: "DRAFT",
                subjects: {
                    create: subjects.map(subject => ({
                        subjectName: subject.subjectName,
                        examDate: new Date(subject.examDate),
                        examStartTime: subject.examStartTime,
                        examEndTime: subject.examEndTime,
                        extras: subject?.extras || null
                    }))
                },
                targets: {
                    create: targets
                }
            },
            include: {
                subjects: true,
                targets: true
            }
        });

        return exam;
    } catch (err) {
        console.error("Error creating exam:");
        console.error("Message:", err.message);
        console.error("Stack:", err.stack);
        if (err.code) console.error("Code:", err.code);
        if (err.meta) console.error("Meta:", JSON.stringify(err.meta, null, 2));
        if (err.clientVersion) console.error("Prisma Client Version:", err.clientVersion);
        throw err; // Re-throw to see the actual error in the controller
    }
}

/**
 * Get exam by ID with all relations
 */
export async function getExamById(examId) {
    try {
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: {
                subjects: {
                    orderBy: {
                        examDate: "asc"
                    }
                },
                targets: true
            }
        });

        if (!exam) {
            return null;
        }

        const subjectIds = exam.subjects.map(s => s.id);
        const gradeCounts = await prisma.examGrade.groupBy({
            by: ['examSubjectId'],
            where: { examSubjectId: { in: subjectIds } },
            _count: { examSubjectId: true },
        });
        const gradeCountMap = new Map(gradeCounts.map(g => [g.examSubjectId, g._count.examSubjectId]));

        return {
            ...exam,
            subjects: exam.subjects.map(subject => ({
                ...subject,
                hasGradesMarked: (gradeCountMap.get(subject.id) ?? 0) > 0,
                totalGradesMarked: gradeCountMap.get(subject.id) ?? 0,
            })),
        };
    } catch (err) {
        console.error("Error fetching exam by ID:", err);
        return null;
    }
}

/**
 * Get all exams for a campus
 */
export async function getExamsByCampus({
    campusId,
    status,
    examType,
    startDate,
    endDate,
    limit = 50,
    offset = 0
}) {
    try {
        const whereClause = {
            campusId
        };

        if (status) {
            whereClause.status = status;
        }

        if (examType) {
            whereClause.examType = examType;
        }

        // Filter by exam date range (checks if any subject falls within the range)
        if (startDate || endDate) {
            whereClause.subjects = {
                some: {
                    examDate: {}
                }
            };
            if (startDate) {
                whereClause.subjects.some.examDate.gte = new Date(startDate);
            }
            if (endDate) {
                whereClause.subjects.some.examDate.lte = new Date(endDate);
            }
        }

        const exams = await prisma.exam.findMany({
            where: whereClause,
            include: {
                subjects: {
                    orderBy: {
                        examDate: "asc"
                    }
                },
                targets: true
            },
            orderBy: {
                createdAt: "desc"
            },
            take: limit,
            skip: offset
        });

        return exams;
    } catch (err) {
        console.error("Error fetching exams by campus:", err);
        return [];
    }
}

/**
 * Get exams by teacher (created by)
 */
export async function getExamsByTeacher({
    teacherId,
    status,
    startDate,
    endDate,
    limit = 50,
    offset = 0
}) {
    try {
        const whereClause = {
            createdBy: teacherId
        };

        if (status) {
            whereClause.status = status;
        }

        if (startDate || endDate) {
            whereClause.subjects = {
                some: {
                    examDate: {}
                }
            };
            if (startDate) {
                whereClause.subjects.some.examDate.gte = new Date(startDate);
            }
            if (endDate) {
                whereClause.subjects.some.examDate.lte = new Date(endDate);
            }
        }

        const exams = await prisma.exam.findMany({
            where: whereClause,
            include: {
                subjects: {
                    orderBy: {
                        examDate: "asc"
                    }
                },
                targets: true
            },
            orderBy: {
                createdAt: "desc"
            },
            take: limit,
            skip: offset
        });

        return exams;
    } catch (err) {
        console.error("Error fetching exams by teacher:", err);
        return [];
    }
}

/**
 * Get exams for a specific target (student, section, or school)
 */
export async function getExamsByTarget({
    targetType,
    targetId,
    status = "PUBLISHED",
    startDate,
    endDate,
    limit = 50,
    offset = 0
}) {
    try {
        const whereClause = {
            status,
            OR: [
                {
                    target: targetType,
                    targets: {
                        some: {
                            targetType,
                            targetId
                        }
                    }
                }
            ]
        };

        // Add school-wide exams if target is SCHOOL
        if (targetType === "SCHOOL") {
            whereClause.OR.push({
                target: "SCHOOL",
                targets: {
                    some: {
                        targetType: "SCHOOL",
                        targetId
                    }
                }
            });
        }

        if (startDate || endDate) {
            whereClause.subjects = {
                some: {
                    examDate: {}
                }
            };
            if (startDate) {
                whereClause.subjects.some.examDate.gte = new Date(startDate);
            }
            if (endDate) {
                whereClause.subjects.some.examDate.lte = new Date(endDate);
            }
        }

        const exams = await prisma.exam.findMany({
            where: whereClause,
            include: {
                subjects: {
                    orderBy: {
                        examDate: "asc"
                    }
                },
                targets: true
            },
            orderBy: {
                createdAt: "desc"
            },
            take: limit,
            skip: offset
        });

        return exams;
    } catch (err) {
        console.error("Error fetching exams by target:", err);
        return [];
    }
}

/**
 * Get exams for a student (checks student, section, and school targets)
 */
export async function getExamsForStudent({
    studentId,
    status = "PUBLISHED",
    startDate,
    endDate,
    limit = 50,
    offset = 0
}) {
    try {
        // First, get the student's section and school
        const student = await prisma.student.findUnique({
            where: { student_id: studentId },
            select: {
                student_section_id: true,
                campus_id: true,
                campus: {
                    select: {
                        school_id: true
                    }
                },
                section: {
                    select: {
                        class_id: true
                    }
                }
            }
        });

        if (!student) {
            return [];
        }

        const whereClause = {
            status,
            OR: [
                // Direct student target
                {
                    target: "STUDENT",
                    targets: {
                        some: {
                            targetType: "STUDENT",
                            targetId: studentId
                        }
                    }
                },
                // Section target
                {
                    target: "SECTION",
                    targets: {
                        some: {
                            targetType: "SECTION",
                            targetId: student.student_section_id
                        }
                    }
                },
                // Class target
                ...(student.section?.class_id ? [{
                    target: "CLASS",
                    targets: {
                        some: {
                            targetType: "CLASS",
                            targetId: student.section.class_id
                        }
                    }
                }] : []),
                // School target
                {
                    target: "SCHOOL",
                    targets: {
                        some: {
                            targetType: "SCHOOL",
                            targetId: student.campus.school_id
                        }
                    }
                }
            ]
        };

        if (startDate || endDate) {
            whereClause.subjects = {
                some: {
                    examDate: {}
                }
            };
            if (startDate) {
                whereClause.subjects.some.examDate.gte = new Date(startDate);
            }
            if (endDate) {
                whereClause.subjects.some.examDate.lte = new Date(endDate);
            }
        }

        const exams = await prisma.exam.findMany({
            where: whereClause,
            include: {
                subjects: {
                    orderBy: {
                        examDate: "asc"
                    }
                },
                targets: true
            },
            orderBy: {
                createdAt: "desc"
            },
            take: limit,
            skip: offset
        });

        return exams;
    } catch (err) {
        console.error("Error fetching exams for student:", err);
        return [];
    }
}

/**
 * Update exam details (comprehensive update like create)
 */
export async function updateExam({
    examId,
    examType,
    target,
    gradingType,
    gradingExtras,
    subjects = null, // null means don't update subjects
    targets = null  // null means don't update targets
}) {
    try {
        // Use transaction to update exam, subjects, and targets together
        const exam = await prisma.$transaction(async (tx) => {
            // First check if exam exists and is in DRAFT status
            const existingExam = await tx.exam.findUnique({
                where: { id: examId },
                select: { status: true }
            });

            if (!existingExam) {
                throw new Error("Exam not found");
            }

            if (existingExam.status !== "DRAFT") {
                throw new Error("Only DRAFT exams can be fully updated");
            }

            // Update basic exam details
            const updateData = {};
            if (examType !== undefined) updateData.examType = examType;
            if (target !== undefined) updateData.target = target;
            if (gradingType !== undefined) updateData.gradingType = gradingType;
            if (gradingExtras !== undefined) updateData.gradingExtras = gradingExtras;

            const updatedExam = await tx.exam.update({
                where: { id: examId },
                data: updateData
            });

            // If subjects are provided, replace all subjects
            if (subjects !== null && Array.isArray(subjects)) {
                // Delete existing subjects
                await tx.examSubject.deleteMany({
                    where: { examId }
                });

                // Create new subjects
                if (subjects.length > 0) {
                    await tx.examSubject.createMany({
                        data: subjects.map(subject => ({
                            examId,
                            subjectName: subject.subjectName,
                            examDate: new Date(subject.examDate),
                            examStartTime: parseTimeString(subject.examStartTime),
                            examEndTime: parseTimeString(subject.examEndTime),
                            extras: subject.extras || null
                        }))
                    });
                }
            }

            // If targets are provided, replace all targets
            if (targets !== null && Array.isArray(targets)) {
                // Delete existing targets
                await tx.examTarget.deleteMany({
                    where: { examId }
                });

                // Create new targets
                if (targets.length > 0) {
                    await tx.examTarget.createMany({
                        data: targets.map(target => ({
                            examId,
                            ...target
                        }))
                    });
                }
            }

            // Return complete exam with relations
            return await tx.exam.findUnique({
                where: { id: examId },
                include: {
                    subjects: {
                        orderBy: {
                            examDate: "asc"
                        }
                    },
                    targets: true
                }
            });
        });

        return exam;
    } catch (err) {
        console.error("Error updating exam:", err);
        throw err;
    }
}

/**
 * Update exam status (DRAFT -> PUBLISHED -> COMPLETED)
 */
export async function updateExamStatus(examId, status) {
    try {
        return await prisma.exam.update({
            where: { id: examId },
            data: { status },
            include: {
                subjects: {
                    orderBy: {
                        examDate: "asc"
                    }
                },
                targets: true
            }
        });
    } catch (err) {
        console.error("Error updating exam status:", err);
        return null;
    }
}

/**
 * Publish exam (DRAFT -> PUBLISHED)
 */
export async function publishExam(examId) {
    return updateExamStatus(examId, "PUBLISHED");
}

/**
 * Complete exam (PUBLISHED -> COMPLETED)
 */
export async function completeExam(examId) {
    return updateExamStatus(examId, "COMPLETED");
}

/**
 * Delete exam (hard delete - only for DRAFT status)
 */
export async function deleteExam(examId) {
    try {
        // Check if exam is in DRAFT status
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            select: { status: true }
        });

        if (!exam) {
            throw new Error("Exam not found");
        }

        if (exam.status !== "DRAFT") {
            throw new Error("Only DRAFT exams can be deleted");
        }

        await prisma.exam.delete({
            where: { id: examId }
        });

        return true;
    } catch (err) {
        console.error("Error deleting exam:", err);
        return false;
    }
}

/**
 * Add subjects to existing exam
 */
export async function addExamSubjects(examId, subjects) {
    try {
        const created = await prisma.examSubject.createMany({
            data: subjects.map(subject => ({
                examId,
                subjectName: subject.subjectName,
                examDate: new Date(subject.examDate),
                examStartTime: parseTimeString(subject.examStartTime),
                examEndTime: parseTimeString(subject.examEndTime),
                extras: subject.extras || null
            }))
        });

        return created;
    } catch (err) {
        console.error("Error adding exam subjects:", err);
        return null;
    }
}

/**
 * Update exam subject
 */
export async function updateExamSubject({
    subjectId,
    subjectName,
    examDate,
    examStartTime,
    examEndTime,
    extras
}) {
    try {
        const updateData = {};
        
        if (subjectName !== undefined) updateData.subjectName = subjectName;
        if (examDate !== undefined) updateData.examDate = new Date(examDate);
        if (examStartTime !== undefined) updateData.examStartTime = parseTimeString(examStartTime);
        if (examEndTime !== undefined) updateData.examEndTime = parseTimeString(examEndTime);
        if (extras !== undefined) updateData.extras = extras;

        return await prisma.examSubject.update({
            where: { id: subjectId },
            data: updateData
        });
    } catch (err) {
        console.error("Error updating exam subject:", err);
        return null;
    }
}

/**
 * Remove subject from exam
 */
export async function removeExamSubject(subjectId) {
    try {
        await prisma.examSubject.delete({
            where: { id: subjectId }
        });
        return true;
    } catch (err) {
        console.error("Error removing exam subject:", err);
        return false;
    }
}

/**
 * Add targets to existing exam
 */
export async function addExamTargets(examId, targets) {
    try {
        const created = await prisma.examTarget.createMany({
            data: targets.map(target => ({
                examId,
                ...target
            }))
        });

        return created;
    } catch (err) {
        console.error("Error adding exam targets:", err);
        return null;
    }
}

/**
 * Remove target from exam
 */
export async function removeExamTarget(targetId) {
    try {
        await prisma.examTarget.delete({
            where: { id: targetId }
        });
        return true;
    } catch (err) {
        console.error("Error removing exam target:", err);
        return false;
    }
}

/**
 * Get exam statistics by campus
 */
export async function getExamStatsByCampus(campusId) {
    try {
        const stats = await prisma.exam.groupBy({
            by: ["status"],
            where: { campusId },
            _count: {
                status: true
            }
        });

        return stats;
    } catch (err) {
        console.error("Error fetching exam stats:", err);
        return [];
    }
}

/**
 * Get upcoming exams (starting in next N days)
 */
export async function getUpcomingExams({
    targetType,
    targetId,
    days = 7
}) {
    try {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);

        return await prisma.exam.findMany({
            where: {
                status: "PUBLISHED",
                subjects: {
                    some: {
                        examDate: {
                            gte: today,
                            lte: futureDate
                        }
                    }
                },
                targets: {
                    some: {
                        targetType,
                        targetId
                    }
                }
            },
            include: {
                subjects: {
                    where: {
                        examDate: {
                            gte: today,
                            lte: futureDate
                        }
                    },
                    orderBy: {
                        examDate: "asc"
                    }
                },
                targets: true
            },
            orderBy: {
                createdAt: "asc"
            }
        });
    } catch (err) {
        console.error("Error fetching upcoming exams:", err);
        return [];
    }
}

/**
 * Get ongoing exams (exams happening today)
 */
export async function getOngoingExams({
    targetType,
    targetId
}) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return await prisma.exam.findMany({
            where: {
                status: "PUBLISHED",
                subjects: {
                    some: {
                        examDate: {
                            gte: today,
                            lt: tomorrow
                        }
                    }
                },
                targets: {
                    some: {
                        targetType,
                        targetId
                    }
                }
            },
            include: {
                subjects: {
                    where: {
                        examDate: {
                            gte: today,
                            lt: tomorrow
                        }
                    },
                    orderBy: {
                        examStartTime: "asc"
                    }
                },
                targets: true
            }
        });
    } catch (err) {
        console.error("Error fetching ongoing exams:", err);
        return [];
    }
}

/**
 * Get all grades for an exam grouped by subjects
 */
export async function getExamGradesWithDetails(examId) {
    try {
        // First, get the exam to verify it exists
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            select: {
                id: true,
                examType: true,
                status: true,
                gradingType: true,
                gradingExtras: true
            }
        });

        if (!exam) {
            return null;
        }

        // Get all subjects with their grades
        const subjects = await prisma.examSubject.findMany({
            where: { examId },
            include: {
                grades: {
                    include: {
                        student: {
                            select: {
                                student_id: true,
                                student_first_name: true,
                                student_middle_name: true,
                                student_last_name: true,
                                student_admission_no: true,
                                student_roll_no: true,
                                student_photo_url: true
                            }
                        }
                    },
                    orderBy: {
                        student: {
                            student_roll_no: "asc"
                        }
                    }
                }
            },
            orderBy: {
                examDate: "asc"
            }
        });

        // Format the response
        const subjectsWithGrades = subjects.map(subject => {
            const grades = subject.grades.map(grade => ({
                grade_id: grade.id,
                student_id: grade.studentId,
                student_name: [
                    grade.student.student_first_name,
                    grade.student.student_middle_name,
                    grade.student.student_last_name
                ].filter(Boolean).join(" "),
                student_roll_no: grade.student.student_roll_no,
                student_admission_no: grade.student.student_admission_no,
                student_photo_url: grade.student.student_photo_url,
                grades_obtained: grade.gradesObtained,
                remarks: grade.remarks,
                graded_by: grade.gradedBy,
                graded_at: grade.gradedAt
            }));

            // Calculate statistics
            const gradedCount = grades.filter(g => g.grades_obtained !== null).length;
            const totalCount = grades.length;

            return {
                subject_id: subject.id,
                subject_name: subject.subjectName,
                exam_date: subject.examDate,
                exam_start_time: subject.examStartTime,
                exam_end_time: subject.examEndTime,
                extras: subject.extras,
                total_students: totalCount,
                graded_students: gradedCount,
                pending_students: totalCount - gradedCount,
                has_grades_marked: gradedCount > 0,
                grades: grades
            };
        });

        return {
            exam_id: exam.id,
            exam_type: exam.examType,
            exam_status: exam.status,
            grading_type: exam.gradingType,
            grading_extras: exam.gradingExtras,
            subjects: subjectsWithGrades
        };
    } catch (err) {
        console.error("Error fetching exam grades with details:", err);
        throw err;
    }
}

/**
 * Get exam details with grades for a specific student
 */
export async function getExamDetailsForStudent({ examId, studentId }) {
    try {
        // Get the exam with all basic details
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            select: {
                id: true,
                examType: true,
                target: true,
                status: true,
                gradingType: true,
                gradingExtras: true,
                createdBy: true,
                campusId: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!exam) {
            return null;
        }

        // Check if the student is eligible for this exam
        const isEligible = await isStudentEligibleForExam(examId, studentId);
        
        if (!isEligible) {
            return {
                error: "STUDENT_NOT_ELIGIBLE",
                message: "Student is not eligible for this exam"
            };
        }

        // Get all subjects with grades for this student
        const subjects = await prisma.examSubject.findMany({
            where: { examId },
            include: {
                grades: {
                    where: {
                        studentId: studentId
                    }
                }
            },
            orderBy: {
                examDate: "asc"
            }
        });

        // Format subjects with grade info
        const subjectsWithGrades = subjects.map(subject => {
            const grade = subject.grades[0]; // Will be undefined if not graded yet
            
            return {
                subject_id: subject.id,
                subject_name: subject.subjectName,
                exam_date: subject.examDate,
                exam_start_time: subject.examStartTime,
                exam_end_time: subject.examEndTime,
                extras: subject.extras,
                // Grade information
                is_graded: !!grade,
                grade_id: grade?.id || null,
                grades_obtained: grade?.gradesObtained || null,
                remarks: grade?.remarks || null,
                graded_by: grade?.gradedBy || null,
                graded_at: grade?.gradedAt || null
            };
        });

        // Calculate overall statistics
        const totalSubjects = subjectsWithGrades.length;
        const gradedSubjects = subjectsWithGrades.filter(s => s.is_graded).length;
        const pendingSubjects = totalSubjects - gradedSubjects;

        return {
            exam: {
                exam_id: exam.id,
                exam_type: exam.examType,
                target: exam.target,
                status: exam.status,
                grading_type: exam.gradingType,
                grading_extras: exam.gradingExtras,
                created_by: exam.createdBy,
                campus_id: exam.campusId,
                created_at: exam.createdAt,
                updated_at: exam.updatedAt
            },
            student_id: studentId,
            statistics: {
                total_subjects: totalSubjects,
                graded_subjects: gradedSubjects,
                pending_subjects: pendingSubjects,
                completion_percentage: totalSubjects > 0 ? Math.round((gradedSubjects / totalSubjects) * 100) : 0
            },
            subjects: subjectsWithGrades
        };
    } catch (err) {
        console.error("Error fetching exam details for student:", err);
        throw err;
    }
}

/**
 * Helper function to check if a student is eligible for an exam
 */
async function isStudentEligibleForExam(examId, studentId) {
    try {
        // Get the exam targets
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: {
                targets: true
            }
        });

        if (!exam) {
            return false;
        }

        // Get student details
        const student = await prisma.student.findUnique({
            where: { student_id: studentId },
            select: {
                student_id: true,
                student_section_id: true,
                campus: {
                    select: {
                        school_id: true
                    }
                },
                section: {
                    select: {
                        class_id: true
                    }
                }
            }
        });

        if (!student) {
            return false;
        }

        // Check if student is in any of the exam targets
        for (const target of exam.targets) {
            if (target.targetType === "STUDENT" && target.targetId === studentId) {
                return true;
            }
            if (target.targetType === "SECTION" && target.targetId === student.student_section_id) {
                return true;
            }
            if (target.targetType === "CLASS" && target.targetId === student.section?.class_id) {
                return true;
            }
            if (target.targetType === "SCHOOL" && target.targetId === student.campus.school_id) {
                return true;
            }
        }

        return false;
    } catch (err) {
        console.error("Error checking student eligibility:", err);
        return false;
    }
}

/**
 * Display label "ClassName (SectionName)" for roster / exports.
 * @param {{ section?: { section_name?: string | null, classRef?: { class_name?: string | null } | null } | null }} student
 */
function formatStudentClassSectionLabel(student) {
    const sec = student.section;
    if (!sec) {
        return "";
    }
    const className = sec.classRef?.class_name?.trim() ?? "";
    const sectionName = sec.section_name?.trim() ?? "";
    if (className && sectionName) {
        return `${className} (${sectionName})`;
    }
    return className || sectionName || "";
}

/**
 * Class IDs implied by exam targets (CLASS, SECTION → class, STUDENT → class via section).
 * SCHOOL-wide targets add no class IDs — use campus `class_grading_config.default` in that case.
 *
 * @param {{ targetType: string, targetId: string | null }[]} targets
 */
export async function getClassIdsForExamTargets(targets) {
    const classIds = new Set();
    if (!targets?.length) {
        return classIds;
    }

    const sectionIds = [];
    const studentIds = [];

    for (const t of targets) {
        if (t.targetType === "CLASS" && t.targetId) {
            classIds.add(t.targetId);
        } else if (t.targetType === "SECTION" && t.targetId) {
            sectionIds.push(t.targetId);
        } else if (t.targetType === "STUDENT" && t.targetId) {
            studentIds.push(t.targetId);
        }
    }

    if (sectionIds.length > 0) {
        const sections = await prisma.section.findMany({
            where: { section_id: { in: sectionIds } },
            select: { class_id: true }
        });
        for (const s of sections) {
            classIds.add(s.class_id);
        }
    }

    if (studentIds.length > 0) {
        const students = await prisma.student.findMany({
            where: { student_id: { in: studentIds } },
            select: {
                section: { select: { class_id: true } }
            }
        });
        for (const st of students) {
            if (st.section?.class_id) {
                classIds.add(st.section.class_id);
            }
        }
    }

    return classIds;
}

/**
 * Get all students for an exam based on its targets
 */
export async function getStudentsForExam(examId) {
    try {
        // First, get the exam with its targets
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: {
                targets: true
            }
        });

        if (!exam) {
            return null;
        }

        // Collect all student IDs based on target types
        const studentIds = new Set();

        for (const target of exam.targets) {
            if (target.targetType === "STUDENT") {
                // Direct student target
                studentIds.add(target.targetId);
            } else if (target.targetType === "SECTION") {
                // Get all students in the section
                const students = await prisma.student.findMany({
                    where: {
                        student_section_id: target.targetId,
                        student_current_status: "active"
                    },
                    select: {
                        student_id: true
                    }
                });
                students.forEach(s => studentIds.add(s.student_id));
            } else if (target.targetType === "CLASS") {
                // Get all sections for the class, then all students in those sections
                const sections = await prisma.section.findMany({
                    where: {
                        class_id: target.targetId
                    },
                    select: {
                        section_id: true
                    }
                });
                
                const sectionIds = sections.map(s => s.section_id);
                
                const students = await prisma.student.findMany({
                    where: {
                        student_section_id: {
                            in: sectionIds
                        },
                        student_current_status: "active"
                    },
                    select: {
                        student_id: true
                    }
                });
                students.forEach(s => studentIds.add(s.student_id));
            } else if (target.targetType === "SCHOOL") {
                // Get all students for the school (via campus)
                const campus = await prisma.campus.findFirst({
                    where: {
                        school_id: target.targetId
                    },
                    select: {
                        campus_id: true
                    }
                });

                if (campus) {
                    const students = await prisma.student.findMany({
                        where: {
                            campus_id: campus.campus_id,
                            student_current_status: "active"
                        },
                        select: {
                            student_id: true
                        }
                    });
                    students.forEach(s => studentIds.add(s.student_id));
                }
            }
        }

        // Now fetch full student details for all collected student IDs
        const students = await prisma.student.findMany({
            where: {
                student_id: {
                    in: Array.from(studentIds)
                }
            },
            select: {
                student_id: true,
                student_first_name: true,
                student_middle_name: true,
                student_last_name: true,
                student_roll_no: true,
                student_photo_url: true,
                student_admission_no: true,
                section: {
                    select: {
                        section_name: true,
                        section_short_name: true,
                        classRef: {
                            select: {
                                class_name: true,
                                class_short_name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                student_roll_no: "asc"
            }
        });

        // Format the response
        return students.map(student => ({
            student_id: student.student_id,
            student_name: [
                student.student_first_name,
                student.student_middle_name,
                student.student_last_name
            ].filter(Boolean).join(" "),
            student_roll_no: student.student_roll_no,
            student_photo_url: student.student_photo_url,
            student_admission_no: student.student_admission_no,
            class_section:
                formatStudentClassSectionLabel(student)
        }));
    } catch (err) {
        console.error("Error fetching students for exam:", err);
        throw err;
    }
}
