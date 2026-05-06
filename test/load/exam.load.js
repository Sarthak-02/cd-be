/**
 * Load test: Exam endpoints
 * POST /userfacing/exam              (create)
 * GET  /userfacing/exam/campus/all
 * GET  /userfacing/exam/teacher/all
 * GET  /userfacing/exam/upcoming
 * GET  /userfacing/exam/ongoing
 * GET  /userfacing/exam/stats/campus
 * GET  /userfacing/exam/:id
 *
 * Run: k6 run -e TEST_TEACHER_ID=<id> -e TEST_CAMPUS_ID=<id> -e TEST_SECTION_ID=<id> test/load/exam.load.js
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

const TEACHER_ID = __ENV.TEST_TEACHER_ID || 'teacher_001';
const CAMPUS_ID  = __ENV.TEST_CAMPUS_ID  || 'campus_001';
const SECTION_ID = __ENV.TEST_SECTION_ID || 'section_001';

export function setup() {
  return loginAndGetToken();
}

export default function ({ cookie }) {
  const hdrs = authHeaders(cookie);

  // GET upcoming exams
  const upcomingRes = http.get(
    `${BASE_URL}/exam/upcoming`,
    { headers: hdrs, tags: { name: 'exam_upcoming' } }
  );
  check(upcomingRes, { 'exam upcoming 200': (r) => r.status === 200 });

  // GET exams by campus
  const byCampusRes = http.get(
    `${BASE_URL}/exam/campus/all`,
    { headers: hdrs, tags: { name: 'exam_by_campus' } }
  );
  check(byCampusRes, { 'exam by campus 200': (r) => r.status === 200 });

  // GET exams by teacher
  const byTeacherRes = http.get(
    `${BASE_URL}/exam/teacher/all`,
    { headers: hdrs, tags: { name: 'exam_by_teacher' } }
  );
  check(byTeacherRes, { 'exam by teacher 200': (r) => r.status === 200 });

  // GET exam stats
  const statsRes = http.get(
    `${BASE_URL}/exam/stats/campus`,
    { headers: hdrs, tags: { name: 'exam_stats' } }
  );
  check(statsRes, { 'exam stats 200': (r) => r.status === 200 });

  // POST create exam (only some VUs to avoid flooding writes)
  if (__VU % 5 === 0) {
    const examDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const createRes = http.post(
      `${BASE_URL}/exam`,
      JSON.stringify({
        exam_type: 'Unit Test',
        target: 'SECTION',
        teacher_id: TEACHER_ID,
        campus_id: CAMPUS_ID,
        subjects: [
          {
            subjectName: 'Mathematics',
            examDate,
            examStartTime: '09:00',
            examEndTime: '11:00',
          },
        ],
        targets: [{ targetType: 'SECTION', targetId: SECTION_ID }],
      }),
      { headers: hdrs, tags: { name: 'exam_create' } }
    );
    check(createRes, { 'exam create 2xx': (r) => r.status < 300 });
  }

  sleep(1);
}
