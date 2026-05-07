import { prisma } from "../prisma/prisma.js";

export async function createAdmission(data) {
  return prisma.admission.create({ data });
}

export async function getAdmission(admission_id) {
  return prisma.admission.findUnique({ where: { admission_id } });
}

export async function getAllAdmissions({ where = {} } = {}) {
  return prisma.admission.findMany({ where, orderBy: { createdAt: "desc" } });
}

export async function updateAdmission(data) {
  const { admission_id, ...rest } = data;
  const updates = Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined),
  );
  if (Object.keys(updates).length === 0) {
    const err = new Error("NO_FIELDS_TO_UPDATE");
    err.code = "NO_FIELDS_TO_UPDATE";
    throw err;
  }
  return prisma.admission.update({
    where: { admission_id },
    data: updates,
  });
}

export async function deleteAdmission(admission_id) {
  await prisma.admission.delete({ where: { admission_id } });
}
