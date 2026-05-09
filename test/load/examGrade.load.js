/**
 * Load test: Exam Grade endpoints
 * POST /exam-grade                   (upsert single)
 * POST /exam-grade/bulk              (upsert many)
 * GET  /exam-grade/exam/:exam_id
 * GET  /exam-grade/student/all       (requires student_id)
 * GET  /exam-grade/student/report    (requires student_id + exam_id)
 * GET  /exam-grade/exam/:exam_id/statistics
 *
 * Run: k6 run -e TEST_EXAM_ID=<id> -e TEST_EXAM_SUBJECT_ID=<id> -e TEST_STUDENT_ID=<id> -e TEST_TEACHER_ID=<id> test/load/examGrade.load.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, DEFAULT_THRESHOLDS, SCENARIOS, TEST_IDS } from './config.js';
import { loginAndGetToken, authHeaders } from './helpers.js';

const scenario = __ENV.SCENARIO || 'load';

export const options = {
  scenarios: { default: SCENARIOS[scenario] },
  thresholds: {
    ...DEFAULT_THRESHOLDS,
    'http_req_duration{name:grade_bulk_upsert}': ['p(95)<3000'],
  },
};

const EXAM_ID         = __ENV.TEST_EXAM_ID         || TEST_IDS.examId;
const EXAM_SUBJECT_ID = __ENV.TEST_EXAM_SUBJECT_ID || TEST_IDS.examSubjectId;
const STUDENT_ID      = __ENV.TEST_STUDENT_ID      || TEST_IDS.studentId;
const TEACHER_ID      = __ENV.TEST_TEACHER_ID      || TEST_IDS.teacherId;

export function setup() {
  return loginAndGetToken();
}

export default function ({ cookie }) {
  const hdrs = authHeaders(cookie);

  // GET grades by exam
  const byExamRes = http.get(
    `${BASE_URL}/exam-grade/exam/${EXAM_ID}`,
    { headers: hdrs, tags: { name: 'grade_by_exam' } }
  );
  check(byExamRes, { 'grades by exam 200': (r) => r.status === 200 });

  // GET grades by student
  const byStudentRes = http.get(
    `${BASE_URL}/exam-grade/student/all?student_id=${STUDENT_ID}`,
    { headers: hdrs, tags: { name: 'grade_by_student' } }
  );
  check(byStudentRes, { 'grades by student 200': (r) => r.status === 200 });

  // GET student exam report
  const reportRes = http.get(
    `${BASE_URL}/exam-grade/student/report?student_id=${STUDENT_ID}&exam_id=${EXAM_ID}`,
    { headers: hdrs, tags: { name: 'grade_student_report' } }
  );
  check(reportRes, { 'grade student report 200': (r) => r.status === 200 });

  // GET exam statistics
  const statsRes = http.get(
    `${BASE_URL}/exam-grade/exam/${EXAM_ID}/statistics`,
    { headers: hdrs, tags: { name: 'grade_statistics' } }
  );
  check(statsRes, { 'grade statistics 200': (r) => r.status === 200 });

  // Write path — upsert grades (1 in 4 VUs)
  if (__VU % 4 === 0) {
    const gradeValue = `${Math.floor(Math.random() * 40) + 60}/100`;

    const upsertRes = http.post(
      `${BASE_URL}/exam-grade`,
      JSON.stringify({
        exam_id: EXAM_ID,
        exam_subject_id: EXAM_SUBJECT_ID,
        student_id: STUDENT_ID,
        grades_obtained: gradeValue,
        graded_by: TEACHER_ID,
      }),
      { headers: hdrs, tags: { name: 'grade_upsert' } }
    );
    check(upsertRes, { 'grade upsert 2xx': (r) => r.status < 300 });
  }

  // Bulk upsert (1 in 10 VUs)
  if (__VU % 10 === 0) {
    const bulkRes = http.post(
      `${BASE_URL}/exam-grade/bulk`,
      JSON.stringify({
        grades: TEST_IDS.studentIds.map((sid) => ({
          exam_id: EXAM_ID,
          exam_subject_id: EXAM_SUBJECT_ID,
          student_id: sid,
          grades_obtained: `${Math.floor(Math.random() * 40) + 60}/100`,
          graded_by: TEACHER_ID,
        })),
      }),
      { headers: hdrs, tags: { name: 'grade_bulk_upsert' } }
    );
    check(bulkRes, { 'grade bulk upsert 2xx': (r) => r.status < 300 });
  }

  sleep(1);
}
