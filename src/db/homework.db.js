import { prisma } from "../prisma/prisma.js"

/**
 * Helper function to fetch target name based on target type and ID
 */
async function getTargetName(targetType, targetId) {
    try {
        switch (targetType) {
            case 'CLASS':
                const classData = await prisma.class.findUnique({
                    where: { class_id: targetId },
                    select: { class_name: true }
                });
                return classData?.class_name || null;
            
            case 'SECTION':
                const sectionData = await prisma.section.findUnique({
                    where: { section_id: targetId },
                    select: { section_name: true }
                });
                return sectionData?.section_name || null;
            
            case 'STUDENT':
                const studentData = await prisma.student.findUnique({
                    where: { student_id: targetId },
                    select: { 
                        student_first_name: true,
                        student_middle_name: true,
                        student_last_name: true 
                    }
                });
                if (studentData) {
                    return [
                        studentData.student_first_name,
                        studentData.student_middle_name,
                        studentData.student_last_name
                    ].filter(Boolean).join(' ');
                }
                return null;
            
            default:
                return null;
        }
    } catch (err) {
        console.error(`Error fetching target name for ${targetType}:`, err);
        return null;
    }
}

/**
 * Helper function to format teacher data
 */
function formatTeacherData(teacher) {
    if (!teacher) return null;
    
    const teacherName = [
        teacher.teacher_first_name,
        teacher.teacher_middle_name,
        teacher.teacher_last_name
    ].filter(Boolean).join(' ');

    return {
        teacher_id: teacher.teacher_id,
        teacher_name: teacherName,
        ...(teacher.teacher_employee_code && { teacher_employee_code: teacher.teacher_employee_code }),
        ...(teacher.teacher_email && { teacher_email: teacher.teacher_email })
    };
}

/**
 * Helper function to format homework with target names and teacher name
 */
async function formatHomeworkResponse(homework) {
    // Fetch target names
    const targetsWithNames = await Promise.all(
        homework.targets.map(async (target) => {
            const targetName = await getTargetName(target.targetType, target.targetId);
            return {
                ...target,
                target_name: targetName
            };
        })
    );

    return {
        ...homework,
        targets: targetsWithNames,
        teacher: formatTeacherData(homework.teacher)
    };
}

/**
 * Create a new homework with attachments and targets
 */
export async function createHomework({
    title,
    description,
    dueDate,
    subject,
    createdBy,
    attachments = [], // [{ fileUrl, fileName, fileType, fileSize }]
    targets = [], // [{ targetType, targetId }]
}) {
    try {
        const homework = await prisma.homework.create({
            data: {
                title,
                description,
                dueDate: new Date(dueDate),
                subject,
                createdBy,
                status: "DRAFT",
                attachments: {
                    create: attachments
                },
                targets: {
                    create: targets
                }
            },
            include: {
                attachments: true,
                targets: true,
                teacher: {
                    select: {
                        teacher_id: true,
                        teacher_first_name: true,
                        teacher_last_name: true,
                        teacher_employee_code: true,
                    }
                }
            }
        });

        return homework;
    } catch (err) {
        console.error("Error creating homework:", err);
        return null;
    }
}

/**
 * Get homework by ID with all relations
 */
export async function getHomeworkById(homeworkId) {
    try {
        const homework = await prisma.homework.findUnique({
            where: { id: homeworkId },
            include: {
                attachments: true,
                targets: true,
                teacher: {
                    select: {
                        teacher_id: true,
                        teacher_first_name: true,
                        teacher_middle_name: true,
                        teacher_last_name: true,
                        teacher_employee_code: true,
                        teacher_email: true,
                    }
                }
            }
        });

        if (!homework) return null;

        return await formatHomeworkResponse(homework);
    } catch (err) {
        console.error("Error fetching homework by ID:", err);
        return null;
    }
}

/**
 * Get all homework created by a teacher
 */
export async function getHomeworkByTeacher({
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
            whereClause.dueDate = {};
            if (startDate) {
                whereClause.dueDate.gte = new Date(startDate);
            }
            if (endDate) {
                whereClause.dueDate.lte = new Date(endDate);
            }
        }

        const homework = await prisma.homework.findMany({
            where: whereClause,
            include: {
                attachments: true,
                targets: true,
                teacher: {
                    select: {
                        teacher_id: true,
                        teacher_first_name: true,
                        teacher_middle_name: true,
                        teacher_last_name: true,
                    }
                }
            },
            orderBy: {
                dueDate: "desc"
            },
            take: limit,
            skip: offset
        });

        // Format homework with target names and teacher name
        return await Promise.all(homework.map(hw => formatHomeworkResponse(hw)));
    } catch (err) {
        console.error("Error fetching homework by teacher:", err);
        return [];
    }
}

