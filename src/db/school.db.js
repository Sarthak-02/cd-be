import { prisma } from "../prisma/prisma.js";

function normalizeSchoolIds(ids) {
  if (!Array.isArray(ids)) return [];
  return ids
    .map((p) =>
      p && typeof p === "object" && "value" in p ? p.value : p,
    )
    .filter((id) => id != null && id !== "");
}

export async function createSchool(data) {
  return prisma.school.create({ data });
}

export async function getSchool(school_id) {
  return prisma.school.findUnique({
    where: { school_id },
  });
}

export async function getSchools(all_school_id) {
  const ids = normalizeSchoolIds(all_school_id);
  if (ids.length === 0) return [];
  return prisma.school.findMany({
    where: { school_id: { in: ids } },
  });
}

export async function getAllSchools({ omit = {} } = {}) {
  return prisma.school.findMany({ omit });
}

export async function updateSchool(data) {
  const { school_id, ...rest } = data;
  const updates = Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined),
  );
  if (Object.keys(updates).length === 0) {
    const err = new Error("NO_FIELDS_TO_UPDATE");
    err.code = "NO_FIELDS_TO_UPDATE";
    throw err;
  }
  return prisma.school.update({
    where: { school_id },
    data: updates,
  });
}

export async function deleteSchool(school_id) {
  await prisma.school.delete({
    where: { school_id },
  });
}
