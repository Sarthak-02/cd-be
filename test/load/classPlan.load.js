/**
 * Load test: Class Plan endpoints
 * GET  /class-plans                  (campus_id + teacher_id + subject + academic_year)
 * POST /class-plans                  (create)
 * GET  /class-plans/:id
 * POST /class-plans/:id/topics       (add topics)
 * POST /class-plan-topics/:id/progress (track progress)
 *
 * Run: k6 run -e TEST_TEACHER_ID=<id> -e TEST_CAMPUS_ID=<id> -e TEST_CLASS_ID=<id> -e TEST_SECTION_ID=<id> test/load/classPlan.load.js
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

const TEACHER_ID    = __ENV.TEST_TEACHER_ID    || TEST_IDS.teacherId;
const CAMPUS_ID     = __ENV.TEST_CAMPUS_ID     || TEST_IDS.campusId;
const CLASS_ID      = __ENV.TEST_CLASS_ID      || TEST_IDS.classId;
const SECTION_ID    = __ENV.TEST_SECTION_ID    || TEST_IDS.sectionId;
const ACADEMIC_YEAR = __ENV.TEST_ACADEMIC_YEAR || '2025-26';

export function setup() {
  return loginAndGetToken();
}

export default function ({ cookie }) {
  const hdrs = authHeaders(cookie);

  // GET list
  const listRes = http.get(
    `${BASE_URL}/class-plans?teacher_id=${TEACHER_ID}&campus_id=${CAMPUS_ID}`,
    { headers: hdrs, tags: { name: 'class_plan_list' } }
  );
  check(listRes, { 'class plans list 200': (r) => r.status === 200 });

  // Create + add topics + record progress (1 in 5 VUs)
  if (__VU % 5 === 0) {
    const createRes = http.post(
      `${BASE_URL}/class-plans`,
      JSON.stringify({
        campus_id: CAMPUS_ID,
        teacher_id: TEACHER_ID,
        class_id: CLASS_ID,
        subject: 'Science',
        academic_year: ACADEMIC_YEAR,
      }),
      { headers: hdrs, tags: { name: 'class_plan_create' } }
    );
    check(createRes, { 'class plan create 2xx': (r) => r.status < 300 });

    try {
      const created = JSON.parse(createRes.body);
      const planId = created?.data?.id || created?.id;
      if (!planId) return;

      // GET by id
      const getRes = http.get(
        `${BASE_URL}/class-plans/${planId}`,
        { headers: hdrs, tags: { name: 'class_plan_get_by_id' } }
      );
      check(getRes, { 'class plan get by id 200': (r) => r.status === 200 });

      // Add topics
      const topicsRes = http.post(
        `${BASE_URL}/class-plans/${planId}/topics`,
        JSON.stringify({
          topics: [
            { chapter_title: 'Chapter 1', title: 'Introduction', display_order: 1 },
            { chapter_title: 'Chapter 1', title: 'Core Concepts', display_order: 2 },
          ],
        }),
        { headers: hdrs, tags: { name: 'class_plan_add_topics' } }
      );
      check(topicsRes, { 'add topics 2xx': (r) => r.status < 300 });

      // Record progress on first topic (1 in 15 VUs to limit nested writes)
      if (__VU % 15 === 0) {
        const topicData = JSON.parse(topicsRes.body);
        const topicId = topicData?.data?.[0]?.id || topicData?.[0]?.id;
        if (topicId) {
          const progressRes = http.post(
            `${BASE_URL}/class-plan-topics/${topicId}/progress`,
            JSON.stringify({ section_id: SECTION_ID, status: 'IN_PROGRESS' }),
            { headers: hdrs, tags: { name: 'class_plan_progress' } }
          );
          check(progressRes, { 'progress create 2xx': (r) => r.status < 300 });
        }
      }
    } catch (_) {}
  }

  sleep(1);
}
