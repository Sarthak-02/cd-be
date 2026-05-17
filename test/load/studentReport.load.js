/**
 * Load test: Student Report endpoints
 * GET /students/:student_id/report/summary
 * GET /students/:student_id/report/grades
 * GET /students/:student_id/report/subjects
 * GET /students/:student_id/report/exams/:exam_id
 *
 * Run: k6 run -e TEST_STUDENT_ID=<id> -e TEST_EXAM_ID=<id> test/load/studentReport.load.js
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
    'http_req_duration{name:student_report_summary}': ['p(95)<2000'],
  },
};

const STUDENT_ID = __ENV.TEST_STUDENT_ID || TEST_IDS.studentId;
const EXAM_ID    = __ENV.TEST_EXAM_ID    || TEST_IDS.examId;

export function setup() {
  return loginAndGetToken();
}

export default function ({ cookie }) {
  const hdrs = authHeaders(cookie);

  // GET report summary
  const summaryRes = http.get(
    `${BASE_URL}/students/${STUDENT_ID}/report/summary`,
    { headers: hdrs, tags: { name: 'student_report_summary' } }
  );
  check(summaryRes, { 'student report summary 200': (r) => r.status === 200 });

  // GET grade report
  const gradesRes = http.get(
    `${BASE_URL}/students/${STUDENT_ID}/report/grades`,
    { headers: hdrs, tags: { name: 'student_report_grades' } }
  );
  check(gradesRes, { 'student report grades 200': (r) => r.status === 200 });

  // GET subjects report
  const subjectsRes = http.get(
    `${BASE_URL}/students/${STUDENT_ID}/report/subjects`,
    { headers: hdrs, tags: { name: 'student_report_subjects' } }
  );
  check(subjectsRes, { 'student report subjects 200': (r) => r.status === 200 });

  // GET exam-specific report
  const examRes = http.get(
    `${BASE_URL}/students/${STUDENT_ID}/report/exams/${EXAM_ID}`,
    { headers: hdrs, tags: { name: 'student_report_exam' } }
  );
  check(examRes, { 'student report exam 200': (r) => r.status === 200 });

  sleep(0.5);
}
