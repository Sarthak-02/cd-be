import { prisma } from "../prisma/prisma.js";


export async function createParentRow(data) {
    return prisma.parent.create({
        data,
    });
}

export async function getParentById(parent_id) {
    return prisma.parent.findUnique({
        where: { parent_id },
    });
}

export async function getParentsByStudentId(student_id) {
    return prisma.parent.findMany({
        where: { student_id },
        orderBy: { createdAt: "asc" },
    });
}

export async function getParentsByPhone(phone) {
    return prisma.parent.findMany({
        where: { phone },
    });
}

export async function updateParent(
    parent_id,
    data
) {
    return prisma.parent.update({
        where: { parent_id },
        data,
    });
}

export async function deleteParent(parent_id) {
    return prisma.parent.delete({
        where: { parent_id },
    });
}

export async function upsertParentByStudentAndPhone(data) {
    return prisma.parent.upsert({
        where: {
            student_id_phone: { student_id: data.student_id, phone: data.phone, },
        },
        update: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            relation_type: data.relation_type,
        },
        create: data,
    });
}
