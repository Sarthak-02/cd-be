import { bulkCreateAttendance } from "../../services/app/attendance.service";
import { finalizeAttendanceAndNotify } from "../../services/app/attendanceFinalize.service";

export async function bulk_create_attendance_post(req, reply) {
    try {
      const data = req.body;
      const {section_id,teacher_id,date,campus_session="FULL_DAY",period = "OVERALL",records} = data;

      
      const session_id = await bulkCreateAttendance(section_id,teacher_id,date,campus_session,period);
    
      if (!session_id) throw new Error("Bulk Create Attendance failed");

      const notification = await finalizeAttendanceAndNotify({
                  sessionId: session_id,
                  triggeredByTeacherId: teacher_id,
              });
      
      if (!notification) throw new Error("finalizeAttendanceAndNotify failed")
  
      reply.send({ success: true, message: "Attendance Registered Successfully" });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to Register Attendance" });
    }
  }