import {
    generatePickupPhotoUploadUrl,
    compressAndStorePickupPhoto
} from "../../services/app/pickupPhoto.service.js";
import {
    createAuthorizedPickupPerson,
    getAuthorizedPickupPersonsByStudent,
    getAuthorizedPickupPersonById,
    updateAuthorizedPickupPerson,
    deactivateAuthorizedPickupPerson,
    createPickupRequest,
    getPickupRequestsByStudent,
    getPendingPickupRequestsByCampus,
    getPickupRequestById,
    approvePickupRequest,
    rejectPickupRequest,
    createPickupLog,
    getPickupLogsByStudent,
    getTodayPickupLogsByCampus
} from "../../db/pickup.db.js";

// ─── Authorized Pickup Persons ────────────────────────────────────────────────

export async function add_authorized_pickup_person(req, reply) {
    try {
        const { student_id, name, relationship, photo_url, remarks } = req.body;

        const existing = await getAuthorizedPickupPersonsByStudent({ studentId: student_id });
        if (existing && existing.length >= 5) {
            return reply.code(400).send({
                success: false,
                message: "A student can have at most 5 pre-approved pickup persons"
            });
        }

        const person = await createAuthorizedPickupPerson({
            studentId: student_id,
            name,
            relationship,
            photoUrl: photo_url,
            remarks
        });

        if (!person) throw new Error("Failed to create authorized pickup person");

        reply.send({
            success: true,
            message: "Authorized pickup person added successfully",
            data: person
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ success: false, message: err.message || "Unable to add authorized pickup person" });
    }
}

export async function list_authorized_pickup_persons(req, reply) {
    try {
        const { student_id, include_inactive } = req.query;

        const result = await getAuthorizedPickupPersonsByStudent({
            studentId: student_id,
            includeInactive: include_inactive === true || include_inactive === "true"
        });

        if (!result) throw new Error("Failed to fetch authorized pickup persons");

        reply.send({
            success: true,
            data: result.persons,
            count: result.persons.length,
            already_picked_up: result.todayPickup !== null,
            today_pickup: result.todayPickup
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ success: false, message: "Unable to fetch authorized pickup persons" });
    }
}

export async function update_authorized_pickup_person(req, reply) {
    try {
        const { id } = req.params;
        const { name, relationship, photo_url, remarks, is_active } = req.body;

        const existing = await getAuthorizedPickupPersonById(id);
        if (!existing) {
            return reply.code(404).send({ success: false, message: "Authorized pickup person not found" });
        }

        const updated = await updateAuthorizedPickupPerson(id, {
            name,
            relationship,
            photoUrl: photo_url,
            remarks,
            isActive: is_active
        });

        if (!updated) throw new Error("Failed to update authorized pickup person");

        reply.send({ success: true, message: "Updated successfully", data: updated });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ success: false, message: "Unable to update authorized pickup person" });
    }
}

export async function remove_authorized_pickup_person(req, reply) {
    try {
        const { id } = req.params;

        const existing = await getAuthorizedPickupPersonById(id);
        if (!existing) {
            return reply.code(404).send({ success: false, message: "Authorized pickup person not found" });
        }

        const deactivated = await deactivateAuthorizedPickupPerson(id);
        if (!deactivated) throw new Error("Failed to deactivate authorized pickup person");

        reply.send({ success: true, message: "Authorized pickup person removed successfully" });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ success: false, message: "Unable to remove authorized pickup person" });
    }
}

// ─── Pickup Requests ──────────────────────────────────────────────────────────

export async function create_pickup_request(req, reply) {
    try {
        const { student_id, requested_by, name, relationship, photo_url, remarks, valid_date } = req.body;

        const request = await createPickupRequest({
            studentId: student_id,
            requestedBy: requested_by,
            name,
            relationship,
            photoUrl: photo_url,
            remarks,
            validDate: valid_date
        });

        if (!request) throw new Error("Failed to create pickup request");

        reply.send({
            success: true,
            message: "Pickup request created successfully",
            data: request
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ success: false, message: err.message || "Unable to create pickup request" });
    }
}

export async function list_pickup_requests(req, reply) {
    try {
        const { student_id, date, status } = req.query;

        const requests = await getPickupRequestsByStudent({ studentId: student_id, date, status });

        if (!requests) throw new Error("Failed to fetch pickup requests");

        reply.send({ success: true, data: requests, count: requests.length });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ success: false, message: "Unable to fetch pickup requests" });
    }
}

export async function list_pending_pickup_requests(req, reply) {
    try {
        const { campus_id, date } = req.query;

        const requests = await getPendingPickupRequestsByCampus({ campusId: campus_id, date });

        if (!requests) throw new Error("Failed to fetch pending pickup requests");

        reply.send({ success: true, data: requests, count: requests.length });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ success: false, message: "Unable to fetch pending pickup requests" });
    }
}

