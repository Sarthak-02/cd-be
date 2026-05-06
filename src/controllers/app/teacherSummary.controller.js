import { getTeacherSummary } from "../../services/app/teacherSummary.service.js";

export async function teacher_summary_post(req, reply) {
  try {
    const { campus_id, teacher_id, teacher_sections } = req.body;

    const result = await getTeacherSummary({
      teacherId: teacher_id,
      campusId: campus_id,
      sectionIds: teacher_sections,
    });

    if (!result.ok) {
      return reply.code(result.code).send({
        success: false,
        message: result.message,
      });
    }

    return reply.code(200).send({
      success: true,
      data: result.data,
    });
  } catch (err) {
    console.error(err);
    return reply.code(500).send({
      success: false,
      message: "Unable to load teacher summary",
    });
  }
}