/**
 * Get homework for a specific target (class, section, or student)
 */
export async function getHomeworkByTarget({
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
            targets: {
                some: {
                    targetType,
                    targetId
                }
            }
        };

        if (startDate || endDate) {
            whereClause.dueDate = {};
            if (startDate) {
                whereClause.dueDate.gte = new Date(startDate);
            }
            if (endDate) {
                whereClause.dueDate.lte = new Date(endDate);
            }
        }

        const homework = await prisma.homework.findMany({
            where: whereClause,
            include: {
                attachments: true,
                targets: true,
                teacher: {
                    select: {
                        teacher_id: true,
                        teacher_first_name: true,
                        teacher_middle_name: true,
                        teacher_last_name: true,
                    }
                }
            },
            orderBy: {
                dueDate: "asc"
            },
            take: limit,
            skip: offset
        });

        // Format homework with target names and teacher name
        return await Promise.all(homework.map(hw => formatHomeworkResponse(hw)));
    } catch (err) {
        console.error("Error fetching homework by target:", err);
        return [];
    }
}

/**
 * Get homework for a student (checks section and student-specific homework)
 */
export async function getHomeworkForStudent({
    studentId,
    status = "PUBLISHED",
    startDate,
    endDate,
    limit = 50,
    offset = 0
}) {
    try {
        // First, get the student's section
        const student = await prisma.student.findUnique({
            where: { student_id: studentId },
            select: {
                student_section_id: true,
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
            targets: {
                some: {
                    OR: [
                        { targetType: "STUDENT", targetId: studentId },
                        { targetType: "SECTION", targetId: student.student_section_id },
                        { targetType: "CLASS", targetId: student.section.class_id }
                    ]
                }
            }
        };

        if (startDate || endDate) {
            whereClause.dueDate = {};
            if (startDate) {
                whereClause.dueDate.gte = new Date(startDate);
            }
            if (endDate) {
                whereClause.dueDate.lte = new Date(endDate);
            }
        }

        const homework = await prisma.homework.findMany({
            where: whereClause,
            include: {
                attachments: true,
                targets: true,
                teacher: {
                    select: {
                        teacher_id: true,
                        teacher_first_name: true,
                        teacher_middle_name: true,
                        teacher_last_name: true,
                    }
                }
            },
            orderBy: {
                dueDate: "asc"
            },
            take: limit,
            skip: offset
        });

        // Format homework with target names and teacher name
        return await Promise.all(homework.map(hw => formatHomeworkResponse(hw)));
    } catch (err) {
        console.error("Error fetching homework for student:", err);
        return [];
    }
}

/**
 * Update homework details
 */
export async function updateHomework({
    homeworkId,
    title,
    description,
    dueDate,
    subject,
    createdBy,
    targets
}) {
    try {
        const updateData = {};
        
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
        if (subject !== undefined) updateData.subject = subject;
        if (createdBy !== undefined) updateData.createdBy = createdBy;

        // If targets are provided, replace existing targets
        if (targets !== undefined && Array.isArray(targets)) {
            // Delete existing targets and create new ones
            await prisma.homeworkTarget.deleteMany({
                where: { homeworkId }
            });

            updateData.targets = {
                create: targets.map(target => ({
                    targetType: target.targetType,
                    targetId: target.targetId
                }))
            };
        }

        const homework = await prisma.homework.update({
            where: { id: homeworkId },
            data: updateData,
            include: {
                attachments: true,
                targets: true,
                teacher: {
                    select: {
                        teacher_id: true,
                        teacher_first_name: true,
                        teacher_middle_name: true,
                        teacher_last_name: true,
                        teacher_employee_code: true,
                        teacher_email: true,
                    }
                }
            }
        });

        // Format the response with target names and teacher name
        return await formatHomeworkResponse(homework);
    } catch (err) {
        console.error("Error updating homework:", err);
        return null;
    }
}

/**
 * Update homework status (DRAFT -> PUBLISHED -> CLOSED)
 */
export async function updateHomeworkStatus(homeworkId, status) {
    try {
        return await prisma.homework.update({
            where: { id: homeworkId },
            data: { status },
            include: {
                attachments: true,
                targets: true,
                teacher: {
                    select: {
                        teacher_id: true,
                        teacher_first_name: true,
                        teacher_last_name: true,
                    }
                }
            }
        });
    } catch (err) {
        console.error("Error updating homework status:", err);
        return null;
    }
}

/**
 * Publish homework (DRAFT -> PUBLISHED)
 */
export async function publishHomework(homeworkId) {
    return updateHomeworkStatus(homeworkId, "PUBLISHED");
}

/**
 * Close homework (PUBLISHED -> CLOSED)
 */
export async function closeHomework(homeworkId) {
    return updateHomeworkStatus(homeworkId, "CLOSED");
}

/**
 * Delete homework (hard delete - only for DRAFT status)
 */
export async function deleteHomework(homeworkId) {
    try {
        // Check if homework is in DRAFT status
        const homework = await prisma.homework.findUnique({
            where: { id: homeworkId },
            select: { status: true }
        });

        if (!homework) {
            throw new Error("Homework not found");
        }

        if (homework.status !== "DRAFT") {
            throw new Error("Only DRAFT homework can be deleted");
        }

        await prisma.homework.delete({
            where: { id: homeworkId }
        });

        return true;
    } catch (err) {
        console.error("Error deleting homework:", err);
        return false;
    }
}

/**
 * Add attachments to existing homework
 */
export async function addHomeworkAttachments(homeworkId, attachments) {
    try {
        const created = await prisma.homeworkAttachment.createMany({
            data: attachments.map(att => ({
                homeworkId,
                ...att
            }))
        });

        return created;
    } catch (err) {
        console.error("Error adding homework attachments:", err);
        return null;
    }
}

/**
 * Remove attachment from homework
 */
export async function removeHomeworkAttachment(attachmentId) {
    try {
        await prisma.homeworkAttachment.delete({
            where: { id: attachmentId }
        });
        return true;
    } catch (err) {
        console.error("Error removing homework attachment:", err);
        return false;
    }
}

/**
 * Add targets to existing homework
 */
export async function addHomeworkTargets(homeworkId, targets) {
    try {
        const created = await prisma.homeworkTarget.createMany({
            data: targets.map(target => ({
                homeworkId,
                ...target
            }))
        });

        return created;
    } catch (err) {
        console.error("Error adding homework targets:", err);
        return null;
    }
}

/**
 * Remove target from homework
 */
export async function removeHomeworkTarget(targetId) {
    try {
        await prisma.homeworkTarget.delete({
            where: { id: targetId }
        });
        return true;
    } catch (err) {
        console.error("Error removing homework target:", err);
        return false;
    }
}

/**
 * Get homework statistics for a teacher
 */
export async function getHomeworkStatsByTeacher(teacherId) {
    try {
        const stats = await prisma.homework.groupBy({
            by: ["status"],
            where: { createdBy: teacherId },
            _count: {
                status: true
            }
        });

        return stats;
    } catch (err) {
        console.error("Error fetching homework stats:", err);
        return [];
    }
}

/**
 * Get upcoming homework (due in next N days)
 */
export async function getUpcomingHomework({
    targetType,
    targetId,
    days = 7
}) {
    try {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);

        const homework = await prisma.homework.findMany({
            where: {
                status: "PUBLISHED",
                dueDate: {
                    gte: today,
                    lte: futureDate
                },
                targets: {
                    some: {
                        targetType,
                        targetId
                    }
                }
            },
            include: {
                attachments: true,
                targets: true,
                teacher: {
                    select: {
                        teacher_id: true,
                        teacher_first_name: true,
                        teacher_middle_name: true,
                        teacher_last_name: true,
                    }
                }
            },
            orderBy: {
                dueDate: "asc"
            }
        });

        // Format homework with target names and teacher name
        return await Promise.all(homework.map(hw => formatHomeworkResponse(hw)));
    } catch (err) {
        console.error("Error fetching upcoming homework:", err);
        return [];
    }
}

/**
 * Get overdue homework
 */
export async function getOverdueHomework({
    targetType,
    targetId
}) {
    try {
        const today = new Date();

        const homework = await prisma.homework.findMany({
            where: {
                status: "PUBLISHED",
                dueDate: {
                    lt: today
                },
                targets: {
                    some: {
                        targetType,
                        targetId
                    }
                }
            },
            include: {
                attachments: true,
                targets: true,
                teacher: {
                    select: {
                        teacher_id: true,
                        teacher_first_name: true,
                        teacher_middle_name: true,
                        teacher_last_name: true,
                    }
                }
            },
            orderBy: {
                dueDate: "desc"
            }
        });

        // Format homework with target names and teacher name
        return await Promise.all(homework.map(hw => formatHomeworkResponse(hw)));
    } catch (err) {
        console.error("Error fetching overdue homework:", err);
        return [];
    }
}
