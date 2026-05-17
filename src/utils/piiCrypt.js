import { encrypt, decrypt, blindIndex } from "./crypto.js";

// PII field lists per model
export const STUDENT_PII = [
  "student_first_name",
  "student_middle_name",
  "student_last_name",
  "student_dob",
  "student_admission_no",
];

export const TEACHER_PII = [
  "teacher_first_name",
  "teacher_middle_name",
  "teacher_last_name",
  "teacher_dob",
  "teacher_email",
  "teacher_phone",
  "teacher_employee_code",
];

export const PARENT_PII = ["name", "phone", "email"];

// Maps PII field → blind-index column for fields that need exact-match lookups
export const STUDENT_BLIND = {
  student_admission_no: "admission_no_hash",
};

export const TEACHER_BLIND = {
  teacher_email: "email_hash",
  teacher_phone: "phone_hash",
  teacher_employee_code: "employee_code_hash",
};

export const PARENT_BLIND = {
  phone: "phone_hash",
};

export function encryptFields(obj, fields, blindMap) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const result = { ...obj };
  for (const field of fields) {
    if (!(field in result)) continue;
    const plain = result[field];
    result[field] = encrypt(plain);
    const hashCol = blindMap[field];
    if (hashCol) {
      result[hashCol] = plain != null ? blindIndex(String(plain)) : null;
    }
  }
  return result;
}

export function decryptFields(obj, fields) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const result = { ...obj };
  for (const field of fields) {
    if (field in result) result[field] = decrypt(result[field]);
  }
  return result;
}
