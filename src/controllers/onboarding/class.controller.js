import {
  createClass,
  getClass,
  getAllClasses,
  updateClass,
  deleteClass,
} from "../../db/class.db.js";

function sendPrismaError(reply, err, req) {
  req.log?.error(err);
  if (err.code === "P2002") {
    return reply.code(409).send({
      success: false,
      message: "Class already exists or conflicts with an existing record",
    });
  }
  if (err.code === "P2003") {
    return reply.code(400).send({
      success: false,
      message: "Invalid reference (e.g. campus not found)",
    });
  }
  if (err.code === "P2025") {
    return reply.code(404).send({
      success: false,
      message: "Class not found",
    });
  }
  return reply.code(500).send({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  });
}

export async function class_post(req, reply) {
  try {
    const cls = await createClass(req.body);
    return reply.code(201).send({
      success: true,
      message: "Class created successfully",
      data: cls,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function class_put(req, reply) {
  try {
    const cls = await updateClass(req.body);
    return reply.send({
      success: true,
      message: "Class updated successfully",
      data: cls,
    });
  } catch (err) {
    if (err.code === "NO_FIELDS_TO_UPDATE") {
      return reply.code(400).send({
        success: false,
        message: "Provide at least one field to update besides class_id",
      });
    }
    return sendPrismaError(reply, err, req);
  }
}

export async function class_get(req, reply) {
  try {
    const { class_id } = req.query;
    const cls = await getClass(class_id);
    if (!cls) {
      return reply.code(404).send({
        success: false,
        message: "Class not found",
        data: null,
      });
    }
    return reply.send({
      success: true,
      message: "Fetched class details",
      data: cls,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function class_all_get(req, reply) {
  try {
    const { campus_id } = req.query;
    const where = campus_id ? { campus_id } : {};
    const classes = await getAllClasses({
      omit: { extras: true },
      where,
    });
    const data = classes.map((c) => ({
      ...c,
      label: c.class_name,
      value: c.class_id,
    }));
    return reply.send({
      success: true,
      message: "Fetched all classes",
      data,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function class_delete(req, reply) {
  try {
    const { class_id } = req.query;
    await deleteClass(class_id);
    return reply.send({
      success: true,
      message: "Class deleted successfully",
      data: null,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}
