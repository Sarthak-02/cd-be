/**
 * Load test: Attendance endpoints
 * POST /userfacing/attendance/bulk_create
 * GET  /userfacing/attendance/details
 * POST /userfacing/attendance/student
 * POST /userfacing/attendance/today-schedule
 * PATCH /userfacing/attendance/edit
 *
 * Run:  k6 run -e TEST_SECTION_ID=<id> -e TEST_TEACHER_ID=<id> test/load/attendance.load.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, DEFAULT_THRESHOLDS, SCENARIOS } from './config.js';
import { loginAndGetToken, authHeaders } from './helpers.js';

const scenario = __ENV.SCENARIO || 'load';

export const options = {
  scenarios: { default: SCENARIOS[scenario] },
  thresholds: {
    ...DEFAULT_THRESHOLDS,
    'http_req_duration{name:bulk_create}': ['p(95)<3000'],
  },
};

// IDs must exist in the DB — override via env vars
const SECTION_ID  = __ENV.TEST_SECTION_ID  || 'section_001';
const TEACHER_ID  = __ENV.TEST_TEACHER_ID  || 'teacher_001';
const STUDENT_IDS = (__ENV.TEST_STUDENT_IDS || 'student_001,student_002,student_003').split(',');

export function setup() {
  return loginAndGetToken();
}

export default function ({ cookie }) {
  const hdrs = authHeaders(cookie);
  const today = new Date().toISOString().split('T')[0];

  // GET attendance details
  const detailsRes = http.get(
    `${BASE_URL}/attendance/details?section_id=${SECTION_ID}&date=${today}`,
    { headers: hdrs, tags: { name: 'attendance_details' } }
  );
  check(detailsRes, { 'details 200': (r) => r.status === 200 });

  // POST today's schedule
  const scheduleRes = http.post(
    `${BASE_URL}/attendance/today-schedule`,
    JSON.stringify({ section_id: SECTION_ID, attendance_slots: 'daily' }),
    { headers: hdrs, tags: { name: 'today_schedule' } }
  );
  check(scheduleRes, { 'schedule 200': (r) => r.status === 200 });

  // POST bulk create attendance
  const records = STUDENT_IDS.map((sid) => ({
    student_id: sid,
    status: ['PRESENT', 'ABSENT', 'LATE'][Math.floor(Math.random() * 3)],
  }));

  const bulkRes = http.post(
    `${BASE_URL}/attendance/bulk_create`,
    JSON.stringify({
      section_id: SECTION_ID,
      teacher_id: TEACHER_ID,
      date: new Date().toISOString(),
      records,
    }),
    { headers: hdrs, tags: { name: 'bulk_create' } }
  );
  check(bulkRes, { 'bulk_create 2xx': (r) => r.status < 300 });

  // POST student attendance history
  const studentRes = http.post(
    `${BASE_URL}/attendance/student`,
    JSON.stringify({ student_id: STUDENT_IDS[0], section_id: SECTION_ID }),
    { headers: hdrs, tags: { name: 'student_attendance' } }
  );
  check(studentRes, { 'student attendance 200': (r) => r.status === 200 });

  sleep(1);
}
