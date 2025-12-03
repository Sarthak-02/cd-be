import fastify from "../app.js";

export async function createSchool(data) {
  try {
    await fastify.prisma.school.create({ data });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function getSchool(school_id) {
  try {
    return await fastify.prisma.school.findUnique({
      where: { school_id }
    });
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function getSchools(all_school_id) {
  try {
    return await fastify.prisma.school.findMany({
      where: {
        school_id: { in: all_school_id }
      }
    });
  } catch (err) {
    console.error(err);
    return null;
  }
}


export async function getAllSchools(omit={}) {
  try {
    return await fastify.prisma.school.findMany({omit});
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function updateSchool(data) {
  try {
    return await fastify.prisma.school.update({
      where: { school_id: data.school_id },
      data,
    });
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function deleteSchool(school_id) {
  try {
    await fastify.prisma.school.delete({
      where: { school_id },
    });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}
