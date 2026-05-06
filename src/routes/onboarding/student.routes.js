import {
  student_post,
  student_put,
  student_get,
  student_all_get,
  student_delete,
} from "../../controllers/onboarding/student.controller.js";
import {
  studentCreateRequestSchema,
  studentGetRequestSchema,
  studentByCampusGetRequestSchema,
  studentUpdateRequestSchema,
} from "../../schemas/onboarding/student.schema.js";

const studentCreateOpts = {
  schema: {
    tags: studentCreateRequestSchema.tags,
    body: studentCreateRequestSchema.body,
  },
};

const studentUpdateOpts = {
  schema: {
    tags: studentUpdateRequestSchema.tags,
    body: studentUpdateRequestSchema.body,
  },
};

const studentGetOpts = {
  schema: {
    tags: studentGetRequestSchema.tags,
    querystring: studentGetRequestSchema.querystring,
  },
};

const studentByCampusGetOpts = {
  schema: {
    tags: studentByCampusGetRequestSchema.tags,
    querystring: studentByCampusGetRequestSchema.querystring,
  },
};

async function studentRoutes(app, options) {
  app.post("/student", studentCreateOpts, student_post);
  app.put("/student", studentUpdateOpts, student_put);
  app.get("/student", studentGetOpts, student_get);
  app.get("/student/all", studentByCampusGetOpts, student_all_get);
  app.delete("/student", studentGetOpts, student_delete);
}

export default studentRoutes;
