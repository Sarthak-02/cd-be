import { prisma } from "../prisma/prisma.js";


export async function resolveRecipientsForBroadcast(broadcastId, campusId) {
  const targets = await prisma.broadcastTarget.findMany({
    where: { broadcastNotificationId: broadcastId },
  });

  // key = receiverId, value = { receiverId, targetType, targetId }
  const receiverMap = new Map();

  const addReceiver = (receiverId, targetType, targetId) => {
    if (!receiverMap.has(receiverId)) {
      receiverMap.set(receiverId, {
        receiverId,
        targetType,
        targetId,
      });
    }
  };

  // 1️⃣ STUDENT targets
  targets.forEach(t => {
    if (t.targetType === "STUDENT" && t.targetId) {
      addReceiver(t.targetId, "STUDENT", t.targetId);
    }
  });

  // 2️⃣ CAMPUS targets
  if (targets.some(t => t.targetType === "CAMPUS")) {
    const receivers = await prisma.student.findMany({
      where: { campus_id: campusId },
      select: { student_id: true },
    });

    receivers.forEach(s =>
      addReceiver(s.student_id, "CAMPUS", campusId)
    );
  }

  // 3️⃣ SECTION targets
  const sectionIds = targets
    .filter(t => t.targetType === "SECTION")
    .map(t => t.targetId);

  if (sectionIds.length) {
    const receivers = await prisma.student.findMany({
      where: {
        campus_id: campusId,
        section_id: { in: sectionIds },
      },
      select: { student_id: true, section_id: true },
    });

    receivers.forEach(s =>
      addReceiver(s.student_id, "SECTION", s.section_id)
    );
  }

  // 4️⃣ CLASS targets
  const classIds = targets
    .filter(t => t.targetType === "CLASS")
    .map(t => t.targetId);

  if (classIds.length) {
    const receivers = await prisma.student.findMany({
      where: {
        campus_id: campusId,
        section: {
          class_id: { in: classIds },
        },
      },
      select: {
        student_id: true,
        section: { select: { class_id: true } },
      },
    });

    receivers.forEach(s =>
      addReceiver(s.student_id, "CLASS", s.section.class_id)
    );
  }

  return Array.from(receiverMap.values());
}


