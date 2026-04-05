import {
  createSection,
  getSection,
  getAllSections,
  updateSection,
  deleteSection,
  getSectionsByCampus,
} from "../../db/section.db.js";

function sendPrismaError(reply, err, req) {
  req.log?.error(err);
  if (err.code === "P2002") {
    return reply.code(409).send({
      success: false,
      message: "Section already exists or conflicts with an existing record",
    });
  }
  if (err.code === "P2003") {
    return reply.code(400).send({
      success: false,
      message: "Invalid reference (e.g. class not found)",
    });
  }
  if (err.code === "P2025") {
    return reply.code(404).send({
      success: false,
      message: "Section not found",
    });
  }
  return reply.code(500).send({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  });
}

export async function section_post(req, reply) {
  try {
    const section = await createSection(req.body);
    return reply.code(201).send({
      success: true,
      message: "Section created successfully",
      data: section,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function section_put(req, reply) {
  try {
    const section = await updateSection(req.body);
    return reply.send({
      success: true,
      message: "Section updated successfully",
      data: section,
    });
  } catch (err) {
    if (err.code === "NO_FIELDS_TO_UPDATE") {
      return reply.code(400).send({
        success: false,
        message: "Provide at least one field to update besides section_id",
      });
    }
    return sendPrismaError(reply, err, req);
  }
}

export async function section_get(req, reply) {
  try {
    const { section_id } = req.query;
    const sec = await getSection(section_id);
    if (!sec) {
      return reply.code(404).send({
        success: false,
        message: "Section not found",
        data: null,
      });
    }
    return reply.send({
      success: true,
      message: "Fetched section details",
      data: sec,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function section_all_get(req, reply) {
  try {
    const { campus_id } = req.query;
    const sections = campus_id
      ? await getSectionsByCampus(campus_id)
      : await getAllSections({ omit: { extras: true }, where: {} });
    const data = sections.map((section) => ({
      ...section,
      label: section.section_name,
      value: section.section_id,
    }));
    return reply.send({
      success: true,
      message: "Fetched all sections",
      data,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function section_delete(req, reply) {
  try {
    const { section_id } = req.query;
    await deleteSection(section_id);
    return reply.send({
      success: true,
      message: "Section deleted successfully",
      data: null,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}
