import { prisma } from "../prisma/prisma.js";

export async function createSection(data) {
  return prisma.section.create({ data });
}

export async function getSection(section_id) {
  return prisma.section.findUnique({
    where: { section_id },
  });
}

export async function getSectionsByIds(section_ids, select = {}) {
  const ids = Array.isArray(section_ids)
    ? section_ids.filter((id) => id != null && id !== "")
    : [];
  if (ids.length === 0) return [];

  const orderBy = { section_name: "asc" };
  const where = { section_id: { in: ids } };
  const classNameRelation = {
    classRef: { select: { class_name: true } },
  };
  if (Object.keys(select).length > 0) {
    return prisma.section.findMany({
      where,
      select: { ...select, ...classNameRelation },
      orderBy,
    });
  }
  return prisma.section.findMany({
    where,
    include: classNameRelation,
    orderBy,
  });
}

export async function getAllSections({ omit = {}, where = {} } = {}) {
  return prisma.section.findMany({ omit, where });
}

export async function getSectionsByCampus(campus_id) {
  return prisma.section.findMany({
    where: {
      classRef: {
        campus_id,
      },
    },
    include: {
      classRef: true,
    },
  });
}

export async function updateSection(data) {
  const { section_id, class_id, ...rest } = data;
  const updates = Object.fromEntries(
    Object.entries(rest).filter(
      ([key, v]) => v !== undefined && key !== "campus_id",
    ),
  );
  if (class_id !== undefined && class_id !== null && class_id !== "") {
    updates.class_id = class_id;
  }
  if (Object.keys(updates).length === 0) {
    const err = new Error("NO_FIELDS_TO_UPDATE");
    err.code = "NO_FIELDS_TO_UPDATE";
    throw err;
  }
  return prisma.section.update({
    where: { section_id },
    data: updates,
  });
}

export async function deleteSection(section_id) {
  await prisma.section.delete({
    where: { section_id },
  });
}
