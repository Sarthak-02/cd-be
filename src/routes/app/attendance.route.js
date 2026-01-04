import { bulk_create_attendance_post } from '../../controllers/app/attendance.controller.js';
import { AttendanceBulkCreateRequestSchema } from '../../schemas/app/attendance.schema.js';


const attendanceBulkCreateOpts = {
    schema: {
        body: AttendanceBulkCreateRequestSchema
    }
};



async function attendanceRoutes(app, options) {
    app.post("/attendance/bulk_create", attendanceBulkCreateOpts, bulk_create_attendance_post);

    //   app.get("/logout",{},logoutController)
}

export default attendanceRoutes;