import fastify from "../app.js";

export async function createTeacher(data) {
  try {
    await fastify.prisma.teacher.create({ data });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function getTeacher(teacher_id) {
  try {
    return await fastify.prisma.teacher.findUnique({
      where: { teacher_id }
    });
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function getAllTeachers() {
  try {
    return await fastify.prisma.teacher.findMany({});
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function updateTeacher(data) {
  try {
    return await fastify.prisma.teacher.update({
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
    await fastify.prisma.teacher.delete({
      where: { teacher_id },
    });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}
