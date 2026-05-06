import { prisma } from "../prisma/prisma.js";

export async function createClass(data) {
  return prisma.class.create({ data });
}

export async function getClass(class_id) {
  return prisma.class.findUnique({
    where: { class_id },
  });
}

export async function getAllClasses({ omit = {}, where = {} } = {}) {
  return prisma.class.findMany({ omit, where });
}

export async function updateClass(data) {
  const { class_id, ...rest } = data;
  const updates = Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined),
  );
  if (Object.keys(updates).length === 0) {
    const err = new Error("NO_FIELDS_TO_UPDATE");
    err.code = "NO_FIELDS_TO_UPDATE";
    throw err;
  }
  return prisma.class.update({
    where: { class_id },
    data: updates,
  });
}

export async function deleteClass(class_id) {
  await prisma.class.delete({
    where: { class_id },
  });
}
