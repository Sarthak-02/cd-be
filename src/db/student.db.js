import {prisma} from "../prisma/prisma.js"

export async function createStudent(data) {
  try {
    await prisma.student.create({ data });
    return true;
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
