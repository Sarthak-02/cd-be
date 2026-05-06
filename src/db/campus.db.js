import { prisma } from "../prisma/prisma.js";

export async function createCampus(data) {
  return prisma.campus.create({ data });
}

export async function getCampus(campus_id) {
  return prisma.campus.findUnique({
    where: { campus_id },
  });
}

export async function getAllCampuses({ omit = {}, where = {} } = {}) {
  return prisma.campus.findMany({ omit, where });
}

export async function updateCampus(data) {
  const { campus_id, ...rest } = data;
  const updates = Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined),
  );
  if (Object.keys(updates).length === 0) {
    const err = new Error("NO_FIELDS_TO_UPDATE");
    err.code = "NO_FIELDS_TO_UPDATE";
    throw err;
  }
  return prisma.campus.update({
    where: { campus_id },
    data: updates,
  });
}

export async function deleteCampus(campus_id) {
  await prisma.campus.delete({
    where: { campus_id },
  });
}
