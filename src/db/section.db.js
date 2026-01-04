import {prisma} from "../prisma/prisma.js"

export async function createSection(data) {
  try {
    await prisma.section.create({ data });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function getSection(section_id) {
  try {
    return await prisma.section.findUnique({
      where: { section_id }
    });
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function getAllSections(omit={},filter={}) {
  try {
    return await prisma.section.findMany({omit,where:{}});
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function getSectionsByCampus(campus_id) {
  try {
    return await prisma.section.findMany({
      where: {
        classRef: {
          campus_id,
        },
      },
      include: {
        classRef: true, // optional
      },
    });
  } catch (err) {
    console.log(err);
    return null;
  }
}


export async function updateSection(data) {
  try {
    return await prisma.section.update({
      where: { section_id: data.section_id },
      data,
    });
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function deleteSection(section_id) {
  try {
    await prisma.section.delete({
      where: { section_id },
    });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}
