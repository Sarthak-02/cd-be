import { prisma } from "../prisma/prisma.js";

function parseDateOnly(value) {
  if (value == null || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseDateTime(value) {
  if (value == null || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function idsWithClassLabel(classLabel) {
  const rows = await prisma.$queryRaw`
    SELECT id FROM "Scholarship"
    WHERE classes::jsonb @> ${JSON.stringify(classLabel)}::jsonb
  `;
  return rows.map((r) => r.id);
}

async function idsWithTargetGroupLabel(targetGroupLabel) {
  const rows = await prisma.$queryRaw`
    SELECT id FROM "Scholarship"
    WHERE "targetGroup"::jsonb @> ${JSON.stringify(targetGroupLabel)}::jsonb
  `;
  return rows.map((r) => r.id);
}

function intersectSets(a, b) {
  return [...a].filter((id) => b.has(id));
}

/**
 * @param {object} data
 * @param {string} data.sourceName
 * @param {string} data.sourceType
 * @param {string} data.scholarshipName
 * @param {string} data.category
 * @param {unknown} data.classes - JSON array
 * @param {unknown} data.targetGroup - JSON array
 * @param {string} data.academicYear
 * @param {'OPEN'|'CLOSED'|'EXTENDED'|'UPCOMING'} data.status
 * @param {Date|string|null} [data.openDate]
 * @param {Date|string|null} [data.closeDate]
 * @param {string|null} [data.benefitSummary]
 * @param {string|null} [data.eligibilitySummary]
 * @param {string|null} [data.detailsUrl]
 * @param {string|null} [data.announcementUrl]
 * @param {Date|string|null} [data.lastCheckedAt]
 * @param {string} data.contentHash
 * @param {string|null} [data.rawTitle]
 */
export async function createScholarship(data) {
  return prisma.scholarship.create({
    data: {
      sourceName: data.sourceName,
      sourceType: data.sourceType,
      scholarshipName: data.scholarshipName,
      category: data.category,
      classes: data.classes,
      targetGroup: data.targetGroup,
      academicYear: data.academicYear,
      status: data.status,
      openDate: parseDateOnly(data.openDate),
      closeDate: parseDateOnly(data.closeDate),
      benefitSummary: data.benefitSummary ?? null,
      eligibilitySummary: data.eligibilitySummary ?? null,
      detailsUrl: data.detailsUrl ?? null,
      announcementUrl: data.announcementUrl ?? null,
      lastCheckedAt: parseDateTime(data.lastCheckedAt),
      contentHash: data.contentHash,
      rawTitle: data.rawTitle ?? null,
    },
  });
}

export async function getScholarshipById(id) {
  return prisma.scholarship.findUnique({ where: { id } });
}

/**
 * @param {object} filters
 * @param {string} [filters.status]
 * @param {string} [filters.academicYear]
 * @param {string} [filters.category]
 * @param {string} [filters.sourceType]
 * @param {string} [filters.classLabel] - jsonb array contains this string
 * @param {string} [filters.targetGroupLabel]
 * @param {number} [filters.limit]
 * @param {number} [filters.offset]
 */
export async function listScholarships(filters = {}) {
  const {
    status,
    academicYear,
    category,
    sourceType,
    classLabel,
    targetGroupLabel,
    limit = 50,
    offset = 0,
  } = filters;

  const take = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const skip = Math.max(Number(offset) || 0, 0);

  const where = {};

  if (status) where.status = status;
  if (academicYear) where.academicYear = academicYear;
  if (category) where.category = category;
  if (sourceType) where.sourceType = sourceType;

  let idSet = null;
  if (classLabel) {
    const ids = await idsWithClassLabel(classLabel);
    idSet = new Set(ids);
  }
  if (targetGroupLabel) {
    const ids = await idsWithTargetGroupLabel(targetGroupLabel);
    const next = new Set(ids);
    if (idSet === null) idSet = next;
    else idSet = new Set(intersectSets(idSet, next));
  }
  if (idSet !== null) {
    const ids = [...idSet];
    if (ids.length === 0) {
      return { items: [], total: 0 };
    }
    where.id = { in: ids };
  }

  const [items, total] = await Promise.all([
    prisma.scholarship.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take,
      skip,
    }),
    prisma.scholarship.count({ where }),
  ]);

  return { items, total };
}

/**
 * @param {string} id
 * @param {object} patch - partial fields (camelCase)
 */
export async function updateScholarship(id, patch) {
  const data = {};

  if (patch.sourceName !== undefined) data.sourceName = patch.sourceName;
  if (patch.sourceType !== undefined) data.sourceType = patch.sourceType;
  if (patch.scholarshipName !== undefined) data.scholarshipName = patch.scholarshipName;
  if (patch.category !== undefined) data.category = patch.category;
  if (patch.classes !== undefined) data.classes = patch.classes;
  if (patch.targetGroup !== undefined) data.targetGroup = patch.targetGroup;
  if (patch.academicYear !== undefined) data.academicYear = patch.academicYear;
  if (patch.status !== undefined) data.status = patch.status;
  if (patch.openDate !== undefined) data.openDate = parseDateOnly(patch.openDate);
  if (patch.closeDate !== undefined) data.closeDate = parseDateOnly(patch.closeDate);
  if (patch.benefitSummary !== undefined) data.benefitSummary = patch.benefitSummary;
  if (patch.eligibilitySummary !== undefined) data.eligibilitySummary = patch.eligibilitySummary;
  if (patch.detailsUrl !== undefined) data.detailsUrl = patch.detailsUrl;
  if (patch.announcementUrl !== undefined) data.announcementUrl = patch.announcementUrl;
  if (patch.lastCheckedAt !== undefined) data.lastCheckedAt = parseDateTime(patch.lastCheckedAt);
  if (patch.contentHash !== undefined) data.contentHash = patch.contentHash;
  if (patch.rawTitle !== undefined) data.rawTitle = patch.rawTitle;

  if (Object.keys(data).length === 0) {
    return getScholarshipById(id);
  }

  try {
    return await prisma.scholarship.update({
      where: { id },
      data,
    });
  } catch (err) {
    if (err.code === "P2025") return null;
    throw err;
  }
}

export async function deleteScholarship(id) {
  try {
    await prisma.scholarship.delete({ where: { id } });
    return true;
  } catch (err) {
    if (err.code === "P2025") return false;
    throw err;
  }
}
