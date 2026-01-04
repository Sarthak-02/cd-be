import {prisma} from "../prisma/prisma.js"

export async function createCampus(data) {
  try {
    await prisma.campus.create({ data });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function getCampus(campus_id) {
  try {
    return await prisma.campus.findUnique({
      where: { campus_id }
    });
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function getAllCampuses(omit) {
  try {
    return await prisma.campus.findMany({omit});
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function updateCampus(data) {
  try {
    return await prisma.campus.update({
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
    await prisma.campus.delete({
      where: { campus_id },
    });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}
