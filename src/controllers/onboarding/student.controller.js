import { 
    createStudent, 
    getStudent, 
    getAllStudents, 
    updateStudent, 
    deleteStudent 
  } from "../../db/student.db.js";
  
  export async function student_post(req, reply) {
    try {
      const data = req.body;
      const result = await createStudent(data);
  
      if (!result) throw new Error();
  
      reply.send({ success: true, message: "Student Created Successfully" });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to create Student" });
    }
  }
  
  export async function student_put(req, reply) {
    try {
      const data = req.body;
      const result = await updateStudent(data);
  
      if (!result) throw new Error();
  
      reply.send({ success: true, message: "Student Updated Successfully", data: result });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to update Student" });
    }
  }
  
  export async function student_get(req, reply) {
    try {
      const { student_id } = req.query;
      const student = await getStudent(student_id);
  
      reply.send({ success: true, message: "Fetched Student details", data: student });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to fetch Student details" });
    }
  }
  
  export async function student_all_get(req, reply) {
    try {
      const {campus_id} = req.query
      let students = []
      if(campus_id){
        students = await getAllStudents({extras:true},{campus_id});
      }else{
        students = await getAllStudents({extras:true});
      }
      
      students = students?.map((student) => ({...student , label:student.student_name , value: student.student_id}))
      
      reply.send({ success: true, message: "Fetched all Students", data: students });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to fetch Students details" });
    }
  }
  
  export async function student_delete(req, reply) {
    try {
      const { student_id } = req.query;
      const result = await deleteStudent(student_id);
  
      if (!result) throw new Error();
  
      reply.send({ success: true, message: "Student Deleted Successfully" });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to delete Student" });
    }
  }
  