import {
    add_authorized_pickup_person,
    list_authorized_pickup_persons,
    update_authorized_pickup_person,
    remove_authorized_pickup_person,
    create_pickup_request,
    list_pickup_requests,
    list_pending_pickup_requests,
    approve_pickup_request,
    reject_pickup_request,
    confirm_pickup,
    list_pickup_logs,
    list_today_pickups,
    get_pickup_photo_upload_url,
    process_pickup_photo
} from "../../controllers/app/pickup.controller.js";

import {
    PickupAuthorizedPersonCreateSchema,
    PickupAuthorizedPersonListSchema,
    PickupAuthorizedPersonUpdateSchema,
    PickupAuthorizedPersonDeleteSchema,
    PickupRequestCreateSchema,
    PickupRequestListSchema,
    PickupRequestPendingSchema,
    PickupRequestApproveSchema,
    PickupRequestRejectSchema,
    PickupLogCreateSchema,
    PickupLogListSchema,
    PickupLogTodaySchema,
    PickupPhotoUploadUrlSchema,
    PickupPhotoProcessSchema
} from "../../schemas/app/pickup.schema.js";

const authorizedPersonCreateOpts = { schema: { body: PickupAuthorizedPersonCreateSchema.body } };
const authorizedPersonListOpts = { schema: { querystring: PickupAuthorizedPersonListSchema.querystring } };
const authorizedPersonUpdateOpts = { schema: { params: PickupAuthorizedPersonUpdateSchema.params, body: PickupAuthorizedPersonUpdateSchema.body } };
const authorizedPersonDeleteOpts = { schema: { params: PickupAuthorizedPersonDeleteSchema.params } };

const pickupRequestCreateOpts = { schema: { body: PickupRequestCreateSchema.body } };
const pickupRequestListOpts = { schema: { querystring: PickupRequestListSchema.querystring } };
const pickupRequestPendingOpts = { schema: { querystring: PickupRequestPendingSchema.querystring } };
const pickupRequestApproveOpts = { schema: { params: PickupRequestApproveSchema.params, body: PickupRequestApproveSchema.body } };
const pickupRequestRejectOpts = { schema: { params: PickupRequestRejectSchema.params, body: PickupRequestRejectSchema.body } };

const pickupLogCreateOpts = { schema: { body: PickupLogCreateSchema.body } };
const pickupLogListOpts = { schema: { querystring: PickupLogListSchema.querystring } };
const pickupLogTodayOpts = { schema: { querystring: PickupLogTodaySchema.querystring } };

const pickupPhotoUploadUrlOpts = { schema: { body: PickupPhotoUploadUrlSchema.body } };
const pickupPhotoProcessOpts = { schema: { body: PickupPhotoProcessSchema.body } };

async function pickupRoutes(app) {
    // ── Authorized Pickup Persons ─────────────────────────────────────────────
    app.post("/pickup/authorized-persons", authorizedPersonCreateOpts, add_authorized_pickup_person);
    app.get("/pickup/authorized-persons", authorizedPersonListOpts, list_authorized_pickup_persons);
    app.patch("/pickup/authorized-persons/:id", authorizedPersonUpdateOpts, update_authorized_pickup_person);
    app.delete("/pickup/authorized-persons/:id", authorizedPersonDeleteOpts, remove_authorized_pickup_person);

    // ── One-time Pickup Requests ──────────────────────────────────────────────
    app.post("/pickup/requests", pickupRequestCreateOpts, create_pickup_request);
    app.get("/pickup/requests", pickupRequestListOpts, list_pickup_requests);
    app.get("/pickup/requests/pending", pickupRequestPendingOpts, list_pending_pickup_requests);
    app.patch("/pickup/requests/:id/approve", pickupRequestApproveOpts, approve_pickup_request);
    app.patch("/pickup/requests/:id/reject", pickupRequestRejectOpts, reject_pickup_request);

    // ── Pickup Logs (teacher confirmation) ───────────────────────────────────
    app.post("/pickup/logs", pickupLogCreateOpts, confirm_pickup);
    app.get("/pickup/logs", pickupLogListOpts, list_pickup_logs);
    app.get("/pickup/logs/today", pickupLogTodayOpts, list_today_pickups);

    // ── Photo Upload ──────────────────────────────────────────────────────────
    app.post("/pickup/photo/upload-url", pickupPhotoUploadUrlOpts, get_pickup_photo_upload_url);
    app.post("/pickup/photo/process", pickupPhotoProcessOpts, process_pickup_photo);
}

export default pickupRoutes;
