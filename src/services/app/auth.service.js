import bcrypt from "bcrypt";
import { getEndUserByUsername } from "../../db/enduser.db.js";
import { getStudent } from "../../db/student.db.js";
import { getTeacher } from "../../db/teacher.db.js";
import { getSectionsByIds } from "../../db/section.db.js";

export async function loginEndUser({ username, password }) {
  const user = await getEndUserByUsername(username);

  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error("Account is inactive");
    err.status = 403;
    throw err;
  }

  if (!user.passwordHash) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  let details = null;
  let sections = null;
  let campus = null;
  
  if (user.role === "TEACHER") {
    details = await getTeacher(user.userid);
    sections = details?.extras?.teacher_sections ?? [];
    
    // Extract campus details from teacher
    if (details?.campus) {
      campus = {
        campus_id: details.campus.campus_id,
        campus_name: details.campus.campus_name,
        term_start_date: details.campus.extras?.term_start_date || null,
        term_end_date: details.campus.extras?.term_end_date || null,
        campus_exam_types: details.campus.extras?.campus_exam_types || null,
        class_grading_config: details.campus.extras?.class_grading_config || null,
        attendance_slots: details.campus.extras?.attendance_slots || null,
      };
      // Remove campus from details to avoid duplication
      delete details.campus;
    }
  } else if (user.role === "STUDENT") {
    details = await getStudent(user.userid);
    sections = details?.student_section_id ? [details?.student_section_id] : [];
    
    // Extract campus details from student directly
    if (details?.campus) {
      campus = {
        campus_id: details.campus.campus_id,
        campus_name: details.campus.campus_name,
        term_start_date: details.campus.extras?.term_start_date || null,
        term_end_date: details.campus.extras?.term_end_date || null
      };
      // Remove campus from details to avoid duplication
      delete details.campus;
    }
  }
  
  sections = await getSectionsByIds(sections,{section_name:true,section_id:true});
  sections = sections?.map((section) => ({label:section.section_name , value: section.section_id}));

  details['sections'] = sections;
  
  const safeUser = {
    ...user,
    details,
    campus
  };

  delete safeUser.passwordHash;

  const token = {
    userid: user.userid,
    username: user.username,
    role: user.role
  };

  return { token, user: safeUser };
}
