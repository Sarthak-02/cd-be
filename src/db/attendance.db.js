import { prisma } from "../prisma/prisma.js"

export async function bulkUpsertAttendanceRecords({
    attendanceSessionId,
    records, // [{ studentId, status }]
    updatedBy
  }) {
    try {
      await prisma.$transaction(
        records.map(({ studentId, status }) =>
          prisma.attendanceRecord.upsert({
            where: {
              attendanceSessionId_studentId: {
                attendanceSessionId,
                studentId,
              },
            },
            update: {
              status,
              updatedBy,
            },
            create: {
              attendanceSessionId,
              studentId,
              status
            },
          })
        )
      );

      return attendanceSessionId
    } catch (err) {
      console.error(err);
      return null;
    }
  }
  

export async function deleteAttendanceRecord(attendanceSessionId, studentId) {
    try {
        await prisma.attendanceRecord.delete({
            where: {
                attendanceSessionId_studentId: {
                    attendanceSessionId,
                    studentId,
                },
            },
        });
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

export async function getAttendanceSummary(attendanceSessionId) {
    try {
        return await prisma.attendanceRecord.groupBy({
            by: ["status"],
            where: { attendanceSessionId },
            _count: {
                status: true,
            },
        });
    } catch (err) {
        console.error(err);
        return [];
    }
}

export async function getStudentAttendanceHistory(studentId, limit = 50) {
    try {
        return await prisma.attendanceRecord.findMany({
            where: { studentId },
            include: {
                attendanceSession: {
                    select: {
                        date: true,
                        campusSession: true,
                        period: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: limit,
        });
    } catch (err) {
        console.error(err);
        return [];
    }
}

export async function getAttendanceBySession(attendanceSessionId) {
    try {
        return await prisma.attendanceRecord.findMany({
            where: { attendanceSessionId },
            include: {
                student: {
                    select: {
                        student_id: true,
                        student_first_name: true,
                        student_last_name: true,
                        student_roll_no: true,
                        student_photo_url: true,
                    },
                },
            },
            orderBy: {
                student: {
                    student_roll_no: "asc",
                },
            },
        });
    } catch (err) {
        console.error(err);
        return [];
    }
}

export async function upsertAttendanceRecord({
    attendanceSessionId,
    studentId,
    status,
    updatedBy
}) {
    try {
        return await prisma.attendanceRecord.upsert({
            where: {
                attendanceSessionId_studentId: {
                    attendanceSessionId,
                    studentId,
                },
            },
            update: {
                status,
                updatedBy,
            },
            create: {
                attendanceSessionId,
                studentId,
                status
            },
        });
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function getOrCreateAttendanceSession({
    sectionId,
    teacherId,
    date,
    campusSession = "FULL_DAY",
    period = "OVERALL",
}) {
    try {
        return await prisma.attendanceSession.upsert({
            where: {
                sectionId_date_campusSession_period: {
                    sectionId,
                    date,
                    campusSession,
                    period,
                },
            },
            update: {}, // no-op if already exists
            create: {
                sectionId,
                teacherId,
                date,
                campusSession,
                period,
                status: "DRAFT",
            },
        });
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function submitAttendanceSession(sessionId) {
    try {
        return await prisma.attendanceSession.update({
            where: { id: sessionId },
            data: {
                status: "SUBMITTED",
                submittedAt: new Date(),
            },
        });
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function lockAttendanceSession(sessionId) {
    try {
        return await prisma.attendanceSession.update({
            where: { id: sessionId },
            data: {
                status: "LOCKED",
                lockedAt: new Date(),
            },
        });
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function deleteAttendanceSession(sessionId) {
    try {
        // Optional safety check
        const session = await prisma.attendanceSession.findUnique({
            where: { id: sessionId },
            select: { status: true },
        });

        if (!session) return false;

        if (session.status !== "DRAFT") {
            throw new Error("Only DRAFT sessions can be deleted");
        }

        await prisma.attendanceSession.delete({
            where: { id: sessionId },
        });

        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

