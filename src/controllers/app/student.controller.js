import { getActiveStudentsBySection } from "../../db/student.db.js";

export async function students_by_section_get(req, reply) {
  try {
    const { section_id } = req.query;

    if (!section_id) {
      return reply.code(400).send({
        success: false,
        message: "section_id is required"
      });
    }

    const students = await getActiveStudentsBySection(section_id);

    // Format the response with full name
    const formattedStudents = students.map(student => ({
      student_id: student.student_id,
      name: [
        student.student_first_name,
        student.student_middle_name,
        student.student_last_name
      ].filter(Boolean).join(' '),
      profile_photo: student.student_photo_url,
      gender: student.student_gender,
      dob: student.student_dob,
      roll_number: student.student_roll_no,
      admission_number: student.student_admission_no
    }));

    reply.send({
      success: true,
      message: "Fetched active students successfully",
      data: formattedStudents
    });
  } catch (err) {
    console.log(err);
    reply.code(500).send({
      success: false,
      message: "Unable to fetch students"
    });
  }
}
