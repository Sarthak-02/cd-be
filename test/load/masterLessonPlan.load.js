/**
 * Load test: Master Lesson Plan endpoints
 * GET  /master-lesson-plans          (all optional filters)
 * GET  /master-lesson-plans/fetch    (board + subject + class_name + academic_year)
 * POST /master-lesson-plans          (create, admin VUs only)
 * GET  /master-lesson-plans/:id
 *
 * Run: k6 run test/load/masterLessonPlan.load.js
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

const BOARD         = __ENV.TEST_BOARD         || 'CBSE';
const SUBJECT       = __ENV.TEST_SUBJECT       || 'Mathematics';
const CLASS_NAME    = __ENV.TEST_CLASS_NAME    || 'Class 8';
const ACADEMIC_YEAR = __ENV.TEST_ACADEMIC_YEAR || '2025-26';

export function setup() {
  return loginAndGetToken();
}

export default function ({ cookie }) {
  const hdrs = authHeaders(cookie);

  // GET list (all filters optional)
  const listRes = http.get(
    `${BASE_URL}/master-lesson-plans?board=${BOARD}&subject=${encodeURIComponent(SUBJECT)}`,
    { headers: hdrs, tags: { name: 'master_plan_list' } }
  );
  check(listRes, { 'master plan list 200': (r) => r.status === 200 });

  // GET fetch (exact match lookup)
  const fetchRes = http.get(
    `${BASE_URL}/master-lesson-plans/fetch?board=${BOARD}&subject=${encodeURIComponent(SUBJECT)}&class_name=${encodeURIComponent(CLASS_NAME)}&academic_year=${ACADEMIC_YEAR}`,
    { headers: hdrs, tags: { name: 'master_plan_fetch' } }
  );
  check(fetchRes, { 'master plan fetch 200 or 404': (r) => r.status === 200 || r.status === 404 });

  // Create (1 in 10 VUs — these are global reference data, don't flood)
  if (__VU % 10 === 0) {
    const createRes = http.post(
      `${BASE_URL}/master-lesson-plans`,
      JSON.stringify({
        class_name: `Load Test Class ${__VU}`,
        subject: SUBJECT,
        board: BOARD,
        academic_year: ACADEMIC_YEAR,
        details: [
          {
            chapter: 'Chapter 1 - Basics',
            topics: ['Introduction', 'Core Concepts', 'Practice Problems'],
            month: 'June',
            estimated_weeks: 2,
          },
        ],
      }),
      { headers: hdrs, tags: { name: 'master_plan_create' } }
    );
    check(createRes, { 'master plan create 2xx': (r) => r.status < 300 });

    // GET by id
    try {
      const created = JSON.parse(createRes.body);
      const planId = created?.data?.id || created?.id;
      if (planId) {
        const getRes = http.get(
          `${BASE_URL}/master-lesson-plans/${planId}`,
          { headers: hdrs, tags: { name: 'master_plan_get_by_id' } }
        );
        check(getRes, { 'master plan get by id 200': (r) => r.status === 200 });
      }
    } catch (_) {}
  }

  sleep(1);
}
