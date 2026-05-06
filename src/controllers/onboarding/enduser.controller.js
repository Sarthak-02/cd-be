import { prisma } from "../../prisma/prisma.js";
import { bulkCreateEndUsers } from "../../db/enduser.db.js";

export async function createEndUsersController(req, reply) {
  const { campus_id, role, use_provided_ids, userids = [] } = req.body;

  try {
    let records;

    if (use_provided_ids) {
      if (!userids.length) {
        return reply.code(400).send({
          success: false,
          message: "userids must be a non-empty array when use_provided_ids is true",
        });
      }

      if (role === "STUDENT") {
        const students = await prisma.student.findMany({
          where: { student_id: { in: userids }, campus_id },
          select: { student_id: true, student_admission_no: true },
        });

        const found = new Set(students.map((s) => s.student_id));
        const missing = userids.filter((id) => !found.has(id));
        if (missing.length) {
          return reply.code(404).send({
            success: false,
            message: "Some student IDs not found in this campus",
            data: { missing },
          });
        }

        records = students.map((s) => ({
          userid: s.student_id,
          username: `${campus_id}${s.student_admission_no}`,
          role: "STUDENT",
        }));
      } else {
        const teachers = await prisma.teacher.findMany({
          where: { teacher_id: { in: userids }, campus_id },
          select: { teacher_id: true, teacher_employee_code: true },
        });

        const found = new Set(teachers.map((t) => t.teacher_id));
        const missing = userids.filter((id) => !found.has(id));
        if (missing.length) {
          return reply.code(404).send({
            success: false,
            message: "Some teacher IDs not found in this campus",
            data: { missing },
          });
        }

        records = teachers.map((t) => ({
          userid: t.teacher_id,
          username: `${campus_id}${t.teacher_employee_code}`,
          role: "TEACHER",
        }));
      }
    } else {
      if (role === "STUDENT") {
        const students = await prisma.student.findMany({
          where: { campus_id },
          select: { student_id: true, student_admission_no: true },
        });
        records = students.map((s) => ({
          userid: s.student_id,
          username: `${campus_id}${s.student_admission_no}`,
          role: "STUDENT",
        }));
      } else {
        const teachers = await prisma.teacher.findMany({
          where: { campus_id },
          select: { teacher_id: true, teacher_employee_code: true },
        });
        records = teachers.map((t) => ({
          userid: t.teacher_id,
          username: `${campus_id}${t.teacher_employee_code}`,
          role: "TEACHER",
        }));
      }

      if (!records.length) {
        return reply.code(404).send({
          success: false,
          message: `No ${role.toLowerCase()}s found for this campus`,
        });
      }
    }

    const result = await bulkCreateEndUsers(records);

    return reply.code(201).send({
      success: true,
      message: `${result.count} end user(s) created (duplicates skipped)`,
      data: { count: result.count },
    });
  } catch (err) {
    req.log?.error(err);
    return reply.code(500).send({
      success: false,
      message: "Internal server error",
      ...(process.env.NODE_ENV === "development" && { details: err.message }),
    });
  }
}
