import { 
    createSchool, 
    getSchool, 
    getAllSchools, 
    updateSchool, 
    deleteSchool 
  } from "../db/school.db.js";
  
  export async function school_post(req, reply) {
    try {
      const data = req.body;
      const result = await createSchool(data);
  
      if (!result) throw new Error();
  
      reply.send({ success: true, message: "School Created Successfully" });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to create School" });
    }
  }
  
  export async function school_put(req, reply) {
    try {
      const data = req.body;
      const result = await updateSchool(data);
  
      if (!result) throw new Error();
  
      reply.send({ success: true, message: "School Updated Successfully", data: result });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to update School" });
    }
  }
  
  export async function school_get(req, reply) {
    try {
      const { school_id } = req.query;
      const school = await getSchool(school_id);
  
      reply.send({ success: true, message: "Fetched School details", data: school });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to fetch School details" });
    }
  }
  
  export async function school_all_get(req, reply) {
    try {
      const schools = await getAllSchools();
      reply.send({ success: true, message: "Fetched all Schools", data: schools });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to fetch Schools details" });
    }
  }
  
  export async function school_delete(req, reply) {
    try {
      const { school_id } = req.query;
      const result = await deleteSchool(school_id);
  
      if (!result) throw new Error();
  
      reply.send({ success: true, message: "School Deleted Successfully" });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to delete School" });
    }
  }
  