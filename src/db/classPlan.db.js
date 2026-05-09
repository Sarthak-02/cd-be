import { prisma } from "../prisma/prisma.js";

const progressInclude = {
  materials: { orderBy: { createdAt: "asc" } },
  assignments: { orderBy: { createdAt: "asc" } },
  quizzes: { orderBy: { createdAt: "asc" } },
};

// Used for mutation responses (topic-level, no sectionId filter needed)
const topicInclude = {
  progress: { include: progressInclude },
};

// Used for full class plan reads — filters topic progress to the given section
const makeClassPlanInclude = (sectionId) => ({
  topics: {
    orderBy: [{ chapterNumber: "asc" }, { displayOrder: "asc" }],
    include: {
      progress: {
        where: sectionId ? { sectionId } : {},
        include: progressInclude,
        orderBy: { createdAt: "asc" },
      },
    },
  },
  masterPlan: {
    select: { id: true, className: true, subject: true, board: true, academicYear: true },
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
});

async function resolveClassIdFromSection(sectionId) {
  const section = await prisma.section.findUnique({
    where: { section_id: sectionId },
    select: { class_id: true },
  });
  return section?.class_id ?? null;
}

// ─── Seed from Master ─────────────────────────────────────────────────────────

export async function seedClassPlanFromMaster({
  board,
  subject,
  classId,
  academicYear,
  campusId,
  teacherId,
  isPublished = false,
}) {
  const masterPlan = await prisma.masterLessonPlan.findUnique({
    where: { className_subject_board_academicYear: { className: classId, subject, board, academicYear } },
  });

  if (!masterPlan) return { ok: false, message: "No master lesson plan found for the given board, subject, class, and academic year" };

  const details = Array.isArray(masterPlan.details) ? masterPlan.details : [];
  const topicRows = [];
  details.forEach((chapter, chapterIdx) => {
    const chapterNumber = chapterIdx + 1;
    const chapterTitle = chapter.chapter ?? chapter.chapter_title ?? `Chapter ${chapterNumber}`;
    const topics = Array.isArray(chapter.topics) ? chapter.topics : [];
    topics.forEach((title, topicIdx) => {
      topicRows.push({
        chapterTitle,
        chapterNumber,
        title: typeof title === "string" ? title : title.title ?? String(title),
        displayOrder: topicIdx + 1,
      });
    });
  });

  const plan = await prisma.classPlan.create({
    data: {
      masterPlanId: masterPlan.id,
      campusId,
      teacherId,
      classId,
      subject,
      academicYear,
      isPublished,
      topics: topicRows.length ? { create: topicRows } : undefined,
    },
    include: makeClassPlanInclude(),
  });

  return { ok: true, plan };
}

// ─── Class Plan ───────────────────────────────────────────────────────────────

export async function createClassPlan({
  masterPlanId,
  campusId,
  teacherId,
  classId,
  subject,
  academicYear,
  isPublished = false,
  topics = [],
}) {
  return prisma.classPlan.create({
    data: {
      masterPlanId: masterPlanId ?? null,
      campusId,
      teacherId,
      classId,
      subject,
      academicYear,
      isPublished,
      topics: topics.length ? { create: topics } : undefined,
    },
    include: makeClassPlanInclude(),
  });
}

export async function getClassPlanById(id, sectionId) {
  return prisma.classPlan.findUnique({ where: { id }, include: makeClassPlanInclude(sectionId) });
}

export async function listClassPlans({
  campusId,
  teacherId,
  sectionId,
  classId,
  subject,
  academicYear,
  isPublished,
  limit = 50,
  offset = 0,
}) {
  // Resolve sectionId → classId when section_id is the entry point
  if (sectionId && !classId) {
    classId = await resolveClassIdFromSection(sectionId);
    if (!classId) return { rows: [], total: 0 };
  }

  const where = {};
  if (campusId) where.campusId = campusId;
  if (teacherId) where.teacherId = teacherId;
  if (classId) where.classId = classId;
  if (subject) where.subject = subject;
  if (academicYear) where.academicYear = academicYear;
  if (isPublished !== undefined) where.isPublished = isPublished;

  const [rows, total] = await Promise.all([
    prisma.classPlan.findMany({
      where,
      include: makeClassPlanInclude(sectionId),
      orderBy: [{ academicYear: "desc" }, { classId: "asc" }, { subject: "asc" }],
      take: limit,
      skip: offset,
    }),
    prisma.classPlan.count({ where }),
  ]);

  return { rows, total };
}

export async function updateClassPlan(id, patch) {
  const data = {};
  if (patch.masterPlanId !== undefined) data.masterPlanId = patch.masterPlanId;
  if (patch.classId !== undefined) data.classId = patch.classId;
  if (patch.subject !== undefined) data.subject = patch.subject;
  if (patch.academicYear !== undefined) data.academicYear = patch.academicYear;
  if (patch.isPublished !== undefined) data.isPublished = patch.isPublished;

  if (Object.keys(data).length === 0) return getClassPlanById(id);

  try {
    return await prisma.classPlan.update({ where: { id }, data, include: makeClassPlanInclude() });
  } catch (e) {
    if (e.code === "P2025") return null;
    throw e;
  }
}

export async function deleteClassPlan(id) {
  try {
    await prisma.classPlan.delete({ where: { id } });
    return true;
  } catch (e) {
    if (e.code === "P2025") return false;
    throw e;
  }
}

// ─── Topics ───────────────────────────────────────────────────────────────────

export async function addClassPlanTopics(classPlanId, topics, sectionId) {
  await prisma.classPlanTopic.createMany({
    data: topics.map((t) => ({ ...t, classPlanId })),
  });
  return getClassPlanById(classPlanId, sectionId);
}

export async function updateClassPlanTopic(topicId, patch) {
  const data = {};
  for (const f of ["chapterTitle", "chapterNumber", "title", "displayOrder"]) {
    if (patch[f] !== undefined) data[f] = patch[f];
  }

  try {
    return await prisma.classPlanTopic.update({
      where: { id: topicId },
      data,
      include: topicInclude,
    });
  } catch (e) {
    if (e.code === "P2025") return null;
    throw e;
  }
}

export async function deleteClassPlanTopic(topicId) {
  try {
    await prisma.classPlanTopic.delete({ where: { id: topicId } });
    return true;
  } catch (e) {
    if (e.code === "P2025") return false;
    throw e;
  }
}

export async function getTopicClassPlanId(topicId) {
  const row = await prisma.classPlanTopic.findUnique({
    where: { id: topicId },
    select: { classPlanId: true },
  });
  return row?.classPlanId ?? null;
}

// ─── Topic Progress ───────────────────────────────────────────────────────────

export async function createTopicProgress(topicId, sectionId, data) {
  return prisma.classPlanTopicProgress.create({
    data: {
      topicId,
      sectionId,
      status: data.status ?? "PENDING",
      scheduledDate: data.scheduledDate ?? null,
      completedOn: data.completedOn ?? null,
      actualDurationMins: data.actualDurationMins ?? null,
      teacherNotes: data.teacherNotes ?? null,
      isAddedByTeacher: data.isAddedByTeacher ?? false,
    },
    include: progressInclude,
  });
}

export async function updateTopicProgress(progressId, patch) {
  const data = {};
  const fields = ["status", "scheduledDate", "completedOn", "actualDurationMins", "teacherNotes", "isAddedByTeacher"];
  for (const f of fields) {
    if (patch[f] !== undefined) data[f] = patch[f];
  }

  try {
    return await prisma.classPlanTopicProgress.update({
      where: { id: progressId },
      data,
      include: progressInclude,
    });
  } catch (e) {
    if (e.code === "P2025") return null;
    throw e;
  }
}

export async function deleteTopicProgress(progressId) {
  try {
    await prisma.classPlanTopicProgress.delete({ where: { id: progressId } });
    return true;
  } catch (e) {
    if (e.code === "P2025") return false;
    throw e;
  }
}

export async function getProgressTopicId(progressId) {
  const row = await prisma.classPlanTopicProgress.findUnique({
    where: { id: progressId },
    select: { topicId: true },
  });
  return row?.topicId ?? null;
}

// ─── Materials ────────────────────────────────────────────────────────────────

export async function addTopicMaterial(progressId, { fileName, fileUrl }) {
  return prisma.topicMaterial.create({ data: { progressId, fileName, fileUrl } });
}

export async function deleteTopicMaterial(materialId) {
  try {
    await prisma.topicMaterial.delete({ where: { id: materialId } });
    return true;
  } catch (e) {
    if (e.code === "P2025") return false;
    throw e;
  }
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export async function addTopicAssignment(progressId, { title, dueDate, fileUrl, status = "DRAFT" }) {
  return prisma.topicAssignment.create({
    data: {
      progressId,
      title,
      dueDate: dueDate ? new Date(dueDate) : null,
      fileUrl: fileUrl ?? null,
      status,
    },
  });
}

export async function updateTopicAssignment(assignmentId, patch) {
  const data = {};
  if (patch.title !== undefined) data.title = patch.title;
  if (patch.dueDate !== undefined) data.dueDate = patch.dueDate ? new Date(patch.dueDate) : null;
  if (patch.fileUrl !== undefined) data.fileUrl = patch.fileUrl;
  if (patch.status !== undefined) data.status = patch.status;

  try {
    return await prisma.topicAssignment.update({ where: { id: assignmentId }, data });
  } catch (e) {
    if (e.code === "P2025") return null;
    throw e;
  }
}

export async function deleteTopicAssignment(assignmentId) {
  try {
    await prisma.topicAssignment.delete({ where: { id: assignmentId } });
    return true;
  } catch (e) {
    if (e.code === "P2025") return false;
    throw e;
  }
}

// ─── Quizzes ──────────────────────────────────────────────────────────────────

export async function addTopicQuiz(progressId, { title, generatedByAi = false, fileUrl }) {
  return prisma.topicQuiz.create({
    data: { progressId, title, generatedByAi, fileUrl: fileUrl ?? null },
  });
}

export async function updateTopicQuiz(quizId, patch) {
  const data = {};
  if (patch.title !== undefined) data.title = patch.title;
  if (patch.generatedByAi !== undefined) data.generatedByAi = patch.generatedByAi;
  if (patch.fileUrl !== undefined) data.fileUrl = patch.fileUrl;

  try {
    return await prisma.topicQuiz.update({ where: { id: quizId }, data });
  } catch (e) {
    if (e.code === "P2025") return null;
    throw e;
  }
}

export async function deleteTopicQuiz(quizId) {
  try {
    await prisma.topicQuiz.delete({ where: { id: quizId } });
    return true;
  } catch (e) {
    if (e.code === "P2025") return false;
    throw e;
  }
}
