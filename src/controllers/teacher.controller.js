import { 
    createTeacher, 
    getTeacher, 
    getAllTeachers, 
    updateTeacher, 
    deleteTeacher 
  } from "../db/teacher.db.js";
  
  export async function teacher_post(req, reply) {
    try {
      const data = req.body;
      const result = await createTeacher(data);
  
      if (!result) throw new Error();
  
      reply.send({ success: true, message: "Teacher Created Successfully" });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to create Teacher" });
    }
  }
  
  export async function teacher_put(req, reply) {
    try {
      const data = req.body;
      const result = await updateTeacher(data);
  
      if (!result) throw new Error();
  
      reply.send({ success: true, message: "Teacher Updated Successfully", data: result });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to update Teacher" });
    }
  }
  
  export async function teacher_get(req, reply) {
    try {
      const { teacher_id } = req.query;
      const teacher = await getTeacher(teacher_id);
  
      reply.send({ success: true, message: "Fetched Teacher details", data: teacher });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to fetch Teacher details" });
    }
  }
  
  export async function teacher_all_get(req, reply) {
    try {
      const teachers = await getAllTeachers();
      reply.send({ success: true, message: "Fetched all Teachers", data: teachers });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to fetch Teachers details" });
    }
  }
  
  export async function teacher_delete(req, reply) {
    try {
      const { teacher_id } = req.query;
      const result = await deleteTeacher(teacher_id);
  
      if (!result) throw new Error();
  
      reply.send({ success: true, message: "Teacher Deleted Successfully" });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to delete Teacher" });
    }
  }
  