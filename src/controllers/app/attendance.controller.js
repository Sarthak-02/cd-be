import { bulkCreateAttendance } from "../../services/app/attendance.service.js";
import { finalizeAttendanceAndNotify } from "../../services/app/attendanceFinalize.service.js";
import { getAttendanceDetailsBySection, getStudentAttendanceBySection } from "../../db/attendance.db.js";
import { getActiveStudentsBySection } from "../../db/student.db.js";

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

export async function get_attendance_details(req, reply) {
    try {
        const { section_id, date, campus_session, period } = req.query;

        if (!section_id || !date) {
            return reply.code(400).send({ 
                success: false, 
                message: "section_id and date are required" 
            });
        }

        // Check if the provided date is today's date
        const providedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        providedDate.setHours(0, 0, 0, 0);
        const isToday = providedDate.getTime() === today.getTime();

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

        reply.send({ 
            success: true, 
            data: attendanceDetails ? attendanceDetails[0] : {}
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