import {
    bulkUpsertAttendanceRecords,
    deleteAttendanceSession,
    getAttendanceBySession,
    getOrCreateAttendanceSession,
    submitAttendanceSession,
    upsertAttendanceRecord,
} from "../../db/attendance.db.js";
import { prisma } from "../../prisma/prisma.js";

export async function startAttendance({
    section_id,
    teacher_id,
    date,
    campus_session,
    period,
}) {
    return await getOrCreateAttendanceSession({
        sectionId: section_id,
        teacherId: teacher_id,
        date,
        campusSession: campus_session,
        period,
    });
}

export async function markAttendance({
    sessionId,
    student_id,
    status,
    teacher_id,
}) {
    // 🔐 Business rule: session must be editable
    const session = await prisma.attendanceSession.findUnique({
        where: { id: sessionId },
        select: { status: true },
    });

    if (!session) throw new Error("Attendance session not found");

    if (session.status === "LOCKED") {
        throw new Error("Attendance session is locked");
    }

    return await upsertAttendanceRecord({
        attendanceSessionId: sessionId,
        studentId: student_id,
        status,
        updatedBy: teacher_id,
    });
}

export async function submitAttendance(sessionId) {
    return await submitAttendanceSession(sessionId);
}

export async function viewAttendance(sessionId) {
    return await getAttendanceBySession(sessionId);
}

export async function removeAttendanceSession(sessionId) {
    return await deleteAttendanceSession(sessionId);
}


/**
 * Bulk create attendance records
 * Used for first-time marking (e.g. "Mark all present")
 */
export async function bulkCreateAttendance({
    records, // [{ student_id, status }]
    teacher_id,
    section_id,
    date,
    campus_session,
    period
}) {

    const attendanceSession = getOrCreateAttendanceSession({ sectionId: section_id, teacherId: teacher_id, date, campusSession: campus_session, period })

    // 1️⃣ Validate input
    if (!attendanceSession || !records?.length) {
        throw new Error("Invalid bulk attendance input");
    }

    const attendanceSessionId = attendanceSession?.id

    // 2️⃣ Load session + enforce rules
    const session = await prisma.attendanceSession.findUnique({
        where: { id: attendanceSessionId },
        select: {
            status: true,
            teacherId: true,
        },
    });

    if (!session) {
        throw new Error("Attendance session not found");
    }

    // 3️⃣ Business rules
    if (session.status !== "DRAFT") {
        throw new Error("Bulk create allowed only in DRAFT sessions");
    }

    // 4️⃣ Perform bulk create
    return await bulkUpsertAttendanceRecords({
        attendanceSessionId,
        records,
        updatedBy: teacher_id,
    });
}

