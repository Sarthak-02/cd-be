/**
 * Load test: Teacher Report endpoints
 * GET /teachers/:teacher_id/report/sections
 * GET /teachers/:teacher_id/report/sections/:section_id/summary
 * GET /teachers/:teacher_id/report/sections/:section_id/grades
 * GET /teachers/:teacher_id/report/sections/:section_id/exams/:exam_id
 *
 * Run: k6 run -e TEST_TEACHER_ID=<id> -e TEST_SECTION_ID=<id> -e TEST_EXAM_ID=<id> test/load/teacherReport.load.js
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
    'http_req_duration{name:teacher_report_summary}': ['p(95)<2000'],
  },
};

const TEACHER_ID = __ENV.TEST_TEACHER_ID || TEST_IDS.teacherId;
const SECTION_ID = __ENV.TEST_SECTION_ID || TEST_IDS.sectionId;
const EXAM_ID    = __ENV.TEST_EXAM_ID    || TEST_IDS.examId;

export function setup() {
  return loginAndGetToken();
}

export default function ({ cookie }) {
  const hdrs = authHeaders(cookie);

  // GET sections the teacher teaches
  const sectionsRes = http.get(
    `${BASE_URL}/teachers/${TEACHER_ID}/report/sections`,
    { headers: hdrs, tags: { name: 'teacher_report_sections' } }
  );
  check(sectionsRes, { 'teacher report sections 200': (r) => r.status === 200 });

  // GET section summary
  const summaryRes = http.get(
    `${BASE_URL}/teachers/${TEACHER_ID}/report/sections/${SECTION_ID}/summary`,
    { headers: hdrs, tags: { name: 'teacher_report_summary' } }
  );
  check(summaryRes, { 'teacher report summary 200': (r) => r.status === 200 });

  // GET section grades
  const gradesRes = http.get(
    `${BASE_URL}/teachers/${TEACHER_ID}/report/sections/${SECTION_ID}/grades`,
    { headers: hdrs, tags: { name: 'teacher_report_grades' } }
  );
  check(gradesRes, { 'teacher report grades 200': (r) => r.status === 200 });

  // GET specific exam report for section
  const examRes = http.get(
    `${BASE_URL}/teachers/${TEACHER_ID}/report/sections/${SECTION_ID}/exams/${EXAM_ID}`,
    { headers: hdrs, tags: { name: 'teacher_report_exam' } }
  );
  check(examRes, { 'teacher report exam 200': (r) => r.status === 200 });

  sleep(0.5);
}
