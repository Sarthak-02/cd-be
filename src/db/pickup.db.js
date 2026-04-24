import { prisma } from "../prisma/prisma.js";

// ─── Authorized Pickup Persons ────────────────────────────────────────────────

export async function createAuthorizedPickupPerson({ studentId, name, relationship, photoUrl, remarks }) {
    try {
        return await prisma.authorizedPickupPerson.create({
            data: { studentId, name, relationship, photoUrl, remarks }
        });
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function getAuthorizedPickupPersonsByStudent({ studentId, includeInactive = false }) {
    try {
        const start = new Date(new Date().toISOString().split("T")[0]);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const [persons, todayLog] = await Promise.all([
            prisma.authorizedPickupPerson.findMany({
                where: {
                    studentId,
                    ...(includeInactive ? {} : { isActive: true })
                },
                orderBy: { createdAt: "desc" }
            }),
            prisma.pickupLog.findFirst({
                where: {
                    studentId,
                    pickedUpAt: { gte: start, lt: end }
                },
                include: {
                    teacher: {
                        select: {
                            teacher_id: true,
                            teacher_first_name: true,
                            teacher_last_name: true
                        }
                    }
                },
                orderBy: { pickedUpAt: "desc" }
            })
        ]);

        return { persons, todayPickup: todayLog ?? null };
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function getAuthorizedPickupPersonById(id) {
    try {
        return await prisma.authorizedPickupPerson.findUnique({ where: { id } });
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function updateAuthorizedPickupPerson(id, { name, relationship, photoUrl, remarks, isActive }) {
    try {
        return await prisma.authorizedPickupPerson.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(relationship !== undefined && { relationship }),
                ...(photoUrl !== undefined && { photoUrl }),
                ...(remarks !== undefined && { remarks }),
                ...(isActive !== undefined && { isActive })
            }
        });
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function deactivateAuthorizedPickupPerson(id) {
    try {
        return await prisma.authorizedPickupPerson.update({
            where: { id },
            data: { isActive: false }
        });
    } catch (err) {
        console.error(err);
        return null;
    }
}

// ─── Pickup Requests ──────────────────────────────────────────────────────────

export async function createPickupRequest({ studentId, requestedBy, name, relationship, photoUrl, remarks, validDate }) {
    try {
        return await prisma.pickupRequest.create({
            data: {
                studentId,
                requestedBy,
                name,
                relationship,
                photoUrl,
                remarks,
                validDate: new Date(validDate)
            }
        });
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function getPickupRequestsByStudent({ studentId, date, status }) {
    try {
        return await prisma.pickupRequest.findMany({
            where: {
                studentId,
                ...(date && { validDate: new Date(date) }),
                ...(status && { status })
            },
            include: { pickupLog: true },
            orderBy: { createdAt: "desc" }
        });
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function getPendingPickupRequestsByCampus({ campusId, date }) {
    try {
        const targetDate = date ? new Date(date) : new Date();
        // Normalize to date-only (midnight UTC)
        const start = new Date(targetDate.toISOString().split("T")[0]);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        return await prisma.pickupRequest.findMany({
            where: {
                status: "PENDING",
                validDate: { gte: start, lt: end },
                student: { campus_id: campusId }
            },
            include: {
                student: {
                    select: {
                        student_id: true,
                        student_first_name: true,
                        student_last_name: true,
                        student_admission_no: true,
                        student_photo_url: true
                    }
                }
            },
            orderBy: { createdAt: "asc" }
        });
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function getPickupRequestById(id) {
    try {
        return await prisma.pickupRequest.findUnique({
            where: { id },
            include: { pickupLog: true }
        });
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function approvePickupRequest(id, { approvedBy }) {
    try {
        return await prisma.pickupRequest.update({
            where: { id },
            data: {
                status: "APPROVED",
                approvedBy,
                approvedAt: new Date()
            }
        });
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function rejectPickupRequest(id, { rejectedBy, rejectionNote }) {
    try {
        return await prisma.pickupRequest.update({
            where: { id },
            data: {
                status: "REJECTED",
                rejectedBy,
                ...(rejectionNote && { rejectionNote })
            }
        });
    } catch (err) {
        console.error(err);
        return null;
    }
}

// ─── Pickup Logs ──────────────────────────────────────────────────────────────

export async function createPickupLog({
    studentId,
    confirmedBy,
    pickedUpAt,
    pickupPhotoUrl,
    source,
    authorizedPersonId,
    pickupRequestId,
    personName,
    personRelationship,
    notes
}) {
    try {
        return await prisma.$transaction(async (tx) => {
            const log = await tx.pickupLog.create({
                data: {
                    studentId,
                    confirmedBy,
                    pickedUpAt: pickedUpAt ? new Date(pickedUpAt) : new Date(),
                    pickupPhotoUrl,
                    source,
                    authorizedPersonId,
                    pickupRequestId,
                    personName,
                    personRelationship,
                    notes
                }
            });

            // Mark the one-time request as COMPLETED once pickup is confirmed
            if (pickupRequestId) {
                await tx.pickupRequest.update({
                    where: { id: pickupRequestId },
                    data: { status: "COMPLETED" }
                });
            }

            return log;
        });
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function getPickupLogsByStudent({ studentId, limit = 20, offset = 0 }) {
    try {
        return await prisma.pickupLog.findMany({
            where: { studentId },
            include: {
                teacher: {
                    select: {
                        teacher_id: true,
                        teacher_first_name: true,
                        teacher_last_name: true
                    }
                }
            },
            orderBy: { pickedUpAt: "desc" },
            take: limit,
            skip: offset
        });
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function getTodayPickupLogsByCampus({ campusId, date }) {
    try {
        const targetDate = date ? new Date(date) : new Date();
        const start = new Date(targetDate.toISOString().split("T")[0]);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        return await prisma.pickupLog.findMany({
            where: {
                pickedUpAt: { gte: start, lt: end },
                student: { campus_id: campusId }
            },
            include: {
                student: {
                    select: {
                        student_id: true,
                        student_first_name: true,
                        student_last_name: true,
                        student_admission_no: true,
                        student_photo_url: true
                    }
                },
                teacher: {
                    select: {
                        teacher_id: true,
                        teacher_first_name: true,
                        teacher_last_name: true
                    }
                }
            },
            orderBy: { pickedUpAt: "desc" }
        });
    } catch (err) {
        console.error(err);
        return null;
    }
}
