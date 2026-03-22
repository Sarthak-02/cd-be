import {
  createScholarship,
  createScholarshipsBulk,
  getScholarshipById,
  listScholarships,
  updateScholarship,
  deleteScholarship,
} from "../../db/scholarship.db.js";

const SCHOLARSHIP_STATUSES = new Set(["OPEN", "CLOSED", "EXTENDED", "UPCOMING"]);

function normalizeClasses(value) {
  if (Array.isArray(value)) return value.map(String);
  if (value == null || value === "") return [];
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return [];
    return t
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function academicYearFromScrapedAt(scrapedAt) {
  const d = new Date(scrapedAt);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  if (m >= 4) return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
  return `${y - 1}-${String(y % 100).padStart(2, "0")}`;
}

function buildEligibilitySummary(eligibilitySummary, rawTextExcerpt) {
  const e = (eligibilitySummary ?? "").trim();
  const x = (rawTextExcerpt ?? "").trim();
  if (!x) return e || null;
  if (!e) return x;
  return `${e}\n\n--- scraped excerpt ---\n${x}`;
}

/**
 * Map scraper-style object to internal create row. Supports full manual shape too.
 * @returns {{ ok: true, row: object } | { ok: false, reason: string }}
 */
function mapImportItemToRow(item) {
  const scholarshipName = String(item.scholarship_name ?? "").trim();
  const contentHash = String(item.content_hash ?? "").trim();
  const category = String(item.category ?? "").trim();
  const sourceName = String(item.source_name ?? item.provider ?? "").trim();
  const sourceType = String(item.source_type ?? item.provider ?? "scraped").trim();

  if (!scholarshipName) return { ok: false, reason: "scholarship_name is required" };
  if (!contentHash) return { ok: false, reason: "content_hash is required" };
  if (!category) return { ok: false, reason: "category is required" };
  if (!sourceName) return { ok: false, reason: "source_name or provider is required" };

  const academicYear =
    String(item.academic_year ?? "").trim() ||
    academicYearFromScrapedAt(item.scraped_at) ||
    "unknown";

  const status =
    item.status && SCHOLARSHIP_STATUSES.has(item.status) ? item.status : "OPEN";

  const classes = normalizeClasses(item.classes);
  const targetGroup = Array.isArray(item.target_group)
    ? item.target_group.map(String)
    : [];

  const benefitSummary = (item.benefit_summary ?? "").trim() || null;
  const eligibilitySummary = buildEligibilitySummary(
    item.eligibility_summary,
    item.raw_text_excerpt
  );

  const titleParts = [item.page_title, item.application_dates]
    .map((s) => (s ?? "").trim())
    .filter(Boolean);
  const rawTitle =
    (item.raw_title != null && String(item.raw_title).trim()) ||
    (titleParts.length ? titleParts.join(" — ") : scholarshipName);

  return {
    ok: true,
    row: {
      sourceName,
      sourceType,
      scholarshipName,
      category,
      classes,
      targetGroup,
      academicYear,
      status,
      openDate: item.open_date ?? null,
      closeDate: item.close_date ?? null,
      benefitSummary,
      eligibilitySummary,
      detailsUrl: (item.details_url ?? "").trim() || null,
      announcementUrl: (item.announcement_url ?? "").trim() || null,
      lastCheckedAt: item.scraped_at ?? item.last_checked_at ?? null,
      contentHash,
      rawTitle,
    },
  };
}

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

export async function bulk_import_scholarships(req, reply) {
  try {
    const items = req.body;
    const invalid = [];
    const rows = [];

    for (let i = 0; i < items.length; i += 1) {
      const mapped = mapImportItemToRow(items[i]);
      if (!mapped.ok) {
        invalid.push({ index: i, reason: mapped.reason });
        continue;
      }
      rows.push(mapped.row);
    }

    if (!rows.length) {
      return reply.code(400).send({
        success: false,
        message: "No valid rows to insert",
        invalid,
      });
    }

    const { inserted, attempted } = await createScholarshipsBulk(rows);
    const skippedDuplicates = attempted - inserted;

    return reply.code(201).send({
      success: true,
      message: "Bulk import completed",
      inserted,
      skipped_duplicates: skippedDuplicates,
      invalid_count: invalid.length,
      invalid,
    });
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({
      success: false,
      message: err.message || "Unable to import scholarships",
    });
  }
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
