import { prisma } from "../../prisma/prisma.js";
import { getUpcomingDueHomeworkByTeacher } from "../../db/homework.db.js";
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
 * Dashboard-style summary for a teacher: timetables for given sections, up to five published
 * homework items still due (due from start of today IST) with most recently created first,
 * broadcasts received, and chat unread summary.
 */
export async function getTeacherSummary({ teacherId, campusId, sectionIds }) {
  const uniqueSectionIds = [...new Set((sectionIds || []).filter(Boolean))];

  if (!uniqueSectionIds.length) {
    return { ok: false, code: 400, message: "teacher_sections must include at least one section id" };
  }

  const teacher = await prisma.teacher.findUnique({
    where: { teacher_id: teacherId },
    select: {
      teacher_id: true,
      campus_id: true,
      teacher_status: true,
    },
  });

  if (!teacher) {
    return { ok: false, code: 404, message: "Teacher not found" };
  }

  if (teacher.campus_id !== campusId) {
    return { ok: false, code: 400, message: "campus_id does not match this teacher" };
  }

  if (teacher.teacher_status !== "active") {
    return { ok: false, code: 400, message: "Teacher is not active" };
  }

  const sections = await prisma.section.findMany({
    where: { section_id: { in: uniqueSectionIds } },
    select: {
      section_id: true,
      section_name: true,
      extras: true,
      classRef: { select: { campus_id: true } },
    },
  });

  if (sections.length !== uniqueSectionIds.length) {
    return { ok: false, code: 400, message: "One or more sections were not found" };
  }

  for (const s of sections) {
    if (s.classRef?.campus_id !== campusId) {
      return { ok: false, code: 400, message: "Section not in this campus" };
    }
  }

  const now = new Date();
  const todayYmd = formatYmdIST(now);
  const homeworkDueFrom = istStartOfDay(todayYmd);

  const announcementFromYmd = addDaysYmdIST(todayYmd, -7);
  const announcementFrom = istStartOfDay(announcementFromYmd);
  const announcementTo = istEndOfDay(todayYmd);

  const [homeworkDueRecent, recentBroadcasts, chatEndUsers] = await Promise.all([
    getUpcomingDueHomeworkByTeacher({
      teacherId,
      dueFrom: homeworkDueFrom,
      limit: 5,
    }),
    getBroadcastsByReceiverIdInDateRange(teacherId, campusId, announcementFrom, announcementTo),
    prisma.endUser.findMany({
      where: { userid: teacherId, isActive: true },
      select: { userid: true },
    }),
  ]);

  const messagingSummary = await getMessagingSummaryForUserIds(chatEndUsers.map((u) => u.userid));

  const timetablesBySection = sections.map((s) => ({
    section_id: s.section_id,
    section_name: s.section_name,
    timetable: s.extras?.timetable ?? null,
  }));

  return {
    ok: true,
    data: {
      campus_id: campusId,
      teacher_id: teacherId,
      teacher_sections: uniqueSectionIds,
      timetables_by_section: timetablesBySection,
      homework_due: homeworkDueRecent,
      homework_count: homeworkDueRecent.length,
      announcements_received: recentBroadcasts,
      announcements_count: recentBroadcasts.length,
      messages: {
        total_unread: messagingSummary.totalUnreadMessages,
        by_linked_user: messagingSummary.profiles,
      },
    },
  };
}
