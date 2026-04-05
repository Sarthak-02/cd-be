import { prisma } from "../prisma/prisma.js";

export async function createUser(data) {
  return prisma.user.create({ data });
}

export async function getUser(userid, omit = {}) {
  return prisma.user.findUnique({
    where: { userid },
    omit,
  });
}

export async function getAllUsers() {
  return prisma.user.findMany({
    omit: { password: true },
  });
}

export async function updateUser(data) {
  const { userid, ...rest } = data;
  const updates = Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined),
  );
  if (Object.keys(updates).length === 0) {
    const err = new Error("NO_FIELDS_TO_UPDATE");
    err.code = "NO_FIELDS_TO_UPDATE";
    throw err;
  }
  return prisma.user.update({
    where: { userid },
    data: updates,
  });
}

export async function deleteUser(userid) {
  await prisma.user.delete({
    where: { userid },
  });
}
