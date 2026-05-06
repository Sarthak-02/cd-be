import { getTeacherPermissions, getTeachersBySection } from "../../db/teacher.db.js";

export async function teacher_list_by_section_post(req, reply) {
  try {
    const { campus_id, section_id } = req.body;
    const teachers = await getTeachersBySection({ campus_id, section_id });
    reply.send({
      success: true,
      message: "Teachers fetched successfully",
      data: teachers,
    });
  } catch (err) {
    console.log(err);
    reply.code(500).send({
      success: false,
      message: "Unable to fetch teachers",
    });
  }
}

export async function teacher_permissions_get(req, reply) {
  try {
    const { teacher_id } = req.query;

    if (!teacher_id) {
      return reply.code(400).send({
        success: false,
        message: "teacher_id is required"
      });
    }

    const result = await getTeacherPermissions(teacher_id);

    if (result === null) {
      return reply.code(404).send({
        success: false,
        message: "Teacher not found or no permissions assigned"
      });
    }

    reply.send({
      success: true,
      message: "Teacher permissions fetched successfully",
      data: result,
    });
  } catch (err) {
    console.log(err);
    reply.code(500).send({
      success: false,
      message: "Unable to fetch teacher permissions"
    });
  }
}
