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
    period,
  }) {
    return await prisma.$transaction(async (tx) => {
      // 1️⃣ Get or create attendance session (inside txn)
      const attendanceSession = await getOrCreateAttendanceSession(
        {
          sectionId: section_id,
          teacherId: teacher_id,
          date,
          campusSession: campus_session,
          period,
        },
        tx // pass transaction client
      );
      
      console.log("attendanceSession", attendanceSession,date);
      // 2️⃣ Validate input
      if (!attendanceSession || !records?.length) {
        throw new Error("Invalid bulk attendance input");
      }
  
      const attendanceSessionId = attendanceSession.id;
  
      // 3️⃣ Load session + enforce rules (inside txn)
      const session = await tx.attendanceSession.findUnique({
        where: { id: attendanceSessionId },
        select: {
          status: true,
          teacherId: true,
        },
      });
  
      if (!session) {
        throw new Error("Attendance session not found");
      }
  
      // 4️⃣ Business rules
      if (session.status !== "DRAFT") {
        throw new Error("Bulk create allowed only in DRAFT sessions");
      }
  
      // 5️⃣ Perform bulk upsert (inside txn)
      return await bulkUpsertAttendanceRecords(
        {
          attendanceSessionId,
          records,
          updatedBy: teacher_id,
        },
        tx // pass transaction client
      );
    });
  }

/**
 * Get today's schedule entries for a section
 * @param {Object} data - Section timetable data with days, slots, and entries
 * @returns {Array} Today's schedule entries with timing details
 */
export function getTodayEntries(data) {
  let todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  todayLabel = 'Monday'
  console.log("todayLabel",todayLabel);
  // find today's day object
  const todayDay = data.days.find(day => day.label === todayLabel && day.isActive);
  console.log("todayDay",todayDay);
  if (!todayDay) return [];

  // filter entries for today
  const todayEntries = data.entries.filter(entry => entry.dayId === todayDay.id);
  console.log("todayEntries",todayEntries);
  // map entries with slot timings
  return todayEntries.map(entry => {
    const slot = data.slots.find(s => s.id === entry.slotId);

    return {
      subject: entry.subject,
      teacher: entry.teacher,
      room: entry.room,
      startTime: slot?.startTime,
      endTime: slot?.endTime
    };
  });
}
  
