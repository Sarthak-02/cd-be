import { bulk_create_attendance_post, edit_attendance_patch, get_attendance_details, get_student_attendance, get_today_schedule } from '../../controllers/app/attendance.controller.js';
import { AttendanceBulkCreateRequestSchema, AttendanceEditRequestSchema, AttendanceGetDetailsSchema, StudentAttendanceGetSchema, TodayScheduleGetSchema } from '../../schemas/app/attendance.schema.js';


const attendanceBulkCreateOpts = {
    schema: {
        body: AttendanceBulkCreateRequestSchema.body
    }
};

const attendanceGetDetailsOpts = {
    schema: {
        querystring: AttendanceGetDetailsSchema.querystring
    }
};

const studentAttendanceGetOpts = {
    schema: {
        body: StudentAttendanceGetSchema.body
    }
};

const todayScheduleGetOpts = {
    schema: {
        body: TodayScheduleGetSchema.body
    }
};

const attendanceEditOpts = {
    schema: {
        body: AttendanceEditRequestSchema.body
    }
};


async function attendanceRoutes(app, options) {
    app.post("/attendance/bulk_create", attendanceBulkCreateOpts, bulk_create_attendance_post);
    app.patch("/attendance/edit", attendanceEditOpts, edit_attendance_patch);
    app.get("/attendance/details", attendanceGetDetailsOpts, get_attendance_details);
    app.post("/attendance/student", studentAttendanceGetOpts, get_student_attendance);
    app.post("/attendance/today-schedule", todayScheduleGetOpts, get_today_schedule);

    //   app.get("/logout",{},logoutController)
}

export default attendanceRoutes;