export async function approve_pickup_request(req, reply) {
    try {
        const { id } = req.params;
        const { approved_by } = req.body;

        const existing = await getPickupRequestById(id);
        if (!existing) {
            return reply.code(404).send({ success: false, message: "Pickup request not found" });
        }
        if (existing.status !== "PENDING") {
            return reply.code(400).send({ success: false, message: `Cannot approve a request with status: ${existing.status}` });
        }

        const updated = await approvePickupRequest(id, { approvedBy: approved_by });
        if (!updated) throw new Error("Failed to approve pickup request");

        reply.send({ success: true, message: "Pickup request approved", data: updated });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ success: false, message: "Unable to approve pickup request" });
    }
}

export async function reject_pickup_request(req, reply) {
    try {
        const { id } = req.params;
        const { rejected_by, rejection_note } = req.body;

        const existing = await getPickupRequestById(id);
        if (!existing) {
            return reply.code(404).send({ success: false, message: "Pickup request not found" });
        }
        if (existing.status !== "PENDING") {
            return reply.code(400).send({ success: false, message: `Cannot reject a request with status: ${existing.status}` });
        }

        const updated = await rejectPickupRequest(id, { rejectedBy: rejected_by, rejectionNote: rejection_note });
        if (!updated) throw new Error("Failed to reject pickup request");

        reply.send({ success: true, message: "Pickup request rejected", data: updated });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ success: false, message: "Unable to reject pickup request" });
    }
}

// ─── Pickup Logs ──────────────────────────────────────────────────────────────

export async function confirm_pickup(req, reply) {
    try {
        const {
            student_id,
            confirmed_by,
            picked_up_at,
            pickup_photo_url,
            source,
            authorized_person_id,
            pickup_request_id,
            person_name,
            person_relationship,
            notes
        } = req.body;

        // Validate source-specific required fields
        if (source === "AUTHORIZED_PERSON" && !authorized_person_id) {
            return reply.code(400).send({ success: false, message: "authorized_person_id is required when source is AUTHORIZED_PERSON" });
        }
        if (source === "ONE_TIME_REQUEST" && !pickup_request_id) {
            return reply.code(400).send({ success: false, message: "pickup_request_id is required when source is ONE_TIME_REQUEST" });
        }

        // Validate the one-time request is approved before confirming pickup
        if (pickup_request_id) {
            const request = await getPickupRequestById(pickup_request_id);
            if (!request) {
                return reply.code(404).send({ success: false, message: "Pickup request not found" });
            }
            if (request.status !== "APPROVED") {
                return reply.code(400).send({ success: false, message: `Pickup request must be APPROVED before confirming pickup. Current status: ${request.status}` });
            }
            if (request.pickupLog) {
                return reply.code(409).send({ success: false, message: "Pickup already confirmed for this request" });
            }
        }

        const log = await createPickupLog({
            studentId: student_id,
            confirmedBy: confirmed_by,
            pickedUpAt: picked_up_at,
            pickupPhotoUrl: pickup_photo_url,
            source,
            authorizedPersonId: authorized_person_id,
            pickupRequestId: pickup_request_id,
            personName: person_name,
            personRelationship: person_relationship,
            notes
        });

        if (!log) throw new Error("Failed to confirm pickup");

        reply.send({ success: true, message: "Pickup confirmed successfully", data: log });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ success: false, message: err.message || "Unable to confirm pickup" });
    }
}

export async function list_pickup_logs(req, reply) {
    try {
        const { student_id, limit, offset } = req.query;

        const logs = await getPickupLogsByStudent({
            studentId: student_id,
            limit: limit ? parseInt(limit) : 20,
            offset: offset ? parseInt(offset) : 0
        });

        if (!logs) throw new Error("Failed to fetch pickup logs");

        reply.send({ success: true, data: logs, count: logs.length });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ success: false, message: "Unable to fetch pickup logs" });
    }
}

export async function list_today_pickups(req, reply) {
    try {
        const { campus_id, date } = req.query;

        const logs = await getTodayPickupLogsByCampus({ campusId: campus_id, date });

        if (!logs) throw new Error("Failed to fetch today's pickup logs");

        reply.send({ success: true, data: logs, count: logs.length });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ success: false, message: "Unable to fetch today's pickup logs" });
    }
}

// ─── Photo Upload ─────────────────────────────────────────────────────────────

export async function get_pickup_photo_upload_url(req, reply) {
    try {
        const { entity, entity_id, mime_type } = req.body;

        const result = await generatePickupPhotoUploadUrl({
            entity,
            entityId: entity_id,
            mimeType: mime_type
        });

        reply.send({
            success: true,
            message: "Signed upload URL generated. Upload the image then call /pickup/photo/process.",
            data: result
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ success: false, message: err.message || "Unable to generate upload URL" });
    }
}

export async function process_pickup_photo(req, reply) {
    try {
        const { object_path, entity, entity_id } = req.body;

        const result = await compressAndStorePickupPhoto({
            objectPath: object_path,
            entity,
            entityId: entity_id
        });

        reply.send({
            success: true,
            message: "Photo compressed and stored successfully",
            data: result
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ success: false, message: err.message || "Unable to process photo" });
    }
}
