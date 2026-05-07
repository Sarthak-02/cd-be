import {
  createAdmission,
  getAdmission,
  getAllAdmissions,
  updateAdmission,
  deleteAdmission,
} from "../../db/admission.db.js";
import { createStudent } from "../../db/student.db.js";
import {
  createParent,
  createParentData,
} from "../../services/onboarding/student.service.js";

function sendPrismaError(reply, err, req) {
  req.log?.error(err);
  if (err.code === "P2002") {
    return reply.code(409).send({
      success: false,
      message: "Admission already exists or conflicts with an existing record (e.g. application number)",
    });
  }
  if (err.code === "P2003") {
    return reply.code(400).send({
      success: false,
      message: "Invalid reference (e.g. campus or class not found)",
    });
  }
  if (err.code === "P2025") {
    return reply.code(404).send({
      success: false,
      message: "Admission not found",
    });
  }
  return reply.code(500).send({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  });
}

export async function admission_post(req, reply) {
  try {
    const admission = await createAdmission(req.body);
    return reply.code(201).send({
      success: true,
      message: "Admission created successfully",
      data: admission,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function admission_put(req, reply) {
  try {
    const admission = await updateAdmission(req.body);
    return reply.send({
      success: true,
      message: "Admission updated successfully",
      data: admission,
    });
  } catch (err) {
    if (err.code === "NO_FIELDS_TO_UPDATE") {
      return reply.code(400).send({
        success: false,
        message: "Provide at least one field to update besides admission_id",
      });
    }
    return sendPrismaError(reply, err, req);
  }
}

export async function admission_get(req, reply) {
  try {
    const { admission_id } = req.query;
    const admission = await getAdmission(admission_id);
    if (!admission) {
      return reply.code(404).send({
        success: false,
        message: "Admission not found",
        data: null,
      });
    }
    return reply.send({
      success: true,
      message: "Fetched admission details",
      data: admission,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function admission_all_get(req, reply) {
  try {
    const { campus_id } = req.query;
    const where = campus_id ? { campus_id } : {};
    const admissions = await getAllAdmissions({ where });
    return reply.send({
      success: true,
      message: "Fetched all admissions",
      data: admissions,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function admission_delete(req, reply) {
  try {
    const { admission_id } = req.query;
    await deleteAdmission(admission_id);
    return reply.send({
      success: true,
      message: "Admission deleted successfully",
      data: null,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function admission_enroll(req, reply) {
  const { admission_id } = req.body;

  let admission;
  try {
    admission = await getAdmission(admission_id);
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }

  if (!admission) {
    return reply.code(404).send({
      success: false,
      message: "Admission not found",
    });
  }

  if (admission.admission_status !== "approved") {
    return reply.code(400).send({
      success: false,
      message: "Only approved applications can be enrolled",
    });
  }

  let student;
  try {
    student = await createStudent({
      student_admission_no: admission.admission_application_no,
      student_first_name: admission.admission_first_name,
      student_middle_name: admission.admission_middle_name,
      student_last_name: admission.admission_last_name,
      student_gender: admission.admission_gender,
      student_dob: admission.admission_dob,
      student_current_status: "active",
      campus_id: admission.campus_id,
      extras: admission.extras,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }

  try {
    const extras = admission.extras || {};
    const parentPayload = createParentData({
      ...extras,
      student_id: student.student_id,
    });
    await createParent(parentPayload);
  } catch (parentErr) {
    req.log?.error(parentErr);
  }

  try {
    await updateAdmission({ admission_id, admission_status: "enrolled" });
  } catch (err) {
    req.log?.error(err);
  }

  return reply.code(201).send({
    success: true,
    message: "Student record created successfully",
    data: student,
  });
}
