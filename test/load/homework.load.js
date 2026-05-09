/**
 * Load test: Homework endpoints
 * POST /homework                     (create)
 * GET  /homework/teacher/all         (requires teacher_id)
 * GET  /homework/student/all         (requires student_id)
 * GET  /homework/target/all          (requires target_type + target_id)
 * GET  /homework/stats/teacher       (requires teacher_id)
 * GET  /homework/upcoming            (requires teacher_id)
 * GET  /homework/overdue             (requires teacher_id)
 * GET  /homework/:id
 * PATCH /homework/:id/publish
 *
 * Run: k6 run -e TEST_TEACHER_ID=<id> -e TEST_SECTION_ID=<id> -e TEST_STUDENT_ID=<id> test/load/homework.load.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, DEFAULT_THRESHOLDS, SCENARIOS, TEST_IDS } from './config.js';
import { loginAndGetToken, authHeaders } from './helpers.js';

const scenario = __ENV.SCENARIO || 'load';

export const options = {
  scenarios: { default: SCENARIOS[scenario] },
  thresholds: DEFAULT_THRESHOLDS,
};

const TEACHER_ID = __ENV.TEST_TEACHER_ID || TEST_IDS.teacherId;
const SECTION_ID = __ENV.TEST_SECTION_ID || TEST_IDS.sectionId;
const STUDENT_ID = __ENV.TEST_STUDENT_ID || TEST_IDS.studentId;

export function setup() {
  return loginAndGetToken();
}

export default function ({ cookie }) {
  const hdrs = authHeaders(cookie);

  // GET homework by teacher (teacher_id required)
  const byTeacherRes = http.get(
    `${BASE_URL}/homework/teacher/all?teacher_id=${TEACHER_ID}`,
    { headers: hdrs, tags: { name: 'hw_by_teacher' } }
  );
  check(byTeacherRes, { 'hw by teacher 200': (r) => r.status === 200 });

  // GET homework for student (student_id required)
  const forStudentRes = http.get(
    `${BASE_URL}/homework/student/all?student_id=${STUDENT_ID}`,
    { headers: hdrs, tags: { name: 'hw_for_student' } }
  );
  check(forStudentRes, { 'hw for student 200': (r) => r.status === 200 });

  // GET homework by target (target_type + target_id required)
  const byTargetRes = http.get(
    `${BASE_URL}/homework/target/all?target_type=SECTION&target_id=${SECTION_ID}`,
    { headers: hdrs, tags: { name: 'hw_by_target' } }
  );
  check(byTargetRes, { 'hw by target 200': (r) => r.status === 200 });

  // GET homework stats
  const statsRes = http.get(
    `${BASE_URL}/homework/stats/teacher?teacher_id=${TEACHER_ID}`,
    { headers: hdrs, tags: { name: 'hw_stats' } }
  );
  check(statsRes, { 'hw stats 200': (r) => r.status === 200 });

  // GET upcoming homework
  const upcomingRes = http.get(
    `${BASE_URL}/homework/upcoming?teacher_id=${TEACHER_ID}`,
    { headers: hdrs, tags: { name: 'hw_upcoming' } }
  );
  check(upcomingRes, { 'hw upcoming 200': (r) => r.status === 200 });

  // GET overdue homework
  const overdueRes = http.get(
    `${BASE_URL}/homework/overdue?teacher_id=${TEACHER_ID}`,
    { headers: hdrs, tags: { name: 'hw_overdue' } }
  );
  check(overdueRes, { 'hw overdue 200': (r) => r.status === 200 });

  // POST create homework (only some VUs to limit writes)
  if (__VU % 3 === 0) {
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

    // GET by id and publish if created
    try {
      const created = JSON.parse(createRes.body);
      const hwId = created?.data?.id || created?.id;
      if (hwId) {
        const getRes = http.get(
          `${BASE_URL}/homework/${hwId}`,
          { headers: hdrs, tags: { name: 'hw_get_by_id' } }
        );
        check(getRes, { 'hw get by id 200': (r) => r.status === 200 });

        // Publish (only 1 in 3 to avoid repeated notifications)
        if (__VU % 9 === 0) {
          const publishRes = http.post(
            `${BASE_URL}/homework/${hwId}/publish`,
            JSON.stringify({ teacher_id: TEACHER_ID }),
            { headers: hdrs, tags: { name: 'hw_publish' } }
          );
          check(publishRes, { 'hw publish 2xx': (r) => r.status < 300 });
        }
      }
    } catch (_) {}
  }

  sleep(1);
}
