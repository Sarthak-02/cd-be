import {
  createReportDashboardConfig,
  getReportDashboardConfig,
  getAllReportDashboardConfigs,
  updateReportDashboardConfig,
  deleteReportDashboardConfig,
} from "../../db/reportDashboardConfig.db.js";

function sendPrismaError(reply, err, req) {
  req.log?.error(err);
  if (err.code === "P2002") {
    return reply.code(409).send({ success: false, message: "Config already exists" });
  }
  if (err.code === "P2025") {
    return reply.code(404).send({ success: false, message: "Config not found" });
  }
  return reply.code(500).send({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  });
}

export async function reportDashboardConfig_post(req, reply) {
  try {
    const config = await createReportDashboardConfig(req.body);
    return reply.code(201).send({
      success: true,
      message: "Report dashboard config created successfully",
      data: config,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function reportDashboardConfig_get(req, reply) {
  try {
    const { id } = req.query;
    const config = await getReportDashboardConfig(id);
    if (!config) {
      return reply.code(404).send({ success: false, message: "Config not found", data: null });
    }
    return reply.send({ success: true, message: "Fetched report dashboard config", data: config });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function reportDashboardConfig_all_get(req, reply) {
  try {
    const { campusId } = req.query;
    const configs = await getAllReportDashboardConfigs(campusId);
    return reply.send({
      success: true,
      message: "Fetched all report dashboard configs",
      data: configs,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function reportDashboardConfig_put(req, reply) {
  try {
    const { id, ...updates } = req.body;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    if (Object.keys(filtered).length === 0) {
      return reply.code(400).send({ success: false, message: "Provide at least one field to update besides id" });
    }
    const config = await updateReportDashboardConfig(id, filtered);
    return reply.send({
      success: true,
      message: "Report dashboard config updated successfully",
      data: config,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function reportDashboardConfig_delete(req, reply) {
  try {
    const { id } = req.query;
    await deleteReportDashboardConfig(id);
    return reply.send({
      success: true,
      message: "Report dashboard config deleted successfully",
      data: null,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}
