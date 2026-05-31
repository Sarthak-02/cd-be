import { prisma } from "../prisma/prisma.js";

const groupInclude = {
    teacher: {
        select: {
            teacher_id: true,
            teacher_first_name: true,
            teacher_middle_name: true,
            teacher_last_name: true,
        },
    },
    members: {
        include: {
            student: {
                select: {
                    student_id: true,
                    student_first_name: true,
                    student_middle_name: true,
                    student_last_name: true,
                    student_roll_no: true,
                    student_section_id: true,
                },
            },
        },
        orderBy: { addedAt: "asc" },
    },
    _count: { select: { members: true } },
};

export async function createStudentGroup({ name, description, campusId, createdBy }) {
    return prisma.studentGroup.create({
        data: { name, description, campusId, createdBy },
        include: groupInclude,
    });
}

export async function getStudentGroupById(groupId) {
    return prisma.studentGroup.findUnique({
        where: { id: groupId },
        include: groupInclude,
    });
}

export async function getStudentGroupsByCampus({ campusId, createdBy, limit = 50, offset = 0 }) {
    const where = { campusId, ...(createdBy ? { createdBy } : {}) };
    return prisma.studentGroup.findMany({
        where,
        include: {
            teacher: {
                select: {
                    teacher_id: true,
                    teacher_first_name: true,
                    teacher_middle_name: true,
                    teacher_last_name: true,
                },
            },
            _count: { select: { members: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
    });
}

export async function updateStudentGroup({ groupId, name, description }) {
    return prisma.studentGroup.update({
        where: { id: groupId },
        data: {
            ...(name !== undefined ? { name } : {}),
            ...(description !== undefined ? { description } : {}),
        },
        include: groupInclude,
    });
}

export async function deleteStudentGroup(groupId) {
    return prisma.studentGroup.delete({ where: { id: groupId } });
}

export async function addStudentGroupMembers(groupId, studentIds) {
    await prisma.studentGroupMember.createMany({
        data: studentIds.map((studentId) => ({ groupId, studentId })),
        skipDuplicates: true,
    });
    return prisma.studentGroup.findUnique({
        where: { id: groupId },
        include: groupInclude,
    });
}

export async function removeStudentGroupMembers(groupId, studentIds) {
    await prisma.studentGroupMember.deleteMany({
        where: { groupId, studentId: { in: studentIds } },
    });
    return prisma.studentGroup.findUnique({
        where: { id: groupId },
        include: groupInclude,
    });
}

export async function getStudentIdsByGroup(groupId) {
    const members = await prisma.studentGroupMember.findMany({
        where: { groupId },
        select: { studentId: true },
    });
    return members.map((m) => m.studentId);
}
