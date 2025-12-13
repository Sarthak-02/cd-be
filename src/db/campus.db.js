import fastify from "../app.js";

export async function createCampus(data) {
  try {
    await fastify.prisma.campus.create({ data });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function getCampus(campus_id) {
  try {
    return await fastify.prisma.campus.findUnique({
      where: { campus_id }
    });
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function getAllCampuses(omit) {
  try {
    return await fastify.prisma.campus.findMany({omit});
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function updateCampus(data) {
  try {
    return await fastify.prisma.campus.update({
      where: { campus_id: data.campus_id },
      data,
    });
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function deleteCampus(campus_id) {
  try {
    await fastify.prisma.campus.delete({
      where: { campus_id },
    });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}
