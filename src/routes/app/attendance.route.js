import { bulk_create_attendance_post, get_attendance_details, get_student_attendance } from '../../controllers/app/attendance.controller.js';
import { AttendanceBulkCreateRequestSchema, AttendanceGetDetailsSchema, StudentAttendanceGetSchema } from '../../schemas/app/attendance.schema.js';


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
        querystring: StudentAttendanceGetSchema.querystring
    }
};


async function attendanceRoutes(app, options) {
    app.post("/attendance/bulk_create", attendanceBulkCreateOpts, bulk_create_attendance_post);
    app.get("/attendance/details", attendanceGetDetailsOpts, get_attendance_details);
    app.get("/attendance/student", studentAttendanceGetOpts, get_student_attendance);

    //   app.get("/logout",{},logoutController)
}

export default attendanceRoutes;