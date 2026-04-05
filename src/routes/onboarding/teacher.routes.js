import {
  teacher_post,
  teacher_put,
  teacher_get,
  teacher_all_get,
  teacher_delete,
} from "../../controllers/onboarding/teacher.controller.js";
import {
  teacherCreateRequestSchema,
  teacherGetRequestSchema,
  teacherByCampusGetRequestSchema,
  teacherUpdateRequestSchema,
} from "../../schemas/onboarding/teacher.schema.js";

const teacherCreateOpts = {
  schema: {
    tags: teacherCreateRequestSchema.tags,
    body: teacherCreateRequestSchema.body,
  },
};

const teacherUpdateOpts = {
  schema: {
    tags: teacherUpdateRequestSchema.tags,
    body: teacherUpdateRequestSchema.body,
  },
};

const teacherGetOpts = {
  schema: {
    tags: teacherGetRequestSchema.tags,
    querystring: teacherGetRequestSchema.querystring,
  },
};

const teacherByCampusGetOpts = {
  schema: {
    tags: teacherByCampusGetRequestSchema.tags,
    querystring: teacherByCampusGetRequestSchema.querystring,
  },
};

async function teacherRoutes(app, options) {
  app.post("/teacher", teacherCreateOpts, teacher_post);
  app.put("/teacher", teacherUpdateOpts, teacher_put);
  app.get("/teacher", teacherGetOpts, teacher_get);
  app.get("/teacher/all", teacherByCampusGetOpts, teacher_all_get);
  app.delete("/teacher", teacherGetOpts, teacher_delete);
}

export default teacherRoutes;
