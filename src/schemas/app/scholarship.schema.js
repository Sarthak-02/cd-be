const scholarshipStatusEnum = ["OPEN", "CLOSED", "EXTENDED", "UPCOMING"];

const scholarshipBodyProps = {
  source_name: { type: "string", minLength: 1 },
  source_type: { type: "string", minLength: 1 },
  scholarship_name: { type: "string", minLength: 1 },
  category: { type: "string", minLength: 1 },
  classes: { type: "array", items: { type: "string" } },
  target_group: { type: "array", items: { type: "string" } },
  academic_year: { type: "string", minLength: 1 },
  status: { type: "string", enum: scholarshipStatusEnum },
  open_date: { type: ["string", "null"] },
  close_date: { type: ["string", "null"] },
  benefit_summary: { type: ["string", "null"] },
  eligibility_summary: { type: ["string", "null"] },
  details_url: { type: ["string", "null"] },
  announcement_url: { type: ["string", "null"] },
  last_checked_at: { type: ["string", "null"] },
  content_hash: { type: "string", minLength: 1 },
  raw_title: { type: ["string", "null"] },
};

export const ScholarshipCreateSchema = {
  body: {
    type: "object",
    required: [
      "source_name",
      "source_type",
      "scholarship_name",
      "category",
      "classes",
      "target_group",
      "academic_year",
      "status",
      "content_hash",
    ],
    properties: scholarshipBodyProps,
    additionalProperties: false,
  },
};

export const ScholarshipUpdateSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", minLength: 1 },
    },
  },
  body: {
    type: "object",
    properties: {
      source_name: { type: "string", minLength: 1 },
      source_type: { type: "string", minLength: 1 },
      scholarship_name: { type: "string", minLength: 1 },
      category: { type: "string", minLength: 1 },
      classes: { type: "array", items: { type: "string" } },
      target_group: { type: "array", items: { type: "string" } },
      academic_year: { type: "string", minLength: 1 },
      status: { type: "string", enum: scholarshipStatusEnum },
      open_date: { type: ["string", "null"] },
      close_date: { type: ["string", "null"] },
      benefit_summary: { type: ["string", "null"] },
      eligibility_summary: { type: ["string", "null"] },
      details_url: { type: ["string", "null"] },
      announcement_url: { type: ["string", "null"] },
      last_checked_at: { type: ["string", "null"] },
      content_hash: { type: "string", minLength: 1 },
      raw_title: { type: ["string", "null"] },
    },
    additionalProperties: false,
    minProperties: 1,
  },
};

export const ScholarshipGetByIdSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", minLength: 1 },
    },
  },
};

export const ScholarshipListSchema = {
  querystring: {
    type: "object",
    properties: {
      status: { type: "string", enum: scholarshipStatusEnum },
      academic_year: { type: "string" },
      category: { type: "string" },
      source_type: { type: "string" },
      class_label: { type: "string", description: "Match if classes JSON array contains this value" },
      target_group_label: { type: "string" },
      limit: { type: "string" },
      offset: { type: "string" },
    },
    additionalProperties: false,
  },
};

export const ScholarshipDeleteSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", minLength: 1 },
    },
  },
};

/** Scraper / import payload items (maps to DB in controller). */
const scholarshipImportItemSchema = {
  type: "object",
  required: ["scholarship_name", "category", "content_hash"],
  properties: {
    scholarship_name: { type: "string", minLength: 1 },
    provider: { type: "string" },
    category: { type: "string", minLength: 1 },
    classes: {},
    eligibility_summary: { type: "string" },
    benefit_summary: { type: "string" },
    application_dates: { type: "string" },
    details_url: { type: "string" },
    source_name: { type: "string" },
    raw_text_excerpt: { type: "string" },
    page_title: { type: "string" },
    scraped_at: { type: "string" },
    content_hash: { type: "string", minLength: 1 },
    source_type: { type: "string" },
    target_group: { type: "array", items: { type: "string" } },
    academic_year: { type: "string" },
    status: { type: "string", enum: scholarshipStatusEnum },
    open_date: { type: ["string", "null"] },
    close_date: { type: ["string", "null"] },
    announcement_url: { type: "string" },
    last_checked_at: { type: "string" },
    raw_title: { type: "string" },
  },
  additionalProperties: true,
};

export const ScholarshipBulkImportSchema = {
  body: {
    type: "array",
    minItems: 1,
    items: scholarshipImportItemSchema,
  },
};
