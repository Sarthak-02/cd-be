import { prisma } from "../../prisma/prisma.js";
import { getHomeworkForStudent } from "../../db/homework.db.js";
import { getExamsForStudent } from "../../db/exam.db.js";
import { listLessonPlansForStudentSectionSummary } from "../../db/lessonPlan.db.js";
import { getMessagingSummaryForUserIds } from "../../db/chat.db.js";
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

  const lessonPlanFromYmd = addDaysYmdIST(todayYmd, -7);
  const lessonPlanToYmd = addDaysYmdIST(todayYmd, 30);
  const lessonPlanFrom = istStartOfDay(lessonPlanFromYmd);
  const lessonPlanTo = istEndOfDay(lessonPlanToYmd);

  const examEndYmd = addDaysYmdIST(todayYmd, 60);
  const examStart = istStartOfDay(todayYmd);
  const examEnd = istEndOfDay(examEndYmd);

  const classId = section.classRef?.class_id;

  const [
    homeworkDueSoon,
    recentBroadcasts,
    attendanceToday,
    lessonPlansWindow,
    upcomingExams,
    parentRows,
  ] = await Promise.all([
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
    classId
      ? listLessonPlansForStudentSectionSummary({
          campusId,
          classId,
          sectionId,
          lessonDateFrom: lessonPlanFrom,
          lessonDateTo: lessonPlanTo,
          limit: 5,
        })
      : Promise.resolve([]),
    getExamsForStudent({
      studentId: receiverId,
      status: "PUBLISHED",
      startDate: examStart,
      endDate: examEnd,
      limit: 5,
      offset: 0,
    }),
    prisma.parent.findMany({
      where: { student_id: receiverId },
      select: { parent_id: true },
    }),
  ]);

  const chatUserCandidates = [receiverId, ...parentRows.map((p) => p.parent_id)];
  const chatEndUsers = await prisma.endUser.findMany({
    where: { userid: { in: chatUserCandidates }, isActive: true },
    select: { userid: true },
  });
  const messagingSummary = await getMessagingSummaryForUserIds(chatEndUsers.map((u) => u.userid));

  const examsSummary = upcomingExams.map((exam) => ({
    id: exam.id,
    examType: exam.examType,
    status: exam.status,
    campusId: exam.campusId,
    subjects: (exam.subjects || []).map((s) => ({
      id: s.id,
      subjectName: s.subjectName,
      examDate: s.examDate,
      examStartTime: s.examStartTime,
      examEndTime: s.examEndTime,
    })),
  }));

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
      messages: {
        totalUnread: messagingSummary.totalUnreadMessages,
        byLinkedUser: messagingSummary.profiles,
      },
      lessonPlanning: {
        window: { from: lessonPlanFromYmd, to: lessonPlanToYmd },
        items: lessonPlansWindow,
        count: lessonPlansWindow.length,
      },
      homework: {
        dueNextSevenDays: homeworkDueSoon,
        count: homeworkDueSoon.length,
      },
      announcements: {
        recent: recentBroadcasts,
        count: recentBroadcasts.length,
      },
      exams: {
        window: { from: todayYmd, to: examEndYmd },
        items: examsSummary,
        count: examsSummary.length,
      },
    },
  };
}
