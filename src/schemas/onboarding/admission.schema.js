const extrasSchema = {
  type: "object",
  nullable: true,
  properties: {
    admission_blood_group: { type: "string", nullable: true },
    admission_category: { type: "string", nullable: true },
    admission_father_name: { type: "string", nullable: true },
    admission_mother_name: { type: "string", nullable: true },
    admission_guardian_phone: { type: "string", nullable: true },
    admission_guardian_address: { type: "string", nullable: true },
    admission_guardian_country: { type: "string", nullable: true },
    admission_guardian_state: { type: "string", nullable: true },
    admission_guardian_city: { type: "string", nullable: true },
    admission_guardian_pincode: { type: "string", nullable: true },
    admission_prev_school_name: { type: "string", nullable: true },
    admission_prev_school_class: { type: "string", nullable: true },
    admission_prev_school_percentage: { type: "string", nullable: true },
    admission_remarks: { type: "string", nullable: true },
  },
};

export const admissionCreateRequestSchema = {
  tags: ["Admission"],
  body: {
    type: "object",
    required: [
      "campus_id",
      "admission_application_no",
      "admission_academic_year",
      "admission_date",
      "admission_applied_class_id",
      "admission_first_name",
      "admission_gender",
      "admission_dob",
    ],
    properties: {
      campus_id: { type: "string" },
      admission_application_no: { type: "string" },
      admission_academic_year: { type: "string" },
      admission_date: { type: "string", format: "date-time" },
      admission_applied_class_id: { type: "string" },
      admission_status: { type: "string" },
      admission_first_name: { type: "string" },
      admission_middle_name: { type: "string", nullable: true },
      admission_last_name: { type: "string", nullable: true },
      admission_gender: { type: "string" },
      admission_dob: { type: "string", format: "date-time" },
      extras: extrasSchema,
    },
  },
};

export const admissionUpdateRequestSchema = {
  tags: ["Admission"],
  body: {
    type: "object",
    required: ["admission_id"],
    properties: {
      admission_id: { type: "string" },
      campus_id: { type: "string" },
      admission_application_no: { type: "string" },
      admission_academic_year: { type: "string" },
      admission_date: { type: "string", format: "date-time" },
      admission_applied_class_id: { type: "string" },
      admission_status: { type: "string" },
      admission_first_name: { type: "string" },
      admission_middle_name: { type: "string", nullable: true },
      admission_last_name: { type: "string", nullable: true },
      admission_gender: { type: "string" },
      admission_dob: { type: "string", format: "date-time" },
      extras: extrasSchema,
    },
  },
};

export const admissionGetRequestSchema = {
  tags: ["Admission"],
  querystring: {
    type: "object",
    required: ["admission_id"],
    properties: {
      admission_id: { type: "string" },
    },
  },
};

export const admissionByCampusGetRequestSchema = {
  tags: ["Admission"],
  querystring: {
    type: "object",
    properties: {
      campus_id: { type: "string" },
    },
  },
};

export const admissionEnrollRequestSchema = {
  tags: ["Admission"],
  body: {
    type: "object",
    required: ["admission_id"],
    properties: {
      admission_id: { type: "string" },
    },
  },
};
