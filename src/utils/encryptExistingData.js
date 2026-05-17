/**
 * One-time data migration: encrypt all existing Student, Teacher, and Parent
 * rows that were stored in plaintext before encryption was enabled.
 *
 * Run after applying the 20260515000000_encrypt_pii Prisma migration:
 *   node src/utils/encryptExistingData.js
 *
 * The script is fully idempotent — each field is checked individually before
 * being included in the update, so partially-migrated rows are handled
 * correctly on re-runs (e.g. names already encrypted but extras not yet).
 */

import dotenv from "dotenv";
dotenv.config();

import { prisma } from "../prisma/prisma.js";

const isEncryptedString = (v) => typeof v === "string" && v.startsWith("enc:");
// extras is stored as { _enc: "enc:..." } JSON envelope after encryption
const isEncryptedJson = (v) => v != null && typeof v === "object" && isEncryptedString(v._enc);

async function migrateStudents() {
  const students = await prisma.$queryRaw`SELECT * FROM "Student"`;
  let count = 0;
  for (const s of students) {
    const data = {};

    if (!isEncryptedString(s.student_first_name))   data.student_first_name   = s.student_first_name;
    if (!isEncryptedString(s.student_middle_name))   data.student_middle_name  = s.student_middle_name;
    if (!isEncryptedString(s.student_last_name))     data.student_last_name    = s.student_last_name;
    if (!isEncryptedString(s.student_dob))           data.student_dob          = s.student_dob;
    if (!isEncryptedString(s.student_admission_no))  data.student_admission_no = s.student_admission_no;
    if (s.extras != null && !isEncryptedJson(s.extras)) data.extras = s.extras;

    if (Object.keys(data).length === 0) continue;
    await prisma.student.update({ where: { student_id: s.student_id }, data });
    count++;
  }
  console.log(`Students migrated: ${count}`);
}

async function migrateTeachers() {
  const teachers = await prisma.$queryRaw`SELECT * FROM "Teacher"`;
  let count = 0;
  for (const t of teachers) {
    const data = {};

    if (!isEncryptedString(t.teacher_first_name))    data.teacher_first_name    = t.teacher_first_name;
    if (!isEncryptedString(t.teacher_middle_name))   data.teacher_middle_name   = t.teacher_middle_name;
    if (!isEncryptedString(t.teacher_last_name))     data.teacher_last_name     = t.teacher_last_name;
    if (!isEncryptedString(t.teacher_dob))           data.teacher_dob           = t.teacher_dob;
    if (!isEncryptedString(t.teacher_email))         data.teacher_email         = t.teacher_email;
    if (!isEncryptedString(t.teacher_phone))         data.teacher_phone         = t.teacher_phone;
    if (!isEncryptedString(t.teacher_employee_code)) data.teacher_employee_code = t.teacher_employee_code;
    if (t.extras != null && !isEncryptedJson(t.extras)) data.extras = t.extras;

    if (Object.keys(data).length === 0) continue;
    await prisma.teacher.update({ where: { teacher_id: t.teacher_id }, data });
    count++;
  }
  console.log(`Teachers migrated: ${count}`);
}

async function migrateParents() {
  const parents = await prisma.$queryRaw`SELECT * FROM "Parent"`;
  let count = 0;
  for (const p of parents) {
    const data = {};

    if (!isEncryptedString(p.name))  data.name  = p.name;
    if (!isEncryptedString(p.phone)) data.phone = p.phone;
    if (!isEncryptedString(p.email)) data.email = p.email;

    if (Object.keys(data).length === 0) continue;
    await prisma.parent.update({ where: { parent_id: p.parent_id }, data });
    count++;
  }
  console.log(`Parents migrated: ${count}`);
}

async function main() {
  console.log("Starting PII encryption migration...");
  await migrateStudents();
  await migrateTeachers();
  await migrateParents();
  console.log("Done.");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
