import {prisma} from "../prisma/prisma.js"

export async function createTeacher(data) {
  try {
    await prisma.teacher.create({ data });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function getTeacher(teacher_id) {
  try {
    return await prisma.teacher.findUnique({
      where: { teacher_id },
      include: {
        campus: {
          select: {
            campus_id: true,
            campus_name: true,
            extras: true
          }
        }
      }
    });
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function getAllTeachers(omit,filters) {
  try {
    return await prisma.teacher.findMany({omit,where:filters});
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function updateTeacher(data) {
  try {
    return await prisma.teacher.update({
      where: { teacher_id: data.teacher_id },
      data,
    });
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function deleteTeacher(teacher_id) {
  try {
    await prisma.teacher.delete({
      where: { teacher_id },
    });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function getTeacherPermissions(teacher_id) {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { teacher_id },
      select: {
        teacher_id: true,
        teacher_first_name: true,
        teacher_middle_name: true,
        teacher_last_name: true,
        extras: true,
        campus_id: true,
        campus: {
          select: {
            campus_id: true,
            campus_name: true,
            extras: true
          }
        }
      }
    });

    if (!teacher || !teacher.extras?.teacher_sections) {
      return null;
    }

    const sectionIds = teacher.extras.teacher_sections;
    const teacherSubjects = teacher.extras.teacher_subjects || [];

    // Fetch sections with their class, student details, and extras
    const sections = await prisma.section.findMany({
      where: {
        section_id: { in: sectionIds }
      },
      select: {
        section_id: true,
        section_name: true,
        extras: true,
        classRef: {
          select: {
            class_id: true,
            class_name: true
          }
        },
        students: {
          where: {
            student_current_status: "active"
          },
          select: {
            student_id: true,
            student_first_name: true,
            student_middle_name: true,
            student_last_name: true,
            student_roll_no: true,
            student_section_id: true
          },
          orderBy: {
            student_roll_no: 'asc'
          }
        }
      },
      orderBy: {
        section_name: 'asc'
      }
    });

    return {
      teacher_id: teacher.teacher_id,
      teacher_name: [
        teacher.teacher_first_name,
        teacher.teacher_middle_name,
        teacher.teacher_last_name
      ].filter(Boolean).join(' '),
      teacher_subjects: teacherSubjects,
      campus_id: teacher.campus_id,
      campus_name: teacher.campus.campus_name,
      campus_grades_notification: teacher.campus.extras?.campus_grades_notification || null,
      campus_exam_types: teacher.campus.extras?.campus_exam_types || null,
      permissions: sections
    };
  } catch (err) {
    console.log(err);
    return null;
  }
}
