/**
 * Full user-journey load test — simulates a realistic teacher session:
 *   1. Login
 *   2. Get today's attendance schedule
 *   3. Submit bulk attendance
 *   4. Check notifications
 *   5. List homework (by teacher)
 *   6. List upcoming exams (by section)
 *   7. List lesson plans
 *   8. Check exam grades
 *   9. Logout
 *
 * Run:
 *   k6 run \
 *     -e TEST_SECTION_ID=<id> \
 *     -e TEST_TEACHER_ID=<id> \
 *     -e TEST_CLASS_ID=<id> \
 *     -e TEST_STUDENT_IDS=id1,id2,id3 \
 *     -e TEST_EXAM_ID=<id> \
 *     test/load/full-journey.load.js
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL, TEST_CREDENTIALS, DEFAULT_THRESHOLDS, SCENARIOS, TEST_IDS } from './config.js';

const scenario = __ENV.SCENARIO || 'load';

export const options = {
  scenarios: { default: SCENARIOS[scenario] },
  thresholds: {
    ...DEFAULT_THRESHOLDS,
    'http_req_duration{name:login}':             ['p(95)<1500'],
    'http_req_duration{name:bulk_create}':       ['p(95)<3000'],
    'http_req_duration{name:get_notifications}': ['p(95)<1000'],
    journey_duration: ['p(95)<15000'],
  },
};

const journeyDuration = new Trend('journey_duration');

const SECTION_ID  = __ENV.TEST_SECTION_ID  || TEST_IDS.sectionId;
const TEACHER_ID  = __ENV.TEST_TEACHER_ID  || TEST_IDS.teacherId;
const CLASS_ID    = __ENV.TEST_CLASS_ID    || TEST_IDS.classId;
const EXAM_ID     = __ENV.TEST_EXAM_ID     || TEST_IDS.examId;
const STUDENT_IDS = (__ENV.TEST_STUDENT_IDS || TEST_IDS.studentIds.join(',')).split(',');

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export default function () {
  const journeyStart = Date.now();
  let cookie = '';

  group('1. Login', () => {
    const res = http.post(
      `${BASE_URL}/login`,
      JSON.stringify(TEST_CREDENTIALS),
      { headers: JSON_HEADERS, tags: { name: 'login' } }
    );
    check(res, { 'login 200': (r) => r.status === 200 });
    cookie = res.headers['Set-Cookie'] || '';
  });

  if (!cookie) {
    journeyDuration.add(Date.now() - journeyStart);
    return;
  }

  const hdrs = { ...JSON_HEADERS, Cookie: cookie };

  group('2. Today schedule', () => {
    const res = http.post(
      `${BASE_URL}/attendance/today-schedule`,
      JSON.stringify({ section_id: SECTION_ID, attendance_slots: 'daily' }),
      { headers: hdrs, tags: { name: 'today_schedule' } }
    );
    check(res, { 'schedule 200': (r) => r.status === 200 });
  });

  sleep(0.5);

  group('3. Bulk attendance', () => {
    const records = STUDENT_IDS.map((sid) => ({
      student_id: sid,
      status: Math.random() > 0.15 ? 'PRESENT' : 'ABSENT',
    }));
    const res = http.post(
      `${BASE_URL}/attendance/bulk_create`,
      JSON.stringify({
        section_id: SECTION_ID,
        teacher_id: TEACHER_ID,
        date: new Date().toISOString(),
        records,
      }),
      { headers: hdrs, tags: { name: 'bulk_create' } }
    );
    check(res, { 'attendance 2xx': (r) => r.status < 300 });
  });

  sleep(0.5);

  group('4. Notifications', () => {
    const res = http.get(
      `${BASE_URL}/notifications`,
      { headers: hdrs, tags: { name: 'get_notifications' } }
    );
    check(res, { 'notifications 200': (r) => r.status === 200 });
  });

  group('5. Homework list', () => {
    // teacher_id is required by schema
    const res = http.get(
      `${BASE_URL}/homework/teacher/all?teacher_id=${TEACHER_ID}`,
      { headers: hdrs, tags: { name: 'hw_list' } }
    );
    check(res, { 'homework 200': (r) => r.status === 200 });
  });

  group('6. Upcoming exams', () => {
    // target_type + target_id required by schema
    const res = http.get(
      `${BASE_URL}/exam/upcoming?target_type=SECTION&target_id=${SECTION_ID}`,
      { headers: hdrs, tags: { name: 'exam_upcoming' } }
    );
    check(res, { 'exams 200': (r) => r.status === 200 });
  });

  group('7. Lesson plans', () => {
    const res = http.get(
      `${BASE_URL}/lesson-plans?teacher_id=${TEACHER_ID}&class_id=${CLASS_ID}`,
      { headers: hdrs, tags: { name: 'lesson_plans' } }
    );
    check(res, { 'lesson plans 200': (r) => r.status === 200 });
  });

  group('8. Exam grades', () => {
    const res = http.get(
      `${BASE_URL}/exam-grade/exam/${EXAM_ID}`,
      { headers: hdrs, tags: { name: 'exam_grades' } }
    );
    check(res, { 'exam grades 200': (r) => r.status === 200 });
  });

  sleep(0.5);

  group('9. Logout', () => {
    const res = http.post(
      `${BASE_URL}/logout`,
      null,
      { headers: hdrs, tags: { name: 'logout' } }
    );
    check(res, { 'logout 200': (r) => r.status === 200 });
  });

  journeyDuration.add(Date.now() - journeyStart);
  sleep(1);
}
