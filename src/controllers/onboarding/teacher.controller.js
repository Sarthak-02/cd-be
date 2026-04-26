import {
  createTeacher,
  getTeacher,
  getAllTeachers,
  updateTeacher,
  deleteTeacher,
  getTeachersBySection,
} from "../../db/teacher.db.js";

function teacherDisplayName(teacher) {
  return [
    teacher.teacher_first_name,
    teacher.teacher_middle_name,
    teacher.teacher_last_name,
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
        "Teacher already exists or conflicts with an existing record (e.g. email or employee code)",
    });
  }
  if (err.code === "P2003") {
    return reply.code(400).send({
      success: false,
      message: "Invalid reference (e.g. campus not found)",
    });
  }
  if (err.code === "P2025") {
    return reply.code(404).send({
      success: false,
      message: "Teacher not found",
    });
  }
  return reply.code(500).send({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  });
}

export async function teacher_post(req, reply) {
  try {
    const teacher = await createTeacher(req.body);
    return reply.code(201).send({
      success: true,
      message: "Teacher created successfully",
      data: teacher,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function teacher_put(req, reply) {
  try {
    const teacher = await updateTeacher(req.body);
    return reply.send({
      success: true,
      message: "Teacher updated successfully",
      data: teacher,
    });
  } catch (err) {
    if (err.code === "NO_FIELDS_TO_UPDATE") {
      return reply.code(400).send({
        success: false,
        message: "Provide at least one field to update besides teacher_id",
      });
    }
    return sendPrismaError(reply, err, req);
  }
}

export async function teacher_get(req, reply) {
  try {
    const { teacher_id } = req.query;
    const teacher = await getTeacher(teacher_id);
    if (!teacher) {
      return reply.code(404).send({
        success: false,
        message: "Teacher not found",
        data: null,
      });
    }
    return reply.send({
      success: true,
      message: "Fetched teacher details",
      data: teacher,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function teacher_all_get(req, reply) {
  try {
    const { campus_id } = req.query;
    const where = campus_id ? { campus_id } : {};
    const teachers = await getAllTeachers({
      omit: { extras: true },
      where,
    });
    const data = teachers.map((teacher) => ({
      ...teacher,
      label: teacherDisplayName(teacher),
      value: teacher.teacher_id,
    }));
    return reply.send({
      success: true,
      message: "Fetched all teachers",
      data,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function teacher_list_by_section_post(req, reply) {
  try {
    const { campus_id, section_id } = req.body;
    const teachers = await getTeachersBySection({ campus_id, section_id });
    return reply.send({
      success: true,
      message: "Teachers fetched successfully",
      data: teachers,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function teacher_delete(req, reply) {
  try {
    const { teacher_id } = req.query;
    await deleteTeacher(teacher_id);
    return reply.send({
      success: true,
      message: "Teacher deleted successfully",
      data: null,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}
