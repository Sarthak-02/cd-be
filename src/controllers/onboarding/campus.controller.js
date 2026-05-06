import {
  createCampus,
  getCampus,
  getAllCampuses,
  updateCampus,
  deleteCampus,
} from "../../db/campus.db.js";

function normalizeSitePermissionIds(site_permissions) {
  if (!Array.isArray(site_permissions)) return [];
  return site_permissions
    .map((p) =>
      p && typeof p === "object" && "value" in p ? p.value : p,
    )
    .filter((id) => id != null && id !== "");
}

function sendPrismaError(reply, err, req) {
  req.log?.error(err);
  if (err.code === "P2002") {
    return reply.code(409).send({
      success: false,
      message: "Campus already exists or conflicts with an existing record",
    });
  }
  if (err.code === "P2003") {
    return reply.code(400).send({
      success: false,
      message: "Invalid reference (e.g. school not found)",
    });
  }
  if (err.code === "P2025") {
    return reply.code(404).send({
      success: false,
      message: "Campus not found",
    });
  }
  return reply.code(500).send({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  });
}

export async function campus_post(req, reply) {
  try {
    const campus = await createCampus(req.body);
    return reply.code(201).send({
      success: true,
      message: "Campus created successfully",
      data: campus,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function campus_put(req, reply) {
  try {
    const campus = await updateCampus(req.body);
    return reply.send({
      success: true,
      message: "Campus updated successfully",
      data: campus,
    });
  } catch (err) {
    if (err.code === "NO_FIELDS_TO_UPDATE") {
      return reply.code(400).send({
        success: false,
        message: "Provide at least one field to update besides campus_id",
      });
    }
    return sendPrismaError(reply, err, req);
  }
}

export async function campus_get(req, reply) {
  try {
    const { campus_id } = req.query;
    const campus = await getCampus(campus_id);
    if (!campus) {
      return reply.code(404).send({
        success: false,
        message: "Campus not found",
        data: null,
      });
    }
    return reply.send({
      success: true,
      message: "Fetched campus details",
      data: campus,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function campus_all_get(req, reply) {
  try {
    const siteIds = normalizeSitePermissionIds(req.token_info?.site_permissions);
    if (siteIds.length === 0) {
      return reply.send({
        success: true,
        message: "Fetched all campuses",
        data: [],
      });
    }
    const campuses = await getAllCampuses({
      omit: { extras: true },
      where: { school_id: { in: siteIds } },
    });
    const data = campuses.map((c) => ({
      ...c,
      label: c.campus_name,
      value: c.campus_id,
    }));
    return reply.send({
      success: true,
      message: "Fetched all campuses",
      data,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function campus_delete(req, reply) {
  try {
    const { campus_id } = req.query;
    await deleteCampus(campus_id);
    return reply.send({
      success: true,
      message: "Campus deleted successfully",
      data: null,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}
