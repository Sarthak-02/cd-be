const lessonPlanStatusEnum = [
  "PLANNED",
  "COMPLETED",
  "SKIPPED",
  "PARTIALLY_COMPLETED",
];

const learningObjectivesSchema = {
  type: "array",
  minItems: 1,
  items: { type: "string", minLength: 1 },
};

const activitiesSchema = {
  type: "array",
  items: {
    type: "object",
    required: ["type"],
    properties: {
      type: {
        type: "string",
        minLength: 1,
        description: "e.g. lecture, group_work, video, discussion",
      },
      description: { type: "string" },
      duration_minutes: { type: "integer", minimum: 0 },
    },
  },
};

const attachmentItemSchema = {
  type: "object",
  required: ["fileUrl", "fileName", "fileType", "fileSize"],
  properties: {
    fileUrl: { type: "string" },
    fileName: { type: "string" },
    fileType: { type: "string" },
    fileSize: { type: "integer" },
  },
};

export const LessonPlanCreateSchema = {
  tags: ["Lesson plans"],
  body: {
    type: "object",
    required: [
      "lesson_date",
      "chapter_topic",
      "learning_objectives",
      "activities",
      "subject_id",
      "class_id",
      "teacher_id",
    ],
    properties: {
      lesson_date: {
        type: "string",
        format: "date",
        description: "Scheduled date for the lesson",
      },
      chapter_topic: { type: "string", minLength: 1 },
      learning_objectives: learningObjectivesSchema,
      activities: activitiesSchema,
      homework: { type: "string", description: "Homework instructions (optional)" },
      status: {
        type: "string",
        enum: lessonPlanStatusEnum,
        default: "PLANNED",
      },
      subject_id: { type: "string" },
      class_id: { type: "string" },
      section_id: { type: "string", description: "Optional; omit for whole-class plan" },
      teacher_id: { type: "string" },
      attachments: {
        type: "array",
        items: attachmentItemSchema,
      },
    },
  },
};

export const LessonPlanGetByIdSchema = {
  tags: ["Lesson plans"],
  params: {
    type: "object",
    required: ["lesson_plan_id"],
    properties: {
      lesson_plan_id: { type: "string" },
    },
  },
};

export const LessonPlanListSchema = {
  tags: ["Lesson plans"],
  querystring: {
    type: "object",
    properties: {
      teacher_id: { type: "string" },
      campus_id: { type: "string" },
      subject_id: { type: "string" },
      class_id: { type: "string" },
      section_id: { type: "string" },
      status: { type: "string", enum: lessonPlanStatusEnum },
      start_date: { type: "string", format: "date" },
      end_date: { type: "string", format: "date" },
      limit: { type: "integer", minimum: 1, maximum: 200, default: 50 },
      offset: { type: "integer", minimum: 0, default: 0 },
    },
  },
};

export const LessonPlanUpdateSchema = {
  tags: ["Lesson plans"],
  params: {
    type: "object",
    required: ["lesson_plan_id"],
    properties: {
      lesson_plan_id: { type: "string" },
    },
  },
  body: {
    type: "object",
    minProperties: 1,
    properties: {
      lesson_date: { type: "string", format: "date" },
      chapter_topic: { type: "string", minLength: 1 },
      learning_objectives: learningObjectivesSchema,
      activities: activitiesSchema,
      homework: { type: ["string", "null"] },
      status: { type: "string", enum: lessonPlanStatusEnum },
      subject_id: { type: "string" },
      class_id: { type: "string" },
      section_id: { type: ["string", "null"] },
    },
  },
};

export const LessonPlanDeleteSchema = LessonPlanGetByIdSchema;

export const LessonPlanAddAttachmentsSchema = {
  tags: ["Lesson plans"],
  params: {
    type: "object",
    required: ["lesson_plan_id"],
    properties: {
      lesson_plan_id: { type: "string" },
    },
  },
  body: {
    type: "object",
    required: ["attachments"],
    properties: {
      attachments: {
        type: "array",
        minItems: 1,
        items: attachmentItemSchema,
      },
    },
  },
};

export const LessonPlanRemoveAttachmentSchema = {
  tags: ["Lesson plans"],
  params: {
    type: "object",
    required: ["attachment_id"],
    properties: {
      attachment_id: { type: "string" },
    },
  },
};

export const LessonPlanGenerateUploadUrlSchema = {
  tags: ["Lesson plans"],
  body: {
    type: "object",
    required: ["file_name", "mime_type"],
    properties: {
      lesson_plan_id: {
        type: "string",
        description: "Existing plan id, or omit for pre-create upload (temp path)",
      },
      file_name: { type: "string", minLength: 1 },
      mime_type: { type: "string" },
    },
  },
};
