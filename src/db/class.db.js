import fastify from "../app.js";

export async function createClass(data) {
  try {
    await fastify.prisma.class.create({ data });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function getClass(class_id) {
  try {
    return await fastify.prisma.class.findUnique({
      where: { class_id }
    });
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function getAllClasses(omit={},filter={}) {
  try {
    return await fastify.prisma.class.findMany({omit , where :filter});
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function updateClass(data) {
  try {
    return await fastify.prisma.class.update({
      where: { class_id: data.class_id },
      data,
    });
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function deleteClass(class_id) {
  try {
    await fastify.prisma.class.delete({
      where: { class_id },
    });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}
