const roleEnum = { type: "string", enum: ["student", "staff"] };
const tierEnum = { type: "string", enum: ["basic", "standard", "premium", "enterprise"] };

const featureItemSchema = {
  type: "object",
  required: ["role", "feature_id"],
  properties: {
    role:       roleEnum,
    feature_id: { type: "string" },
    enabled:    { type: "boolean" },
    class_ids:  { type: "array", items: { type: "string" } },
  },
};

export const campusTierPermissionUpsertSchema = {
  tags: ["CampusTierPermission"],
  body: {
    type: "object",
    required: ["campus_id", "tier", "features"],
    properties: {
      campus_id: { type: "string" },
      tier:      tierEnum,
      features:  { type: "array", items: featureItemSchema, minItems: 1 },
    },
  },
};

export const campusTierPermissionUpdateSchema = {
  tags: ["CampusTierPermission"],
  body: {
    type: "object",
    required: ["campus_id", "tier", "features"],
    properties: {
      campus_id: { type: "string" },
      tier:      tierEnum,
      features:  { type: "array", items: featureItemSchema, minItems: 1 },
    },
  },
};

export const campusTierPermissionGetSchema = {
  tags: ["CampusTierPermission"],
  querystring: {
    type: "object",
    required: ["campus_id", "tier", "role"],
    properties: {
      campus_id: { type: "string" },
      tier:      tierEnum,
      role:      roleEnum,
    },
  },
};

export const campusTierPermissionDeleteSchema = {
  tags: ["CampusTierPermission"],
  querystring: {
    type: "object",
    required: ["campus_id", "tier", "role", "feature_id"],
    properties: {
      campus_id:  { type: "string" },
      tier:       tierEnum,
      role:       roleEnum,
      feature_id: { type: "string" },
    },
  },
};

export const campusAllPermissionsGetSchema = {
  tags: ["CampusTierPermission"],
  querystring: {
    type: "object",
    required: ["campus_id"],
    properties: {
      campus_id: { type: "string" },
    },
  },
};
