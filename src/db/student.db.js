import { prisma } from "../prisma/prisma.js";
import { getCampusTierPermissionsByRole } from "./campusTierPermission.db.js";

export async function createStudent(data) {
  const { subject_ids, ...studentData } = data;
  return prisma.student.create({ data: studentData });
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
  const { student_id, campus_id, student_section_id, subject_ids, ...rest } = data;
  const updates = Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined),
  );

  if (student_section_id !== undefined) {
    updates.section = student_section_id
      ? { connect: { section_id: student_section_id } }
      : { disconnect: true };
  }

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

export async function getStudentPermissions(student_id) {
  try {
    const student = await prisma.student.findUnique({
      where: { student_id },
      include: {
        campus: {
          select: {
            campus_id: true,
            campus_name: true,
            extras: true,
          },
        },
        section: {
          select: {
            section_id: true,
            section_name: true,
            extras: true,
            classRef: {
              select: {
                class_id: true,
                class_name: true,
              },
            },
          },
        },
      },
    });

    if (!student) return null;

    const tierPermissions = await getCampusTierPermissionsByRole({
      campus_id: student.campus_id,
      role: "student",
    });

    const campus = {
      campus_id: student.campus.campus_id,
      campus_name: student.campus.campus_name,
      term_start_date: student.campus.extras?.term_start_date || null,
      term_end_date: student.campus.extras?.term_end_date || null,
      academic_calendar: student.campus.extras?.academic_calendar || null,
    };

    const details = {
      student_id: student.student_id,
      student_first_name: student.student_first_name,
      student_middle_name: student.student_middle_name,
      student_last_name: student.student_last_name,
      student_admission_no: student.student_admission_no,
      student_roll_no: student.student_roll_no,
      student_photo_url: student.student_photo_url,
      student_gender: student.student_gender,
      student_dob: student.student_dob,
      student_current_status: student.student_current_status,
      student_section_id: student.student_section_id,
      campus_id: student.campus_id,
      extras: student.extras,
    };

    const section = student.section
      ? {
          section_id: student.section.section_id,
          section_name: student.section.section_name,
          section_subjects: student.section.extras?.section_subjects || [],
          class_id: student.section.classRef?.class_id || null,
          class_name: student.section.classRef?.class_name || null,
        }
      : null;

    const studentClassId = student.section?.classRef?.class_id || null;
    const features = tierPermissions
      .filter(
        (p) =>
          p.enabled &&
          (p.class_ids.length === 0 ||
            (studentClassId && p.class_ids.includes(studentClassId)))
      )
      .map((p) => p.feature_id);

    return {
      campus,
      details,
      section,
      student_subjects: student.student_subjects ?? [],
      features,
    };
  } catch (err) {
    console.log(err);
    return null;
  }
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
