import { prisma } from "../prisma/prisma.js"

export async function bulkUpsertAttendanceRecords({
    attendanceSessionId,
    records, // [{ studentId, status }]
    updatedBy
  },tx=prisma) {
    try {
      await prisma.$transaction(
        records.map(({ student_id, status }) =>
          tx.attendanceRecord.upsert({
            where: {
              attendanceSessionId_studentId: {
                attendanceSessionId,
                studentId:student_id,
              },
            },
            update: {
              status,
              updatedBy,
            },
            create: {
              attendanceSessionId,
              studentId:student_id,
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
},tx=prisma) {
    try {
        return await tx.attendanceSession.upsert({
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

export async function getAttendanceDetailsBySection({
    sectionId,
    date,
    campusSession,
    period
}) {
    try {
        const whereClause = {
            sectionId,
            date: new Date(date),
        };

        if (campusSession) {
            whereClause.campusSession = campusSession;
        }

        if (period) {
            whereClause.period = period;
        }

        const sessions = await prisma.attendanceSession.findMany({
            where: whereClause,
            include: {
                records: {
                    include: {
                        student: {
                            select: {
                                student_id: true,
                                student_admission_no: true,
                                student_roll_no: true,
                                student_first_name: true,
                                student_middle_name: true,
                                student_last_name: true,
                                student_photo_url: true,
                                student_gender: true,
                            },
                        },
                        updatedByTeacher: {
                            select: {
                                teacher_id: true,
                                teacher_first_name: true,
                                teacher_last_name: true,
                            },
                        },
                    },
                    orderBy: {
                        student: {
                            student_roll_no: "asc",
                        },
                    },
                },
                teacher: {
                    select: {
                        teacher_id: true,
                        teacher_first_name: true,
                        teacher_last_name: true,
                        teacher_employee_code: true,
                    },
                },
                section: {
                    select: {
                        section_id: true,
                        section_name: true,
                        section_short_name: true,
                        classRef: {
                            select: {
                                class_id: true,
                                class_name: true,
                                class_short_name: true,
                            },
                        },
                    },
                },
            },
            orderBy: [
                { campusSession: "asc" },
                { period: "asc" },
            ],
        });

        return sessions;
    } catch (err) {
        console.error(err);
        return [];
    }
}

export async function getStudentAttendanceBySection({
    studentId,
    sectionId,
    startDate,
    endDate
}) {
    try {
        const sessionWhereClause = {
            sectionId,
        };

        // Add date range filter if provided
        if (startDate || endDate) {
            sessionWhereClause.date = {};
            if (startDate) {
                sessionWhereClause.date.gte = new Date(startDate);
            }
            if (endDate) {
                sessionWhereClause.date.lte = new Date(endDate);
            }
        }

        const attendanceRecords = await prisma.attendanceRecord.findMany({
            where: {
                studentId,
                attendanceSession: sessionWhereClause,
            },
            select: {
                status: true,
                attendanceSession: {
                    select: {
                        period: true,
                        submittedAt: true,
                        teacher: {
                            select: {
                                teacher_id: true,
                                teacher_first_name: true,
                                teacher_last_name: true,
                            },
                        },
                    },
                },
            },
            orderBy: [
                {
                    attendanceSession: {
                        date: "desc",
                    },
                },
                {
                    attendanceSession: {
                        campusSession: "asc",
                    },
                },
                {
                    attendanceSession: {
                        period: "asc",
                    },
                },
            ],
        });

        return attendanceRecords;
    } catch (err) {
        console.error(err);
        return [];
    }
}
