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
      where: { teacher_id }
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
