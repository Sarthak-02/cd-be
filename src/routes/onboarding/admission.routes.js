import {
  admission_post,
  admission_put,
  admission_get,
  admission_all_get,
  admission_delete,
  admission_enroll,
} from "../../controllers/onboarding/admission.controller.js";
import {
  admissionCreateRequestSchema,
  admissionUpdateRequestSchema,
  admissionGetRequestSchema,
  admissionByCampusGetRequestSchema,
  admissionEnrollRequestSchema,
} from "../../schemas/onboarding/admission.schema.js";

const admissionCreateOpts = {
  schema: {
    tags: admissionCreateRequestSchema.tags,
    body: admissionCreateRequestSchema.body,
  },
};

const admissionUpdateOpts = {
  schema: {
    tags: admissionUpdateRequestSchema.tags,
    body: admissionUpdateRequestSchema.body,
  },
};

const admissionGetOpts = {
  schema: {
    tags: admissionGetRequestSchema.tags,
    querystring: admissionGetRequestSchema.querystring,
  },
};

const admissionByCampusGetOpts = {
  schema: {
    tags: admissionByCampusGetRequestSchema.tags,
    querystring: admissionByCampusGetRequestSchema.querystring,
  },
};

const admissionEnrollOpts = {
  schema: {
    tags: admissionEnrollRequestSchema.tags,
    body: admissionEnrollRequestSchema.body,
  },
};

async function admissionRoutes(app, options) {
  app.post("/admission", admissionCreateOpts, admission_post);
  app.put("/admission", admissionUpdateOpts, admission_put);
  app.get("/admission", admissionGetOpts, admission_get);
  app.get("/admission/all", admissionByCampusGetOpts, admission_all_get);
  app.delete("/admission", admissionGetOpts, admission_delete);
  app.post("/admission/enroll", admissionEnrollOpts, admission_enroll);
}

export default admissionRoutes;
