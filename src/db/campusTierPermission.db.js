import { prisma } from "../prisma/prisma.js";

export async function upsertCampusTierPermissions({ campus_id, tier, features }) {
  return prisma.$transaction(
    features.map(({ role, feature_id, enabled, class_ids }) =>
      prisma.campusTierPermission.upsert({
        where: { campus_id_tier_role_feature_id: { campus_id, tier, role, feature_id } },
        create: { campus_id, tier, role, feature_id, enabled: enabled ?? false, class_ids: class_ids ?? [] },
        update: { enabled: enabled ?? false, class_ids: class_ids ?? [] },
      })
    )
  );
}

export async function getCampusTierPermissions({ campus_id, tier, role }) {
  return prisma.campusTierPermission.findMany({
    where: { campus_id, tier, role },
    orderBy: { feature_id: "asc" },
  });
}

export async function getAllCampusPermissions(campus_id) {
  const rows = await prisma.campusTierPermission.findMany({
    where: { campus_id },
    orderBy: [{ tier: "asc" }, { feature_id: "asc" }],
  });

  return rows.reduce((acc, row) => {
    if (!acc[row.tier]) acc[row.tier] = [];
    acc[row.tier].push({ feature_id: row.feature_id, enabled: row.enabled, class_ids: row.class_ids, updated_at: row.updated_at });
    return acc;
  }, {});
}

export async function updateCampusTierPermissions({ campus_id, tier, features }) {
  const ops = features.map(({ role, feature_id, ...rest }) => {
    const updates = Object.fromEntries(
      Object.entries(rest).filter(([, v]) => v !== undefined)
    );
    if (Object.keys(updates).length === 0) {
      const err = new Error("NO_FIELDS_TO_UPDATE");
      err.code = "NO_FIELDS_TO_UPDATE";
      throw err;
    }
    return prisma.campusTierPermission.update({
      where: { campus_id_tier_role_feature_id: { campus_id, tier, role, feature_id } },
      data: updates,
    });
  });
  return prisma.$transaction(ops);
}

export async function deleteCampusTierPermission({ campus_id, tier, role, feature_id }) {
  return prisma.campusTierPermission.delete({
    where: { campus_id_tier_role_feature_id: { campus_id, tier, role, feature_id } },
  });
}
