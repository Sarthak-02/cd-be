import { 
    createCampus, 
    getCampus, 
    getAllCampuses, 
    updateCampus, 
    deleteCampus 
  } from "../db/campus.db.js";
  
  export async function campus_post(req, reply) {
    try {
      const data = req.body;
      const result = await createCampus(data);
  
      if (!result) throw new Error();
  
      reply.send({ success: true, message: "Campus Created Successfully" });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to create Campus" });
    }
  }
  
  export async function campus_put(req, reply) {
    try {
      const data = req.body;
      const result = await updateCampus(data);
  
      if (!result) throw new Error();
  
      reply.send({ success: true, message: "Campus Updated Successfully", data: result });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to update Campus" });
    }
  }
  
  export async function campus_get(req, reply) {
    try {
      const { campus_id } = req.query;
      const campus = await getCampus(campus_id);
  
      reply.send({ success: true, message: "Fetched Campus details", data: campus });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to fetch Campus details" });
    }
  }
  
  export async function campus_all_get(req, reply) {
    try {
      let campuses = await getAllCampuses({extras:true});
      campuses =  campuses.map((campus) => ({...campus,label:campus.campus_name , value:campus.campus_id}))
      reply.send({ success: true, message: "Fetched all Campuses", data: campuses });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to fetch Campuses details" });
    }
  }
  
  export async function campus_delete(req, reply) {
    try {
      const { campus_id } = req.query;
      const result = await deleteCampus(campus_id);
  
      if (!result) throw new Error();
  
      reply.send({ success: true, message: "Campus Deleted Successfully" });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to delete Campus" });
    }
  }
  