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
  let sections = null
  if (user.role === "TEACHER") {
    details = await getTeacher(user.userid);
    sections = details?.extras?.teacher_sections ?? []
  } else if (user.role === "STUDENT") {
    details = await getStudent(user.userid);
    sections = details?.student_section_id ? [details?.student_section_id] : []
  }
  sections = await getSectionsByIds(sections,{section_name:true,section_id:true})
  sections = sections?.map((section) => ({label:section.section_name , value: section.section_id}))

  
  details['sections'] = sections
  const safeUser = {
    ...user,
    details
  };

  delete safeUser.passwordHash;

  const token = {
    userid: user.userid,
    username: user.username,
    role: user.role
  };

  return { token, user: safeUser };
}
