/**
 * Load test: Exam endpoints
 * POST /exam                         (create)
 * GET  /exam/campus/all              (requires campus_id)
 * GET  /exam/teacher/all             (requires teacher_id)
 * GET  /exam/upcoming                (requires target_type + target_id)
 * GET  /exam/ongoing                 (requires target_type + target_id)
 * GET  /exam/stats/campus            (requires campus_id)
 * GET  /exam/grades/all              (requires exam_id)
 * GET  /exam/:id
 *
 * Run: k6 run -e TEST_TEACHER_ID=<id> -e TEST_CAMPUS_ID=<id> -e TEST_SECTION_ID=<id> -e TEST_EXAM_ID=<id> test/load/exam.load.js
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
const CAMPUS_ID  = __ENV.TEST_CAMPUS_ID  || TEST_IDS.campusId;
const SECTION_ID = __ENV.TEST_SECTION_ID || TEST_IDS.sectionId;
const EXAM_ID    = __ENV.TEST_EXAM_ID    || TEST_IDS.examId;

export function setup() {
  return loginAndGetToken();
}

export default function ({ cookie }) {
  const hdrs = authHeaders(cookie);

  // GET upcoming exams (target_type + target_id required)
  const upcomingRes = http.get(
    `${BASE_URL}/exam/upcoming?target_type=SECTION&target_id=${SECTION_ID}`,
    { headers: hdrs, tags: { name: 'exam_upcoming' } }
  );
  check(upcomingRes, { 'exam upcoming 200': (r) => r.status === 200 });

  // GET ongoing exams (target_type + target_id required)
  const ongoingRes = http.get(
    `${BASE_URL}/exam/ongoing?target_type=SECTION&target_id=${SECTION_ID}`,
    { headers: hdrs, tags: { name: 'exam_ongoing' } }
  );
  check(ongoingRes, { 'exam ongoing 200': (r) => r.status === 200 });

  // GET exams by campus (campus_id required)
  const byCampusRes = http.get(
    `${BASE_URL}/exam/campus/all?campus_id=${CAMPUS_ID}`,
    { headers: hdrs, tags: { name: 'exam_by_campus' } }
  );
  check(byCampusRes, { 'exam by campus 200': (r) => r.status === 200 });

  // GET exams by teacher (teacher_id required)
  const byTeacherRes = http.get(
    `${BASE_URL}/exam/teacher/all?teacher_id=${TEACHER_ID}`,
    { headers: hdrs, tags: { name: 'exam_by_teacher' } }
  );
  check(byTeacherRes, { 'exam by teacher 200': (r) => r.status === 200 });

  // GET exam stats (campus_id required)
  const statsRes = http.get(
    `${BASE_URL}/exam/stats/campus?campus_id=${CAMPUS_ID}`,
    { headers: hdrs, tags: { name: 'exam_stats' } }
  );
  check(statsRes, { 'exam stats 200': (r) => r.status === 200 });

  // GET exam grades (exam_id required)
  const gradesRes = http.get(
    `${BASE_URL}/exam/grades/all?exam_id=${EXAM_ID}`,
    { headers: hdrs, tags: { name: 'exam_grades' } }
  );
  check(gradesRes, { 'exam grades 200': (r) => r.status === 200 });

  // POST create exam (1 in 5 VUs to limit writes)
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

    // GET by id if created
    try {
      const created = JSON.parse(createRes.body);
      const examId = created?.data?.id || created?.id;
      if (examId) {
        const getRes = http.get(
          `${BASE_URL}/exam/${examId}`,
          { headers: hdrs, tags: { name: 'exam_get_by_id' } }
        );
        check(getRes, { 'exam get by id 200': (r) => r.status === 200 });
      }
    } catch (_) {}
  }

  sleep(1);
}
