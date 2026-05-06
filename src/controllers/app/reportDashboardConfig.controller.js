import { prisma } from "../../prisma/prisma.js";
import { getPublishedConfigForSection } from "../../db/reportDashboardConfig.db.js";

export async function reportDashboardConfig_by_section_get(req, reply) {
  const { campus_id, section_id } = req.query;

  const section = await prisma.section.findUnique({
    where: { section_id },
    select: { class_id: true },
  });

  if (!section) {
    return reply.code(404).send({ success: false, message: "Section not found", data: null });
  }

  const config = await getPublishedConfigForSection(campus_id, section.class_id);

  if (!config) {
    return reply.code(404).send({
      success: false,
      message: "No published report dashboard config found for this section",
      data: null,
    });
  }

  return reply.send({ success: true, message: "Fetched report dashboard config", data: config });
}
