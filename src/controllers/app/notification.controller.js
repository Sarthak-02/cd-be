import { finalizeAttendanceAndNotify } from "../../services/app/attendanceFinalize.service";
import { retryNotifyForSession } from "../../services/app/attendanceRecovery.service";


export async function finalizeAttendanceController(req, res) {
    try {
        const result = await finalizeAttendanceAndNotify({
            sessionId: req.params.sessionId,
            triggeredByTeacherId: req.user.teacherId,
        });
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

export async function retryAttendanceNotificationsController(req, res) {
    try {
        const result = await retryNotifyForSession(req.params.sessionId);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}
