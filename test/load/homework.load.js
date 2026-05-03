/**
 * Load test: Homework endpoints
 * POST /userfacing/homework          (create)
 * GET  /userfacing/homework/teacher/all
 * GET  /userfacing/homework/student/all
 * GET  /userfacing/homework/:id
 * PATCH /userfacing/homework/:id     (update)
 * POST /userfacing/homework/:id/publish
 *
 * Run: k6 run -e TEST_TEACHER_ID=<id> -e TEST_SECTION_ID=<id> test/load/homework.load.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, DEFAULT_THRESHOLDS, SCENARIOS } from './config.js';
import { loginAndGetToken, authHeaders } from './helpers.js';

const scenario = __ENV.SCENARIO || 'load';

export const options = {
  scenarios: { default: SCENARIOS[scenario] },
  thresholds: DEFAULT_THRESHOLDS,
};

const TEACHER_ID  = __ENV.TEST_TEACHER_ID  || 'teacher_001';
const SECTION_ID  = __ENV.TEST_SECTION_ID  || 'section_001';

export function setup() {
  return loginAndGetToken();
}

export default function ({ cookie }) {
  const hdrs = authHeaders(cookie);

  // GET homework by teacher
  const byTeacherRes = http.get(
    `${BASE_URL}/homework/teacher/all`,
    { headers: hdrs, tags: { name: 'hw_by_teacher' } }
  );
  check(byTeacherRes, { 'hw by teacher 200': (r) => r.status === 200 });

  // GET homework for student
  const forStudentRes = http.get(
    `${BASE_URL}/homework/student/all`,
    { headers: hdrs, tags: { name: 'hw_for_student' } }
  );
  check(forStudentRes, { 'hw for student 200': (r) => r.status === 200 });

  // POST create homework
  const due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const createRes = http.post(
    `${BASE_URL}/homework`,
    JSON.stringify({
      title: `Load Test HW ${__VU}-${__ITER}`,
      description: 'Created during load test',
      due_date: due,
      subject: 'Mathematics',
      teacher_id: TEACHER_ID,
      targets: [{ targetType: 'SECTION', targetId: SECTION_ID }],
    }),
    { headers: hdrs, tags: { name: 'hw_create' } }
  );
  check(createRes, { 'hw create 2xx': (r) => r.status < 300 });

  // GET by id if we got one back
  try {
    const created = JSON.parse(createRes.body);
    const hwId = created?.data?.id || created?.id;
    if (hwId) {
      const getRes = http.get(
        `${BASE_URL}/homework/${hwId}`,
        { headers: hdrs, tags: { name: 'hw_get_by_id' } }
      );
      check(getRes, { 'hw get by id 200': (r) => r.status === 200 });
    }
  } catch (_) {}

  sleep(1);
}
