import { prisma } from "../prisma/prisma.js";

export async function createReportDashboardConfig(data) {
  return prisma.reportDashboardConfig.create({ data });
}

export async function getReportDashboardConfig(id) {
  return prisma.reportDashboardConfig.findUnique({ where: { id } });
}

export async function getAllReportDashboardConfigs(campusId) {
  return prisma.reportDashboardConfig.findMany({
    where: { campusId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateReportDashboardConfig(id, updates) {
  return prisma.reportDashboardConfig.update({
    where: { id },
    data: updates,
  });
}

export async function deleteReportDashboardConfig(id) {
  return prisma.reportDashboardConfig.delete({ where: { id } });
}

export async function getPublishedConfigForSection(campusId, classId) {
  return prisma.reportDashboardConfig.findFirst({
    where: {
      campusId,
      status: "PUBLISHED",
      enabledClasses: { array_contains: classId },
    },
  });
}
