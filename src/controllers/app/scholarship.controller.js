import {
  createScholarship,
  getScholarshipById,
  listScholarships,
  updateScholarship,
  deleteScholarship,
} from "../../db/scholarship.db.js";

function mapCreateBody(body) {
  return {
    sourceName: body.source_name,
    sourceType: body.source_type,
    scholarshipName: body.scholarship_name,
    category: body.category,
    classes: body.classes,
    targetGroup: body.target_group,
    academicYear: body.academic_year,
    status: body.status,
    openDate: body.open_date,
    closeDate: body.close_date,
    benefitSummary: body.benefit_summary,
    eligibilitySummary: body.eligibility_summary,
    detailsUrl: body.details_url,
    announcementUrl: body.announcement_url,
    lastCheckedAt: body.last_checked_at,
    contentHash: body.content_hash,
    rawTitle: body.raw_title,
  };
}

function mapPatchBody(body) {
  const patch = {};
  if (body.source_name !== undefined) patch.sourceName = body.source_name;
  if (body.source_type !== undefined) patch.sourceType = body.source_type;
  if (body.scholarship_name !== undefined) patch.scholarshipName = body.scholarship_name;
  if (body.category !== undefined) patch.category = body.category;
  if (body.classes !== undefined) patch.classes = body.classes;
  if (body.target_group !== undefined) patch.targetGroup = body.target_group;
  if (body.academic_year !== undefined) patch.academicYear = body.academic_year;
  if (body.status !== undefined) patch.status = body.status;
  if (body.open_date !== undefined) patch.openDate = body.open_date;
  if (body.close_date !== undefined) patch.closeDate = body.close_date;
  if (body.benefit_summary !== undefined) patch.benefitSummary = body.benefit_summary;
  if (body.eligibility_summary !== undefined) patch.eligibilitySummary = body.eligibility_summary;
  if (body.details_url !== undefined) patch.detailsUrl = body.details_url;
  if (body.announcement_url !== undefined) patch.announcementUrl = body.announcement_url;
  if (body.last_checked_at !== undefined) patch.lastCheckedAt = body.last_checked_at;
  if (body.content_hash !== undefined) patch.contentHash = body.content_hash;
  if (body.raw_title !== undefined) patch.rawTitle = body.raw_title;
  return patch;
}

export async function create_scholarship(req, reply) {
  try {
    const row = await createScholarship(mapCreateBody(req.body));
    return reply.code(201).send({
      success: true,
      message: "Scholarship created",
      data: row,
    });
  } catch (err) {
    req.log.error(err);
    if (err.code === "P2002") {
      return reply.code(409).send({
        success: false,
        message: "A scholarship with this content_hash already exists",
      });
    }
    return reply.code(500).send({
      success: false,
      message: err.message || "Unable to create scholarship",
    });
  }
}

export async function get_scholarship_by_id(req, reply) {
  try {
    const row = await getScholarshipById(req.params.id);
    if (!row) {
      return reply.code(404).send({
        success: false,
        message: "Scholarship not found",
      });
    }
    return reply.send({
      success: true,
      data: row,
    });
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({
      success: false,
      message: "Unable to fetch scholarship",
    });
  }
}

export async function list_scholarships(req, reply) {
  try {
    const q = req.query || {};
    const { items, total } = await listScholarships({
      status: q.status,
      academicYear: q.academic_year,
      category: q.category,
      sourceType: q.source_type,
      classLabel: q.class_label,
      targetGroupLabel: q.target_group_label,
      limit: q.limit != null ? parseInt(q.limit, 10) : undefined,
      offset: q.offset != null ? parseInt(q.offset, 10) : undefined,
    });

    return reply.send({
      success: true,
      data: items,
      count: items.length,
      total,
    });
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({
      success: false,
      message: "Unable to list scholarships",
    });
  }
}

export async function update_scholarship(req, reply) {
  try {
    const patch = mapPatchBody(req.body);
    if (Object.keys(patch).length === 0) {
      return reply.code(400).send({
        success: false,
        message: "No fields to update",
      });
    }

    const row = await updateScholarship(req.params.id, patch);
    if (!row) {
      return reply.code(404).send({
        success: false,
        message: "Scholarship not found",
      });
    }

    return reply.send({
      success: true,
      message: "Scholarship updated",
      data: row,
    });
  } catch (err) {
    req.log.error(err);
    if (err.code === "P2002") {
      return reply.code(409).send({
        success: false,
        message: "content_hash conflict",
      });
    }
    return reply.code(500).send({
      success: false,
      message: err.message || "Unable to update scholarship",
    });
  }
}

export async function delete_scholarship(req, reply) {
  try {
    const ok = await deleteScholarship(req.params.id);
    if (!ok) {
      return reply.code(404).send({
        success: false,
        message: "Scholarship not found",
      });
    }
    return reply.send({
      success: true,
      message: "Scholarship deleted",
    });
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({
      success: false,
      message: "Unable to delete scholarship",
    });
  }
}
