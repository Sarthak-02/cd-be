import {
  createStudent,
  getStudent,
  getAllStudents,
  updateStudent,
  deleteStudent,
} from "../../db/student.db.js";
import { createParent, createParentData } from "../../services/onboarding/student.service.js";

function studentDisplayName(student) {
  return [
    student.student_first_name,
    student.student_middle_name,
    student.student_last_name,
  ]
    .filter(Boolean)
    .join(" ");
}

function sendPrismaError(reply, err, req) {
  req.log?.error(err);
  if (err.code === "P2002") {
    return reply.code(409).send({
      success: false,
      message:
        "Student already exists or conflicts with an existing record (e.g. admission number)",
    });
  }
  if (err.code === "P2003") {
    return reply.code(400).send({
      success: false,
      message: "Invalid reference (e.g. campus or section not found)",
    });
  }
  if (err.code === "P2025") {
    return reply.code(404).send({
      success: false,
      message: "Student not found",
    });
  }
  return reply.code(500).send({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  });
}

export async function student_post(req, reply) {
  let student;
  try {
    student = await createStudent(req.body);
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }

  try {
    const parentPayload = createParentData({
      ...(req.body?.extras || {}),
      student_id: student.student_id,
    });
    await createParent(parentPayload);
  } catch (parentErr) {
    req.log?.error(parentErr);
    const msg = parentErr?.message || "";
    if (msg.includes("Parents with Same detail")) {
      return reply.code(409).send({
        success: false,
        message: msg,
      });
    }
    if (parentErr.code === "P2002") {
      return reply.code(409).send({
        success: false,
        message: "Parent contact details conflict with an existing record",
      });
    }
    return reply.code(500).send({
      success: false,
      message:
        "Student was created but parent record could not be created. You may need to add parent details separately.",
      data: { student_id: student.student_id },
    });
  }

  return reply.code(201).send({
    success: true,
    message: "Student created successfully",
    data: student,
  });
}

export async function student_put(req, reply) {
  try {
    const student = await updateStudent(req.body);
    return reply.send({
      success: true,
      message: "Student updated successfully",
      data: student,
    });
  } catch (err) {
    if (err.code === "NO_FIELDS_TO_UPDATE") {
      return reply.code(400).send({
        success: false,
        message: "Provide at least one field to update besides student_id",
      });
    }
    return sendPrismaError(reply, err, req);
  }
}

export async function student_get(req, reply) {
  try {
    const { student_id } = req.query;
    const student = await getStudent(student_id);
    if (!student) {
      return reply.code(404).send({
        success: false,
        message: "Student not found",
        data: null,
      });
    }
    return reply.send({
      success: true,
      message: "Fetched student details",
      data: student,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function student_all_get(req, reply) {
  try {
    const { campus_id } = req.query;
    const where = campus_id ? { campus_id } : {};
    const students = await getAllStudents({
      omit: { extras: true },
      where,
    });
    const data = students.map((s) => ({
      ...s,
      label: studentDisplayName(s),
      value: s.student_id,
    }));
    return reply.send({
      success: true,
      message: "Fetched all students",
      data,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function student_delete(req, reply) {
  try {
    const { student_id } = req.query;
    await deleteStudent(student_id);
    return reply.send({
      success: true,
      message: "Student deleted successfully",
      data: null,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}
