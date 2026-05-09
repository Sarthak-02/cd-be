import {
  campusTierPermission_post,
  campusTierPermission_get,
  campusTierPermission_all_get,
  campusTierPermission_put,
  campusTierPermission_delete,
} from "../../controllers/onboarding/campusTierPermission.controller.js";
import {
  campusTierPermissionUpsertSchema,
  campusTierPermissionUpdateSchema,
  campusTierPermissionGetSchema,
  campusTierPermissionDeleteSchema,
  campusAllPermissionsGetSchema,
} from "../../schemas/onboarding/campusTierPermission.schema.js";

const upsertOpts = {
  schema: { tags: campusTierPermissionUpsertSchema.tags, body: campusTierPermissionUpsertSchema.body },
};

const updateOpts = {
  schema: { tags: campusTierPermissionUpdateSchema.tags, body: campusTierPermissionUpdateSchema.body },
};

const getOpts = {
  schema: { tags: campusTierPermissionGetSchema.tags, querystring: campusTierPermissionGetSchema.querystring },
};

const deleteOpts = {
  schema: { tags: campusTierPermissionDeleteSchema.tags, querystring: campusTierPermissionDeleteSchema.querystring },
};

const allGetOpts = {
  schema: { tags: campusAllPermissionsGetSchema.tags, querystring: campusAllPermissionsGetSchema.querystring },
};

async function campusTierPermissionRoutes(app, options) {
  app.post("/campus-tier-permission", upsertOpts, campusTierPermission_post);
  app.put("/campus-tier-permission", updateOpts, campusTierPermission_put);
  app.get("/campus-tier-permission", getOpts, campusTierPermission_get);
  app.get("/campus-tier-permission/all", allGetOpts, campusTierPermission_all_get);
  app.delete("/campus-tier-permission", deleteOpts, campusTierPermission_delete);
}

export default campusTierPermissionRoutes;
