import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/index.js";
import dotenv from "dotenv";
import { encrypt, decrypt, blindIndex } from "../utils/crypto.js";

dotenv.config();

// ── PII field definitions ────────────────────────────────────────────────────

const STUDENT_PII = [
  "student_first_name",
  "student_middle_name",
  "student_last_name",
  "student_dob",
  "student_admission_no",
];

const TEACHER_PII = [
  "teacher_first_name",
  "teacher_middle_name",
  "teacher_last_name",
  "teacher_dob",
  "teacher_email",
  "teacher_phone",
  "teacher_employee_code",
];

const PARENT_PII = ["name", "phone", "email"];

// PII field → blind-index column (deterministic lookup hash)
const STUDENT_BLIND = { student_admission_no: "admission_no_hash" };
const TEACHER_BLIND = {
  teacher_email: "email_hash",
  teacher_phone: "phone_hash",
  teacher_employee_code: "employee_code_hash",
};
const PARENT_BLIND = { phone: "phone_hash" };

// JSON object fields encrypted as { _enc: "enc:..." } envelope (no schema change needed)
const STUDENT_JSON = ["extras"];
const TEACHER_JSON = ["extras"];

const ENCRYPT_CONFIG = {
  Student: { fields: STUDENT_PII, blindMap: STUDENT_BLIND, jsonFields: STUDENT_JSON },
  Teacher: { fields: TEACHER_PII, blindMap: TEACHER_BLIND, jsonFields: TEACHER_JSON },
  Parent:  { fields: PARENT_PII,  blindMap: PARENT_BLIND,  jsonFields: []           },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function encryptWriteData(data, { fields, blindMap, jsonFields }) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  const result = { ...data };

  // Encrypt scalar PII fields (stored as "enc:..." strings)
  for (const field of fields) {
    if (!(field in result)) continue;
    const plain = result[field];
    result[field] = encrypt(plain);
    const hashCol = blindMap[field];
    if (hashCol) {
      result[hashCol] = plain != null ? blindIndex(String(plain)) : null;
    }
  }

  // Encrypt JSON object fields — stored as { _enc: "enc:..." } envelope so the
  // column stays valid JSON (no schema change required).
  for (const field of jsonFields) {
    if (!(field in result) || result[field] == null) continue;
    const val = result[field];
    result[field] = { _enc: encrypt(JSON.stringify(val)) };
  }

  return result;
}

// Recursively decrypt any "enc:..." leaf string in the returned object tree.
// Handles nested includes (e.g. section.students inside a Teacher query) without
// needing to know which model each nested record belongs to.
//
// JSON fields encrypted as { _enc: "enc:..." } are detected first and decoded
// back into a plain JS object before any recursive traversal.
function decryptDeep(val) {
  if (val == null) return val;
  if (typeof val === "object") {
    if (val instanceof Date) return val;
    // Encrypted JSON envelope — decrypt and parse back to object
    if (!Array.isArray(val) && typeof val._enc === "string" && val._enc.startsWith("enc:")) {
      try {
        return JSON.parse(decrypt(val._enc));
      } catch {
        return val;
      }
    }
    if (Array.isArray(val)) return val.map(decryptDeep);
    const result = {};
    for (const [k, v] of Object.entries(val)) {
      result[k] = decryptDeep(v);
    }
    return result;
  }
  if (typeof val === "string" && val.startsWith("enc:")) {
    try {
      return decrypt(val);
    } catch {
      return val; // corrupted / not our ciphertext — return as-is
    }
  }
  return val;
}

// ── Prisma client with encryption extension ──────────────────────────────────

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({ adapter }).$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const config = ENCRYPT_CONFIG[model];

        if (config) {
          if (operation === "create" || operation === "update") {
            if (args.data) {
              args = { ...args, data: encryptWriteData(args.data, config) };
            }
          } else if (operation === "upsert") {
            args = {
              ...args,
              create: encryptWriteData(args.create, config),
              update: encryptWriteData(args.update, config),
            };
          } else if (operation === "createMany" || operation === "updateMany") {
            if (Array.isArray(args.data)) {
              args = {
                ...args,
                data: args.data.map((d) => encryptWriteData(d, config)),
              };
            } else if (args.data) {
              args = { ...args, data: encryptWriteData(args.data, config) };
            }
          }
        }

        const result = await query(args);
        return decryptDeep(result);
      },
    },
  },
});

export { prisma };
