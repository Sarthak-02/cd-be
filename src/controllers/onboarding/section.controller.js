import { 
    createSection, 
    getSection, 
    getAllSections, 
    updateSection, 
    deleteSection, 
    getSectionsByCampus
  } from "../../db/section.db.js";
  
  export async function section_post(req, reply) {
    try {
      const data = req.body;
      const result = await createSection(data);
  
      if (!result) throw new Error();
  
      reply.send({ success: true, message: "Section Created Successfully" });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to create Section" });
    }
  }
  
  export async function section_put(req, reply) {
    try {
      const data = req.body;
      const result = await updateSection(data);
  
      if (!result) throw new Error();
  
      reply.send({ success: true, message: "Section Updated Successfully", data: result });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to update Section" });
    }
  }
  
  export async function section_get(req, reply) {
    try {
      const { section_id } = req.query;
      const sec = await getSection(section_id);
  
      reply.send({ success: true, message: "Fetched Section details", data: sec });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to fetch Section details" });
    }
  }
  
  export async function section_all_get(req, reply) {
    try {

      const {campus_id} = req.query

      let sections = []
      if (campus_id){
        sections = await getSectionsByCampus(campus_id);
      }else{
        sections = await getAllSections({extras:true});
      }

      sections = sections?.map((section) => ({...section,label:section.section_name , value: section.section_id}))
      
      reply.send({ success: true, message: "Fetched all Sections", data: sections });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to fetch Sections details" });
    }
  }
  
  export async function section_delete(req, reply) {
    try {
      const { section_id } = req.query;
      const result = await deleteSection(section_id);
  
      if (!result) throw new Error();
  
      reply.send({ success: true, message: "Section Deleted Successfully" });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to delete Section" });
    }
  }
  