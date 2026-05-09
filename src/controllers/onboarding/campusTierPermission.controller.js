import {
  upsertCampusTierPermissions,
  getCampusTierPermissions,
  getAllCampusPermissions,
  updateCampusTierPermissions,
  deleteCampusTierPermission,
} from "../../db/campusTierPermission.db.js";

function sendPrismaError(reply, err, req) {
  req.log?.error(err);
  if (err.code === "P2002") {
    return reply.code(409).send({ success: false, message: "Permission entry already exists" });
  }
  if (err.code === "P2003") {
    return reply.code(400).send({ success: false, message: "Invalid campus_id reference" });
  }
  if (err.code === "P2025") {
    return reply.code(404).send({ success: false, message: "Permission entry not found" });
  }
  return reply.code(500).send({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  });
}

export async function campusTierPermission_post(req, reply) {
  try {
    const permission = await upsertCampusTierPermissions(req.body);
    return reply.code(201).send({
      success: true,
      message: "Permission upserted successfully",
      data: permission,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function campusTierPermission_get(req, reply) {
  try {
    const { campus_id, tier, role } = req.query;
    const permissions = await getCampusTierPermissions({ campus_id, tier, role });
    return reply.send({
      success: true,
      message: "Fetched permissions",
      data: permissions,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function campusTierPermission_all_get(req, reply) {
  try {
    const { campus_id } = req.query;
    const permissions = await getAllCampusPermissions(campus_id);
    return reply.send({
      success: true,
      message: "Fetched all tier permissions for campus",
      data: permissions,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function campusTierPermission_put(req, reply) {
  try {
    const permission = await updateCampusTierPermissions(req.body);
    return reply.send({
      success: true,
      message: "Permission updated successfully",
      data: permission,
    });
  } catch (err) {
    if (err.code === "NO_FIELDS_TO_UPDATE") {
      return reply.code(400).send({
        success: false,
        message: "Provide at least one field to update besides campus_id, tier, and feature_id",
      });
    }
    return sendPrismaError(reply, err, req);
  }
}

export async function campusTierPermission_delete(req, reply) {
  try {
    const { campus_id, tier, role, feature_id } = req.query;
    await deleteCampusTierPermission({ campus_id, tier, role, feature_id });
    return reply.send({
      success: true,
      message: "Permission deleted successfully",
      data: null,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}
