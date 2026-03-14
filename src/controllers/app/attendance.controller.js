import { bulkCreateAttendance, getTodayEntries } from "../../services/app/attendance.service.js";
import { finalizeAttendanceAndNotify } from "../../services/app/attendanceFinalize.service.js";
import { getAttendanceDetailsBySection, getStudentAttendanceBySection } from "../../db/attendance.db.js";
import { getActiveStudentsBySection } from "../../db/student.db.js";
import { getSection } from "../../db/section.db.js";

export async function bulk_create_attendance_post(req, reply) {
    try {
      const data = req.body;
      const {section_id,teacher_id,date,campus_session="FULL_DAY",period = "OVERALL",records} = data;

      
      const session_id = await bulkCreateAttendance({records,teacher_id,section_id,date,campus_session,period});
    
      if (!session_id) throw new Error("Bulk Create Attendance failed");

      const notification = await finalizeAttendanceAndNotify({
                  sessionId: session_id,
                  triggeredByTeacherId: teacher_id,
              });
      
      if (!notification.ok) throw new Error("finalizeAttendanceAndNotify failed")
  
      reply.send({ success: true, message: "Attendance Registered Successfully" });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to Register Attendance" });
    }
  }


export function checkToday(date) {
    if (!date) return false;

    // Get current date in IST timezone
    const today = new Date();
    const istFormatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    // Format both dates to IST and compare
    const todayIST = istFormatter.format(today);
    const inputDateIST = istFormatter.format(date);
    
    return todayIST === inputDateIST;
}

export async function get_attendance_details(req, reply) {
    try {
        const { section_id, date, campus_session, period } = req.query;

        if (!section_id || !date) {
            return reply.code(400).send({ 
                success: false, 
                message: "section_id and date are required" 
            });
        }
        
        const isToday = checkToday(new Date(date))

        const attendanceDetails = await getAttendanceDetailsBySection({
            sectionId: section_id,
            date,
            campusSession: campus_session,
            period
        });

        // If no attendance records found and date is today, return student details
        if ((!attendanceDetails || attendanceDetails.length === 0) && isToday) {
            const students = await getActiveStudentsBySection(section_id);

            if (students === null) {
                throw new Error("Failed to fetch students");
            }

            // Format the response similar to students_by_section_get
            const formattedStudents = students.map(student => ({
                student_id: student.student_id,
                name: [
                    student.student_first_name,
                    student.student_middle_name,
                    student.student_last_name
                ].filter(Boolean).join(' '),
                profile_photo: student.student_photo_url,
                gender: student.student_gender,
                roll_number: student.student_roll_no,
                admission_number: student.student_admission_no
            }));

            return reply.send({ 
                success: true,
                message: "No attendance records found. Returning student list.",
                data: {
                    is_attendance_taken: false,
                    students: formattedStudents
                }
            });
        }

        // If no attendance records found and date is not today
        if (!attendanceDetails || attendanceDetails.length === 0) {
            return reply.code(200).send({ 
                success: false, 
                message: "No attendance records found for the specified criteria" 
            });
        }

        // Format attendance details
        const session = attendanceDetails[0];
        const formattedAttendanceDetails = {
            is_attendance_taken: true,
            teacher_id: session.teacher?.teacher_id,
            teacher_name: [
                session.teacher?.teacher_first_name,
                session.teacher?.teacher_last_name
            ].filter(Boolean).join(' '),
            submitStatus: session.status,
            submittedAt: session.submittedAt,
            attendanceSessionId: session.id,
            section_id: session.sectionId,
            section_name: session.section.section_name,
            section_short_name: session.section.section_short_name,
            students: session.records.map(record => ({
                student_id: record.student.student_id,
                name: [
                    record.student.student_first_name,
                    record.student.student_middle_name,
                    record.student.student_last_name
                ].filter(Boolean).join(' '),
                profile_photo: record.student.student_photo_url,
                gender: record.student.student_gender,
                roll_number: record.student.student_roll_no,
                admission_number: record.student.student_admission_no,
                attendance_status: record.status,
                attendanceRecordId: record.id
            }))
        };

        reply.send({ 
            success: true, 
            data: formattedAttendanceDetails
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ 
            success: false, 
            message: "Unable to fetch attendance details" 
        });
    }
}

export async function get_student_attendance(req, reply) {
    try {
        const { student_id, section_id, start_date, end_date } = req.body;

        if (!student_id || !section_id) {
            return reply.code(400).send({ 
                success: false, 
                message: "student_id and section_id are required" 
            });
        }

        const attendanceRecords = await getStudentAttendanceBySection({
            studentId: student_id,
            sectionId: section_id,
            startDate: start_date,
            endDate: end_date
        });

        if (!attendanceRecords || attendanceRecords.length === 0) {
            return reply.code(200).send({ 
                success: true, 
                message: "No attendance records found for the student in this section" 
            });
        }

        // Calculate attendance summary
        const summary = {
            total: attendanceRecords.length,
            present: attendanceRecords.filter(r => r.status === "PRESENT").length,
            absent: attendanceRecords.filter(r => r.status === "ABSENT").length,
            late: attendanceRecords.filter(r => r.status === "LATE").length,
            excused: attendanceRecords.filter(r => r.status === "EXCUSED").length,
        };

        summary.attendance_percentage = summary.total > 0 
            ? ((summary.present + summary.late) / summary.total * 100).toFixed(2) 
            : 0;

        reply.send({ 
            success: true, 
            data: {
                summary,
                records: attendanceRecords
            }
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ 
            success: false, 
            message: "Unable to fetch student attendance records" 
        });
    }
}

export async function get_today_schedule(req, reply) {
    try {
        const { section_id } = req.query;

        if (!section_id) {
            return reply.code(400).send({ 
                success: false, 
                message: "section_id is required" 
            });
        }

        const section = await getSection(section_id);

        if (!section) {
            return reply.code(404).send({ 
                success: false, 
                message: "Section not found" 
            });
        }

        // Check if section has timetable data in extras
        if (!section.extras || !section.extras.days || !section.extras.slots || !section.extras.entries) {
            return reply.send({ 
                success: true, 
                message: "No timetable configured for this section",
                data: {
                    schedule: []
                }
            });
        }

        const todaySchedule = getTodayEntries(section.extras);

        reply.send({ 
            success: true, 
            data: {
                section_id: section.section_id,
                section_name: section.section_name,
                schedule: todaySchedule
            }
        });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ 
            success: false, 
            message: "Unable to fetch today's schedule" 
        });
    }
}