import { prisma } from "../prisma/prisma.js";

export async function createMasterLessonPlan({ className, subject, board, academicYear, details }) {
  return prisma.masterLessonPlan.create({
    data: { className, subject, board, academicYear, details },
  });
}

export async function getMasterLessonPlanById(id) {
  return prisma.masterLessonPlan.findUnique({ where: { id } });
}

export async function listMasterLessonPlans({ className, subject, board, academicYear, limit = 50, offset = 0 }) {
  const where = {};
  if (className) where.className = className;
  if (subject) where.subject = subject;
  if (board) where.board = board;
  if (academicYear) where.academicYear = academicYear;

  const [rows, total] = await Promise.all([
    prisma.masterLessonPlan.findMany({
      where,
      orderBy: [{ academicYear: "desc" }, { className: "asc" }, { subject: "asc" }],
      take: limit,
      skip: offset,
    }),
    prisma.masterLessonPlan.count({ where }),
  ]);

  return { rows, total };
}

export async function fetchMasterLessonPlan({ className, subject, board, academicYear }) {
  const where = { className, subject, board };
  if (academicYear) where.academicYear = academicYear;

  return prisma.masterLessonPlan.findMany({
    where,
    orderBy: { academicYear: "desc" },
  });
}

export async function updateMasterLessonPlan(id, patch) {
  const data = {};
  if (patch.className !== undefined) data.className = patch.className;
  if (patch.subject !== undefined) data.subject = patch.subject;
  if (patch.board !== undefined) data.board = patch.board;
  if (patch.academicYear !== undefined) data.academicYear = patch.academicYear;
  if (patch.details !== undefined) data.details = patch.details;

  if (Object.keys(data).length === 0) return getMasterLessonPlanById(id);

  try {
    return await prisma.masterLessonPlan.update({ where: { id }, data });
  } catch (e) {
    if (e.code === "P2025") return null;
    throw e;
  }
}

export async function deleteMasterLessonPlan(id) {
  try {
    await prisma.masterLessonPlan.delete({ where: { id } });
    return true;
  } catch (e) {
    if (e.code === "P2025") return false;
    throw e;
  }
}
