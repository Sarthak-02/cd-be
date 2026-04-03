import { prisma } from "../prisma/prisma.js";

const lessonPlanInclude = {
  attachments: true,
  subject: {
    select: {
      subject_id: true,
      subject_name: true,
      subject_code: true,
    },
  },
  classRef: {
    select: {
      class_id: true,
      class_name: true,
      class_short_name: true,
    },
  },
  section: {
    select: {
      section_id: true,
      section_name: true,
      section_short_name: true,
    },
  },
  teacher: {
    select: {
      teacher_id: true,
      teacher_first_name: true,
      teacher_middle_name: true,
      teacher_last_name: true,
      teacher_employee_code: true,
    },
  },
};

function mapLessonPlanRow(row) {
  if (!row) return null;
  const { classRef, ...rest } = row;
  return {
    ...rest,
    class: classRef,
  };
}

export async function validateLessonPlanScope({
  teacherId,
  subjectId,
  classId,
  sectionId,
}) {
  const teacher = await prisma.teacher.findUnique({
    where: { teacher_id: teacherId },
    select: { campus_id: true },
  });
  if (!teacher) return { ok: false, message: "Teacher not found" };

  const subject = await prisma.subject.findUnique({
    where: { subject_id: subjectId },
    select: { campus_id: true },
  });
  if (!subject) return { ok: false, message: "Subject not found" };
  if (subject.campus_id !== teacher.campus_id) {
    return { ok: false, message: "Subject is not in the teacher's campus" };
  }

  const classRow = await prisma.class.findUnique({
    where: { class_id: classId },
    select: { campus_id: true },
  });
  if (!classRow) return { ok: false, message: "Class not found" };
  if (classRow.campus_id !== teacher.campus_id) {
    return { ok: false, message: "Class is not in the teacher's campus" };
  }

  if (sectionId) {
    const section = await prisma.section.findUnique({
      where: { section_id: sectionId },
      select: { class_id: true },
    });
    if (!section) return { ok: false, message: "Section not found" };
    if (section.class_id !== classId) {
      return { ok: false, message: "Section does not belong to the given class" };
    }
  }

  return { ok: true, campusId: teacher.campus_id };
}

export async function createLessonPlan({
  lessonDate,
  chapterTopic,
  learningObjectives,
  activities,
  homework,
  status = "PLANNED",
  subjectId,
  classId,
  sectionId,
  teacherId,
  campusId,
  attachments = [],
}) {
  const plan = await prisma.lessonPlan.create({
    data: {
      lessonDate: new Date(lessonDate),
      chapterTopic,
      learningObjectives,
      activities,
      homework: homework ?? null,
      status,
      subjectId,
      classId,
      sectionId: sectionId ?? null,
      teacherId,
      campusId,
      attachments: attachments.length
        ? {
            create: attachments,
          }
        : undefined,
    },
    include: lessonPlanInclude,
  });
  return mapLessonPlanRow(plan);
}

export async function getLessonPlanById(lessonPlanId) {
  const plan = await prisma.lessonPlan.findUnique({
    where: { id: lessonPlanId },
    include: lessonPlanInclude,
  });
  return mapLessonPlanRow(plan);
}

export async function listLessonPlans({
  teacherId,
  campusId,
  subjectId,
  classId,
  sectionId,
  status,
  startDate,
  endDate,
  limit = 50,
  offset = 0,
}) {
  const where = {};

  if (teacherId) where.teacherId = teacherId;
  if (campusId) where.campusId = campusId;
  if (subjectId) where.subjectId = subjectId;
  if (classId) where.classId = classId;
  if (sectionId !== undefined && sectionId !== null && sectionId !== "") {
    where.sectionId = sectionId;
  }
  if (status) where.status = status;

  if (startDate || endDate) {
    where.lessonDate = {};
    if (startDate) where.lessonDate.gte = new Date(startDate);
    if (endDate) where.lessonDate.lte = new Date(endDate);
  }

  const rows = await prisma.lessonPlan.findMany({
    where,
    include: lessonPlanInclude,
    orderBy: { lessonDate: "desc" },
    take: limit,
    skip: offset,
  });

  return rows.map(mapLessonPlanRow);
}

export async function updateLessonPlan(lessonPlanId, patch) {
  const data = {};

  if (patch.lessonDate !== undefined) data.lessonDate = new Date(patch.lessonDate);
  if (patch.chapterTopic !== undefined) data.chapterTopic = patch.chapterTopic;
  if (patch.learningObjectives !== undefined) {
    data.learningObjectives = patch.learningObjectives;
  }
  if (patch.activities !== undefined) data.activities = patch.activities;
  if (patch.homework !== undefined) data.homework = patch.homework;
  if (patch.status !== undefined) data.status = patch.status;
  if (patch.subjectId !== undefined) data.subjectId = patch.subjectId;
  if (patch.classId !== undefined) data.classId = patch.classId;
  if (patch.sectionId !== undefined) {
    data.sectionId = patch.sectionId === null ? null : patch.sectionId;
  }

  if (Object.keys(data).length === 0) {
    return getLessonPlanById(lessonPlanId);
  }

  try {
    const plan = await prisma.lessonPlan.update({
      where: { id: lessonPlanId },
      data,
      include: lessonPlanInclude,
    });
    return mapLessonPlanRow(plan);
  } catch (e) {
    if (e.code === "P2025") return null;
    throw e;
  }
}

export async function deleteLessonPlan(lessonPlanId) {
  try {
    await prisma.lessonPlan.delete({ where: { id: lessonPlanId } });
    return true;
  } catch (e) {
    if (e.code === "P2025") return false;
    throw e;
  }
}

export async function addLessonPlanAttachments(lessonPlanId, attachments) {
  if (!attachments?.length) return getLessonPlanById(lessonPlanId);

  await prisma.lessonPlanAttachment.createMany({
    data: attachments.map((a) => ({
      lessonPlanId,
      fileUrl: a.fileUrl,
      fileName: a.fileName,
      fileType: a.fileType,
      fileSize: a.fileSize,
    })),
  });

  return getLessonPlanById(lessonPlanId);
}

export async function removeLessonPlanAttachment(attachmentId) {
  try {
    await prisma.lessonPlanAttachment.delete({ where: { id: attachmentId } });
    return true;
  } catch (e) {
    if (e.code === "P2025") return false;
    throw e;
  }
}

export async function getAttachmentLessonPlanId(attachmentId) {
  const row = await prisma.lessonPlanAttachment.findUnique({
    where: { id: attachmentId },
    select: { lessonPlanId: true },
  });
  return row?.lessonPlanId ?? null;
}
