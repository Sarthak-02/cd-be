import {
  createMasterLessonPlan,
  getMasterLessonPlanById,
  listMasterLessonPlans,
  fetchMasterLessonPlan,
  updateMasterLessonPlan,
  deleteMasterLessonPlan,
} from "../../db/masterLessonPlan.db.js";

export async function create_master_lesson_plan(req, reply) {
  try {
    const { class_name, subject, board, academic_year, details } = req.body;

    const plan = await createMasterLessonPlan({
      className: class_name,
      subject,
      board,
      academicYear: academic_year,
      details,
    });

    reply.code(201).send({ success: true, message: "Master lesson plan created", data: plan });
  } catch (err) {
    if (err.code === "P2002") {
      return reply.code(409).send({
        success: false,
        message: "A master lesson plan for this class, subject, board, and academic year already exists",
      });
    }
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to create master lesson plan" });
  }
}

export async function get_master_lesson_plan_by_id(req, reply) {
  try {
    const plan = await getMasterLessonPlanById(req.params.master_lesson_plan_id);

    if (!plan) {
      return reply.code(404).send({ success: false, message: "Master lesson plan not found" });
    }

    reply.send({ success: true, data: plan });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to fetch master lesson plan" });
  }
}

export async function list_master_lesson_plans(req, reply) {
  try {
    const { class_name, subject, board, academic_year, limit = 50, offset = 0 } = req.query || {};

    const { rows, total } = await listMasterLessonPlans({
      className: class_name,
      subject,
      board,
      academicYear: academic_year,
      limit,
      offset,
    });

    reply.send({ success: true, data: rows, count: rows.length, total });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to list master lesson plans" });
  }
}

export async function update_master_lesson_plan(req, reply) {
  try {
    const { master_lesson_plan_id } = req.params;
    const body = req.body;

    const patch = {};
    if (body.class_name !== undefined) patch.className = body.class_name;
    if (body.subject !== undefined) patch.subject = body.subject;
    if (body.board !== undefined) patch.board = body.board;
    if (body.academic_year !== undefined) patch.academicYear = body.academic_year;
    if (body.details !== undefined) patch.details = body.details;

    const plan = await updateMasterLessonPlan(master_lesson_plan_id, patch);

    if (!plan) {
      return reply.code(404).send({ success: false, message: "Master lesson plan not found" });
    }

    reply.send({ success: true, message: "Master lesson plan updated", data: plan });
  } catch (err) {
    if (err.code === "P2002") {
      return reply.code(409).send({
        success: false,
        message: "A master lesson plan for this class, subject, board, and academic year already exists",
      });
    }
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to update master lesson plan" });
  }
}

export async function delete_master_lesson_plan(req, reply) {
  try {
    const ok = await deleteMasterLessonPlan(req.params.master_lesson_plan_id);

    if (!ok) {
      return reply.code(404).send({ success: false, message: "Master lesson plan not found" });
    }

    reply.send({ success: true, message: "Master lesson plan deleted" });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to delete master lesson plan" });
  }
}

export async function fetch_master_lesson_plan(req, reply) {
  try {
    const { board, subject, class_name, academic_year } = req.query;

    const plans = await fetchMasterLessonPlan({
      board,
      subject,
      className: class_name,
      academicYear: academic_year,
    });

    if (!plans.length) {
      return reply.code(404).send({
        success: false,
        message: "No master lesson plan found for the given board, subject, and class",
      });
    }

    reply.send({ success: true, data: plans, count: plans.length });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to fetch master lesson plan" });
  }
}
