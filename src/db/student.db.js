import {prisma} from "../prisma/prisma.js"

export async function createStudent(data) {
  try {
    const result = await prisma.student.create({ data });
    return result;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function getStudent(student_id) {
  try {
    return await prisma.student.findUnique({
      where: { student_id }
    });
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function getAllStudents(omit={},filters={}) {
  try {
    return await prisma.student.findMany({omit,where:filters});
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function updateStudent(data) {
  try {
    return await prisma.student.update({
      where: { student_id: data.student_id },
      data,
    });
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function deleteStudent(student_id) {
  try {
    await prisma.student.delete({
      where: { student_id },
    });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function getActiveStudentsBySection(section_id) {
  try {
    return await prisma.student.findMany({
      where: {
        student_section_id: section_id,
        student_current_status: "active"
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
        student_admission_no: true
      },
      orderBy: {
        student_roll_no: 'asc'
      }
    });
  } catch (err) {
    console.log(err);
    return null;
  }
}
