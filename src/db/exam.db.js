import { prisma } from "../prisma/prisma.js"

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
                        examStartTime: new Date(subject.examStartTime),
                        examEndTime: new Date(subject.examEndTime),
                        extras: subject.extras || null
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
        console.error("Error creating exam:", err);
        return null;
    }
}

/**
 * Get exam by ID with all relations
 */
export async function getExamById(examId) {
    try {
        return await prisma.exam.findUnique({
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
                            examStartTime: new Date(subject.examStartTime),
                            examEndTime: new Date(subject.examEndTime),
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
                examStartTime: new Date(subject.examStartTime),
                examEndTime: new Date(subject.examEndTime),
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
        if (examStartTime !== undefined) updateData.examStartTime = new Date(examStartTime);
        if (examEndTime !== undefined) updateData.examEndTime = new Date(examEndTime);
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
