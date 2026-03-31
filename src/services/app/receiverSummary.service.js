import { prisma } from "../../prisma/prisma.js";
import { getHomeworkForStudent } from "../../db/homework.db.js";
import { getBroadcastsByReceiverIdInDateRange } from "./broadcast.service.js";

function formatYmdIST(d) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function istStartOfDay(ymd) {
  return new Date(`${ymd}T00:00:00.000+05:30`);
}

function istEndOfDay(ymd) {
  return new Date(`${ymd}T23:59:59.999+05:30`);
}

function addDaysYmdIST(ymd, n) {
  const base = new Date(`${ymd}T12:00:00+05:30`);
  base.setDate(base.getDate() + n);
  return formatYmdIST(base);
}

/**
 * Validates receiver as an active student for the given section and campus, then returns dashboard summary data.
 */
export async function getReceiverSummary({ receiverId, sectionId, campusId }) {
  const student = await prisma.student.findUnique({
    where: { student_id: receiverId },
    select: {
      student_id: true,
      student_section_id: true,
      campus_id: true,
      student_current_status: true,
    },
  });

  if (!student) {
    return { ok: false, code: 404, message: "Student not found" };
  }

  if (student.campus_id !== campusId) {
    return { ok: false, code: 400, message: "campusId does not match this student" };
  }

  if (student.student_section_id !== sectionId) {
    return { ok: false, code: 400, message: "sectionId does not match this student" };
  }

  if (student.student_current_status !== "active") {
    return { ok: false, code: 400, message: "Student is not active" };
  }

  const section = await prisma.section.findUnique({
    where: { section_id: sectionId },
    select: {
      section_id: true,
      section_name: true,
      extras: true,
      classRef: {
        select: {
          class_id: true,
          class_name: true,
          class_short_name: true,
          campus_id: true,
          extras: true,
        },
      },
    },
  });

  if (!section || section.classRef?.campus_id !== campusId) {
    return { ok: false, code: 400, message: "Section not found for this campus" };
  }

  const now = new Date();
  const todayYmd = formatYmdIST(now);
  const homeworkStart = istStartOfDay(todayYmd);
  const homeworkEndYmd = addDaysYmdIST(todayYmd, 7);
  const homeworkEnd = istEndOfDay(homeworkEndYmd);

  const yesterdayYmd = addDaysYmdIST(todayYmd, -1);
  const broadcastFrom = istStartOfDay(yesterdayYmd);
  const broadcastTo = istEndOfDay(todayYmd);

  const [homeworkDueSoon, recentBroadcasts, attendanceToday] = await Promise.all([
    getHomeworkForStudent({
      studentId: receiverId,
      status: "PUBLISHED",
      startDate: homeworkStart,
      endDate: homeworkEnd,
      limit: 5,
      offset: 0,
    }),
    getBroadcastsByReceiverIdInDateRange(
      receiverId,
      campusId,
      broadcastFrom,
      broadcastTo
    ),
    prisma.attendanceRecord.findMany({
      where: {
        studentId: receiverId,
        attendanceSession: {
          sectionId,
          date: new Date(`${todayYmd}T00:00:00.000Z`),
        },
      },
      select: {
        status: true,
        attendanceSession: {
          select: {
            period: true,
            campusSession: true,
            date: true,
            status: true,
          },
        },
      },
      orderBy: [
        { attendanceSession: { campusSession: "asc" } },
        { attendanceSession: { period: "asc" } },
      ],
    }),
  ]);

  const timetable = section.extras?.timetable ?? null;

  let attendanceTodayPayload;
  if (!attendanceToday.length) {
    attendanceTodayPayload = { marked: false };
  } else {
    const isPresent = attendanceToday.some(
      (r) => r.status === "PRESENT" || r.status === "LATE"
    );
    attendanceTodayPayload = {
      marked: true,
      isPresent,
      records: attendanceToday.map((r) => ({
        status: r.status,
        period: r.attendanceSession.period,
        campusSession: r.attendanceSession.campusSession,
        sessionStatus: r.attendanceSession.status,
      })),
    };
  }

  return {
    ok: true,
    data: {
      receiverId,
      sectionId,
      campusId,
      section: {
        section_id: section.section_id,
        section_name: section.section_name,
      },
      class: section.classRef
        ? {
            class_id: section.classRef.class_id,
            class_name: section.classRef.class_name,
            class_short_name: section.classRef.class_short_name,
          }
        : null,
      homeworkDueNext7Days: homeworkDueSoon,
      broadcastsReceivedYesterdayAndToday: recentBroadcasts,
      timetable,
      attendanceToday: attendanceTodayPayload,
    },
  };
}
