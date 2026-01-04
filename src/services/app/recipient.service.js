import { prisma } from "../prisma/prisma.js";


async function resolveRecipientsForBroadcast(broadcastId, campusId) {
  const targets = await prisma.broadcastTarget.findMany({
    where: { broadcastNotificationId: broadcastId },
  });

  const studentIds = new Set();

  // STUDENT targets
  targets.forEach(t => {
    if (t.targetType === "STUDENT" && t.targetId) {
      studentIds.add(t.targetId);
    }
  });

  // SCHOOL
  if (targets.some(t => t.targetType === "SCHOOL")) {
    const students = await prisma.student.findMany({
      where: { campus_id: campusId },
      select: { student_id: true },
    });
    students.forEach(s => studentIds.add(s.student_id));
  }

  // SECTION
  const sectionIds = targets
    .filter(t => t.targetType === "SECTION")
    .map(t => t.targetId);

  if (sectionIds.length) {
    const students = await prisma.student.findMany({
      where: {
        campus_id: campusId,
        section_id: { in: sectionIds },
      },
      select: { student_id: true },
    });
    students.forEach(s => studentIds.add(s.student_id));
  }

  // CLASS
  const classIds = targets
    .filter(t => t.targetType === "CLASS")
    .map(t => t.targetId);

  if (classIds.length) {
    const students = await prisma.student.findMany({
      where: {
        campus_id: campusId,
        section: {
          class_id: { in: classIds },
        },
      },
      select: { student_id: true },
    });
    students.forEach(s => studentIds.add(s.student_id));
  }

  return Array.from(studentIds);
}

module.exports = { resolveRecipientsForBroadcast };
