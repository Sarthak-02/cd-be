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

    // Get unique classes only
    const classesMap = new Map();
    result.permissions.forEach(section => {
      if (!classesMap.has(section.classRef.class_id)) {
        classesMap.set(section.classRef.class_id, {
          class_id: section.classRef.class_id,
          class_name: section.classRef.class_name,
        });
      }
    });
    const classes = Array.from(classesMap.values());

    const sections = result.permissions.map(section => ({
      class_id: section.classRef.class_id,
      section_id: section.section_id,
      section_name: section.section_name,
      section_subjects: section.extras?.section_subjects || []
    }));

    const students = result.permissions.flatMap(section => (
      section.students.map(student => ({
        student_id: student.student_id,
        student_name: [
          student.student_first_name,
          student.student_middle_name,
          student.student_last_name
        ].filter(Boolean).join(' '),
        student_roll_no: student.student_roll_no,
        section_id: student.student_section_id
      }))
    ));

    // Get all unique section subjects
    const sectionSubjectsMap = new Map();
    result.permissions.forEach(section => {
      const sectionSubjects = section.extras?.section_subjects || [];
      sectionSubjects.forEach(subject => {
        if (!sectionSubjectsMap.has(subject.subject_id || subject)) {
          sectionSubjectsMap.set(subject.subject_id || subject, subject);
        }
      });
    });
    const allSectionSubjects = Array.from(sectionSubjectsMap.values());
   
    reply.send({
      success: true,
      message: "Teacher permissions fetched successfully",
      data: {
        teacher_id: result.teacher_id,
        teacher_name: result.teacher_name,
        teacher_subjects: result.teacher_subjects,
        campus_id: result.campus_id,
        campus_name: result.campus_name,
        campus_grades_notification: result.campus_grades_notification,
        campus_exam_types: result.campus_exam_types,
        classes,
        sections,
        students,
        all_section_subjects: allSectionSubjects
      }
    });
  } catch (err) {
    console.log(err);
    reply.code(500).send({
      success: false,
      message: "Unable to fetch teacher permissions"
    });
  }
}
