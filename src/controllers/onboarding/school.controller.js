import {
  createSchool,
  getSchool,
  getAllSchools,
  updateSchool,
  deleteSchool,
} from "../../db/school.db.js";

function sendPrismaError(reply, err, req) {
  req.log?.error(err);
  if (err.code === "P2002") {
    return reply.code(409).send({
      success: false,
      message: "School already exists or conflicts with an existing record",
    });
  }
  if (err.code === "P2003") {
    return reply.code(400).send({
      success: false,
      message: "Invalid reference",
    });
  }
  if (err.code === "P2025") {
    return reply.code(404).send({
      success: false,
      message: "School not found",
    });
  }
  return reply.code(500).send({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  });
}

export async function school_post(req, reply) {
  try {
    const school = await createSchool(req.body);
    return reply.code(201).send({
      success: true,
      message: "School created successfully",
      data: school,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function school_put(req, reply) {
  try {
    const school = await updateSchool(req.body);
    return reply.send({
      success: true,
      message: "School updated successfully",
      data: school,
    });
  } catch (err) {
    if (err.code === "NO_FIELDS_TO_UPDATE") {
      return reply.code(400).send({
        success: false,
        message: "Provide at least one field to update besides school_id",
      });
    }
    return sendPrismaError(reply, err, req);
  }
}

export async function school_get(req, reply) {
  try {
    const { school_id } = req.query;
    const school = await getSchool(school_id);
    if (!school) {
      return reply.code(404).send({
        success: false,
        message: "School not found",
        data: null,
      });
    }
    return reply.send({
      success: true,
      message: "Fetched school details",
      data: school,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function school_all_get(req, reply) {
  try {
    const schools = await getAllSchools({ omit: { extras: true } });
    return reply.send({
      success: true,
      message: "Fetched all schools",
      data: schools,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function school_delete(req, reply) {
  try {
    const { school_id } = req.query;
    await deleteSchool(school_id);
    return reply.send({
      success: true,
      message: "School deleted successfully",
      data: null,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}
