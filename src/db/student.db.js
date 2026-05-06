import { prisma } from "../prisma/prisma.js";

export async function createStudent(data) {
  return prisma.student.create({ data });
}

export async function getStudent(student_id) {
  return prisma.student.findUnique({
    where: { student_id },
    include: {
      campus: {
        select: {
          campus_id: true,
          campus_name: true,
          extras: true,
        },
      },
    },
  });
}

export async function getAllStudents({ omit = {}, where = {} } = {}) {
  return prisma.student.findMany({ omit, where });
}

export async function updateStudent(data) {
  const { student_id, ...rest } = data;
  const updates = Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined),
  );
  if (Object.keys(updates).length === 0) {
    const err = new Error("NO_FIELDS_TO_UPDATE");
    err.code = "NO_FIELDS_TO_UPDATE";
    throw err;
  }
  return prisma.student.update({
    where: { student_id },
    data: updates,
  });
}

export async function deleteStudent(student_id) {
  await prisma.student.delete({
    where: { student_id },
  });
}

export async function getActiveStudentsBySection(section_id) {
  return prisma.student.findMany({
    where: {
      student_section_id: section_id,
      student_current_status: "active",
    },
    select: {
      student_id: true,
      student_first_name: true,
      student_middle_name: true,
      student_last_name: true,
      student_photo_url: true,
      student_gender: true,
      student_dob: true,
      student_roll_no: true,
      student_admission_no: true,
    },
    orderBy: {
      student_roll_no: "asc",
    },
  });
}
