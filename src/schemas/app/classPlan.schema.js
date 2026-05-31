const topicStatusEnum = ["PENDING", "IN_PROGRESS", "COMPLETED", "SKIPPED"];

const topicCreateSchema = {
  type: "object",
  required: ["chapter_title", "title", "display_order"],
  properties: {
    chapter_title: { type: "string", minLength: 1 },
    chapter_number: { type: "integer", minimum: 1 },
    title: { type: "string", minLength: 1 },
    display_order: { type: "number" },
  },
};

const topicUpdateSchema = {
  type: "object",
  minProperties: 1,
  properties: {
    chapter_title: { type: "string", minLength: 1 },
    chapter_number: { type: ["integer", "null"], minimum: 1 },
    title: { type: "string", minLength: 1 },
    display_order: { type: "number" },
  },
};

const progressCreateSchema = {
  type: "object",
  required: ["section_id"],
  properties: {
    section_id: { type: "string", minLength: 1, description: "Section this progress entry belongs to" },
    status: { type: "string", enum: topicStatusEnum, default: "PENDING" },
    scheduled_date: { type: "string", format: "date" },
    completed_on: { type: "string", format: "date" },
    actual_duration_mins: { type: "integer", minimum: 0 },
    teacher_notes: { type: "string" },
    is_added_by_teacher: { type: "boolean", default: false },
  },
};

const progressUpdateSchema = {
  type: "object",
  minProperties: 1,
  properties: {
    status: { type: "string", enum: topicStatusEnum },
    scheduled_date: { type: ["string", "null"], format: "date" },
    completed_on: { type: ["string", "null"], format: "date" },
    actual_duration_mins: { type: ["integer", "null"], minimum: 0 },
    teacher_notes: { type: ["string", "null"] },
    is_added_by_teacher: { type: "boolean" },
  },
};

// ─── Seed from Master ─────────────────────────────────────────────────────────

export const ClassPlanSeedFromMasterSchema = {
  tags: ["Class Plans"],
  body: {
    type: "object",
    required: ["board", "subject", "class_name", "campus_id", "teacher_id"],
    properties: {
      board: { type: "string", minLength: 1, description: "e.g. CBSE, ICSE" },
      subject: { type: "string", minLength: 1 },
      class_name: { type: "string", minLength: 1, description: "e.g. Class 5, Grade 10" },
      campus_id: { type: "string" },
      teacher_id: { type: "string" },
      is_published: { type: "boolean", default: false },
    },
  },
};

// ─── Class Plan ───────────────────────────────────────────────────────────────

export const ClassPlanCreateSchema = {
  tags: ["Class Plans"],
  body: {
    type: "object",
    required: ["campus_id", "teacher_id", "class_id", "subject", "academic_year"],
    properties: {
      master_plan_id: { type: "string", description: "Optional — seed from a MasterLessonPlan" },
      campus_id: { type: "string" },
      teacher_id: { type: "string" },
      class_id: { type: "string", minLength: 1 },
      subject: { type: "string", minLength: 1 },
      academic_year: { type: "string", minLength: 1, description: "e.g. 2025-26" },
      is_published: { type: "boolean", default: false },
      topics: { type: "array", items: topicCreateSchema },
    },
  },
};

export const ClassPlanGetByIdSchema = {
  tags: ["Class Plans"],
  params: {
    type: "object",
    required: ["class_plan_id"],
    properties: {
      class_plan_id: { type: "string" },
    },
  },
  querystring: {
    type: "object",
    properties: {
      section_id: { type: "string", description: "Filter topic progress to this section" },
    },
  },
};

export const ClassPlanListSchema = {
  tags: ["Class Plans"],
  querystring: {
    type: "object",
    properties: {
      campus_id: { type: "string" },
      teacher_id: { type: "string" },
      section_id: { type: "string", description: "Resolves to classId and filters progress to this section" },
      class_id: { type: "string" },
      subject: { type: "string" },
      academic_year: { type: "string" },
      is_published: { type: "boolean" },
      limit: { type: "integer", minimum: 1, maximum: 200, default: 50 },
      offset: { type: "integer", minimum: 0, default: 0 },
    },
  },
};

export const ClassPlanUpdateSchema = {
  tags: ["Class Plans"],
  params: {
    type: "object",
    required: ["class_plan_id"],
    properties: {
      class_plan_id: { type: "string" },
    },
  },
  body: {
    type: "object",
    minProperties: 1,
    properties: {
      master_plan_id: { type: ["string", "null"] },
      class_id: { type: "string", minLength: 1 },
      subject: { type: "string", minLength: 1 },
      academic_year: { type: "string", minLength: 1 },
      is_published: { type: "boolean" },
    },
  },
};

export const ClassPlanDeleteSchema = ClassPlanGetByIdSchema;

