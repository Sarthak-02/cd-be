import {prisma} from "../prisma/prisma.js"

export async function bulkCreateEndUsers(records) {
  return prisma.endUser.createMany({
    data: records,
    skipDuplicates: true,
  });
}

export async function createEndUser(data) {
  try {
    return await prisma.endUser.create({ data });
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function getEndUser(id) {
  try {
    return await prisma.endUser.findUnique({
      where: { id },
    });
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function getEndUserByUserid(userid, omit = {}) {
  try {
    return await prisma.endUser.findUnique({
      where: { userid },
      omit,
    });
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function getEndUserByUsername(username, omit = {}) {
  try {
    return await prisma.endUser.findUnique({
      where: { username },
      omit,
    });
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function getAllEndUsers(omit = {}, filters = {}) {
  try {
    return await prisma.endUser.findMany({ omit, where: filters });
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function updateEndUser(data) {
  try {
    return await prisma.endUser.update({
      where: { id: data.id },
      data,
    });
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function updateEndUserByUserid(userid, data) {
  try {
    return await prisma.endUser.update({
      where: { userid },
      data,
    });
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function incrementTokenVersion(userid) {
  try {
    return await prisma.endUser.update({
      where: { userid },
      data: { tokenVersion: { increment: 1 } },
    });
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function deleteEndUser(id) {
  try {
    await prisma.endUser.delete({
      where: { id },
    });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function deleteEndUserByUserid(userid) {
  try {
    await prisma.endUser.delete({
      where: { userid },
    });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}
