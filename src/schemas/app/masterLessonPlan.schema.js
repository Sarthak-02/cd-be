const detailItemSchema = {
  type: "object",
  required: ["chapter", "topics"],
  properties: {
    chapter: { type: "string", minLength: 1 },
    topics: { type: "array", minItems: 1, items: { type: "string", minLength: 1 } },
    month: { type: "string" },
    estimated_weeks: { type: "integer", minimum: 1 },
  },
};

const detailsSchema = {
  type: "array",
  minItems: 1,
  items: detailItemSchema,
};

export const MasterLessonPlanCreateSchema = {
  tags: ["Master Lesson Plans"],
  body: {
    type: "object",
    required: ["class_name", "subject", "board", "academic_year", "details"],
    properties: {
      class_name: { type: "string", minLength: 1, description: "e.g. Class 5, Grade 10" },
      subject: { type: "string", minLength: 1 },
      board: { type: "string", minLength: 1, description: "e.g. CBSE, ICSE, State Board" },
      academic_year: { type: "string", minLength: 1, description: "e.g. 2025-26" },
      details: detailsSchema,
    },
  },
};

export const MasterLessonPlanGetByIdSchema = {
  tags: ["Master Lesson Plans"],
  params: {
    type: "object",
    required: ["master_lesson_plan_id"],
    properties: {
      master_lesson_plan_id: { type: "string" },
    },
  },
};

export const MasterLessonPlanListSchema = {
  tags: ["Master Lesson Plans"],
  querystring: {
    type: "object",
    properties: {
      class_name: { type: "string" },
      subject: { type: "string" },
      board: { type: "string" },
      academic_year: { type: "string" },
      limit: { type: "integer", minimum: 1, maximum: 200, default: 50 },
      offset: { type: "integer", minimum: 0, default: 0 },
    },
  },
};

export const MasterLessonPlanUpdateSchema = {
  tags: ["Master Lesson Plans"],
  params: {
    type: "object",
    required: ["master_lesson_plan_id"],
    properties: {
      master_lesson_plan_id: { type: "string" },
    },
  },
  body: {
    type: "object",
    minProperties: 1,
    properties: {
      class_name: { type: "string", minLength: 1 },
      subject: { type: "string", minLength: 1 },
      board: { type: "string", minLength: 1 },
      academic_year: { type: "string", minLength: 1 },
      details: detailsSchema,
    },
  },
};

export const MasterLessonPlanDeleteSchema = MasterLessonPlanGetByIdSchema;

export const MasterLessonPlanFetchSchema = {
  tags: ["Master Lesson Plans"],
  querystring: {
    type: "object",
    required: ["board", "subject", "class_name"],
    properties: {
      board: { type: "string", minLength: 1, description: "e.g. CBSE, ICSE" },
      subject: { type: "string", minLength: 1 },
      class_name: { type: "string", minLength: 1, description: "e.g. Class 5, Grade 10" },
      academic_year: { type: "string", description: "e.g. 2025-26; omit to get all years" },
    },
  },
};