// ─── Topics ───────────────────────────────────────────────────────────────────

export const ClassPlanAddTopicsSchema = {
  tags: ["Class Plans"],
  params: {
    type: "object",
    required: ["class_plan_id"],
    properties: { class_plan_id: { type: "string" } },
  },
  body: {
    type: "object",
    required: ["topics"],
    properties: {
      topics: { type: "array", minItems: 1, items: topicCreateSchema },
    },
  },
};

export const ClassPlanTopicUpdateSchema = {
  tags: ["Class Plans"],
  params: {
    type: "object",
    required: ["topic_id"],
    properties: { topic_id: { type: "string" } },
  },
  body: topicUpdateSchema,
};

export const ClassPlanTopicDeleteSchema = {
  tags: ["Class Plans"],
  params: {
    type: "object",
    required: ["topic_id"],
    properties: { topic_id: { type: "string" } },
  },
};

// ─── Topic Progress ───────────────────────────────────────────────────────────

export const ClassPlanTopicProgressCreateSchema = {
  tags: ["Class Plans"],
  params: {
    type: "object",
    required: ["topic_id"],
    properties: { topic_id: { type: "string" } },
  },
  body: progressCreateSchema,
};

export const ClassPlanTopicProgressUpdateSchema = {
  tags: ["Class Plans"],
  params: {
    type: "object",
    required: ["progress_id"],
    properties: { progress_id: { type: "string" } },
  },
  body: progressUpdateSchema,
};

export const ClassPlanTopicProgressDeleteSchema = {
  tags: ["Class Plans"],
  params: {
    type: "object",
    required: ["progress_id"],
    properties: { progress_id: { type: "string" } },
  },
};

const assignmentStatusEnum = ["DRAFT", "PUBLISHED", "CLOSED"];

const progressIdParam = {
  type: "object",
  required: ["progress_id"],
  properties: { progress_id: { type: "string" } },
};

// ─── Materials ────────────────────────────────────────────────────────────────

export const TopicMaterialAddSchema = {
  tags: ["Class Plans"],
  params: progressIdParam,
  body: {
    type: "object",
    required: ["file_name", "file_url"],
    properties: {
      file_name: { type: "string", minLength: 1 },
      file_url: { type: "string", minLength: 1 },
    },
  },
};

export const TopicMaterialDeleteSchema = {
  tags: ["Class Plans"],
  params: {
    type: "object",
    required: ["material_id"],
    properties: { material_id: { type: "string" } },
  },
};

// ─── Assignments ──────────────────────────────────────────────────────────────

export const TopicAssignmentAddSchema = {
  tags: ["Class Plans"],
  params: progressIdParam,
  body: {
    type: "object",
    required: ["title"],
    properties: {
      title: { type: "string", minLength: 1 },
      due_date: { type: "string", format: "date" },
      file_url: { type: "string" },
      status: { type: "string", enum: assignmentStatusEnum, default: "DRAFT" },
      content: { type: "object" },
    },
  },
};

export const TopicAssignmentUpdateSchema = {
  tags: ["Class Plans"],
  params: {
    type: "object",
    required: ["assignment_id"],
    properties: { assignment_id: { type: "string" } },
  },
  body: {
    type: "object",
    minProperties: 1,
    properties: {
      title: { type: "string", minLength: 1 },
      due_date: { type: ["string", "null"], format: "date" },
      file_url: { type: ["string", "null"] },
      status: { type: "string", enum: assignmentStatusEnum },
      content: { type: ["object", "null"] },
    },
  },
};

export const TopicAssignmentDeleteSchema = {
  tags: ["Class Plans"],
  params: {
    type: "object",
    required: ["assignment_id"],
    properties: { assignment_id: { type: "string" } },
  },
};

// ─── Quizzes ──────────────────────────────────────────────────────────────────

export const TopicQuizAddSchema = {
  tags: ["Class Plans"],
  params: progressIdParam,
  body: {
    type: "object",
    required: ["title"],
    properties: {
      title: { type: "string", minLength: 1 },
      generated_by_ai: { type: "boolean", default: false },
      file_url: { type: "string" },
      content: { type: "object" },
    },
  },
};

export const TopicQuizUpdateSchema = {
  tags: ["Class Plans"],
  params: {
    type: "object",
    required: ["quiz_id"],
    properties: { quiz_id: { type: "string" } },
  },
  body: {
    type: "object",
    minProperties: 1,
    properties: {
      title: { type: "string", minLength: 1 },
      generated_by_ai: { type: "boolean" },
      file_url: { type: ["string", "null"] },
      content: { type: ["object", "null"] },
    },
  },
};

export const TopicQuizDeleteSchema = {
  tags: ["Class Plans"],
  params: {
    type: "object",
    required: ["quiz_id"],
    properties: { quiz_id: { type: "string" } },
  },
};
