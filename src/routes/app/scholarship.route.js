import {
  create_scholarship,
  get_scholarship_by_id,
  list_scholarships,
  update_scholarship,
  delete_scholarship,
} from "../../controllers/app/scholarship.controller.js";
import {
  ScholarshipCreateSchema,
  ScholarshipUpdateSchema,
  ScholarshipGetByIdSchema,
  ScholarshipListSchema,
  ScholarshipDeleteSchema,
} from "../../schemas/app/scholarship.schema.js";

const createOpts = { schema: ScholarshipCreateSchema };
const updateOpts = { schema: ScholarshipUpdateSchema };
const getByIdOpts = { schema: ScholarshipGetByIdSchema };
const listOpts = { schema: ScholarshipListSchema };
const deleteOpts = { schema: ScholarshipDeleteSchema };

async function scholarshipRoutes(app) {
  app.post("/scholarships", createOpts, create_scholarship);
  app.get("/scholarships", listOpts, list_scholarships);
  app.get("/scholarships/:id", getByIdOpts, get_scholarship_by_id);
  app.patch("/scholarships/:id", updateOpts, update_scholarship);
  app.delete("/scholarships/:id", deleteOpts, delete_scholarship);
}

export default scholarshipRoutes;
