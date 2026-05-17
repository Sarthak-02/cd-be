import { prisma } from "../prisma/prisma.js";
import { blindIndex } from "../utils/crypto.js";

export async function createParentRow(data) {
  return prisma.parent.create({ data });
}

export async function getParentById(parent_id) {
  return prisma.parent.findUnique({ where: { parent_id } });
}

export async function getParentsByStudentId(student_id) {
  return prisma.parent.findMany({
    where: { student_id },
    orderBy: { createdAt: "asc" },
  });
}

export async function getParentsByPhone(phone) {
  return prisma.parent.findMany({
    where: { phone_hash: blindIndex(phone) },
  });
}

export async function updateParent(parent_id, data) {
  return prisma.parent.update({ where: { parent_id }, data });
}

export async function deleteParent(parent_id) {
  return prisma.parent.delete({ where: { parent_id } });
}

export async function upsertParentByStudentAndPhone(data) {
  const { student_id, phone } = data;
  const ph = phone != null ? blindIndex(phone) : null;

  // The old @@unique([student_id, phone]) is gone; use phone_hash for lookup.
  const existing = await prisma.parent.findFirst({
    where: { student_id, phone_hash: ph },
  });

  if (existing) {
    return prisma.parent.update({
      where: { parent_id: existing.parent_id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        relation_type: data.relation_type,
      },
    });
  }

  return prisma.parent.create({ data });
}
