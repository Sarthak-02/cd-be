const ratingLabelSchema = {
  type: "object",
  required: ["value", "label", "color"],
  properties: {
    value: { type: "number" },
    label: { type: "string" },
    color: { type: "string" },
  },
};

const ratingScaleSchema = {
  type: "object",
  properties: {
    type: { type: "string" },
    points: { type: "number" },
    labels: { type: "array", items: ratingLabelSchema },
    emoji_set: { type: "array", items: { type: "string" } },
    numeric_min: { type: "number" },
    numeric_max: { type: "number" },
  },
};

const chartSchema = {
  type: "object",
  properties: {
    type: { type: "string" },
    group_by: { type: "array", items: { type: "string" } },
    orientation: { type: "string" },
  },
};

const displaySchema = {
  type: "object",
  properties: {
    layout: { type: "string" },
    show_teacher_comments: { type: "boolean" },
    charts: { type: "array", items: chartSchema },
  },
};

export const reportDashboardConfigCreateSchema = {
  tags: ["Report Dashboard Config"],
  body: {
    type: "object",
    required: ["name", "campusId", "schoolLevel", "enabledClasses", "skills", "ratingScale", "display"],
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      campusId: { type: "string" },
      schoolLevel: { type: "string" },
      useGrades: { type: "boolean" },
      status: { type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
      enabledClasses: { type: "array", items: { type: "string" } },
      skills: { type: "array" },
      ratingScale: ratingScaleSchema,
      display: displaySchema,
    },
  },
};

export const reportDashboardConfigUpdateSchema = {
  tags: ["Report Dashboard Config"],
  body: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      description: { type: "string" },
      schoolLevel: { type: "string" },
      useGrades: { type: "boolean" },
      status: { type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
      enabledClasses: { type: "array", items: { type: "string" } },
      skills: { type: "array" },
      ratingScale: ratingScaleSchema,
      display: displaySchema,
    },
  },
};

export const reportDashboardConfigGetSchema = {
  tags: ["Report Dashboard Config"],
  querystring: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
};

export const reportDashboardConfigAllSchema = {
  tags: ["Report Dashboard Config"],
  querystring: {
    type: "object",
    required: ["campusId"],
    properties: {
      campusId: { type: "string" },
    },
  },
};
