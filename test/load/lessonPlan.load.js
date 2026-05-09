/**
 * Load test: Lesson Plan endpoints
 * GET  /lesson-plans                 (all optional filters)
 * POST /lesson-plans                 (create)
 * GET  /lesson-plans/:id
 * PATCH /lesson-plans/:id
 *
 * Run: k6 run -e TEST_TEACHER_ID=<id> -e TEST_CLASS_ID=<id> -e TEST_SECTION_ID=<id> test/load/lessonPlan.load.js
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
const CLASS_ID   = __ENV.TEST_CLASS_ID   || TEST_IDS.classId;
const SECTION_ID = __ENV.TEST_SECTION_ID || TEST_IDS.sectionId;

export function setup() {
  return loginAndGetToken();
}

export default function ({ cookie }) {
  const hdrs = authHeaders(cookie);

  // GET lesson plans list
  const listRes = http.get(
    `${BASE_URL}/lesson-plans?teacher_id=${TEACHER_ID}&class_id=${CLASS_ID}`,
    { headers: hdrs, tags: { name: 'lesson_plan_list' } }
  );
  check(listRes, { 'lesson plans list 200': (r) => r.status === 200 });

  // Create (1 in 3 VUs)
  if (__VU % 3 === 0) {
    const lessonDate = new Date(Date.now() + Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const createRes = http.post(
      `${BASE_URL}/lesson-plans`,
      JSON.stringify({
        lesson_date: lessonDate,
        chapter_topic: `Chapter ${__VU} - Load Test Topic`,
        learning_objectives: ['Understand the basics', 'Apply in exercises'],
        activities: [{ type: 'lecture', duration_minutes: 30 }],
        subject: 'Mathematics',
        class_id: CLASS_ID,
        section_id: SECTION_ID,
        teacher_id: TEACHER_ID,
      }),
      { headers: hdrs, tags: { name: 'lesson_plan_create' } }
    );
    check(createRes, { 'lesson plan create 2xx': (r) => r.status < 300 });

    // GET by id + update
    try {
      const created = JSON.parse(createRes.body);
      const planId = created?.data?.id || created?.id;
      if (planId) {
        const getRes = http.get(
          `${BASE_URL}/lesson-plans/${planId}`,
          { headers: hdrs, tags: { name: 'lesson_plan_get_by_id' } }
        );
        check(getRes, { 'lesson plan get by id 200': (r) => r.status === 200 });

        const updateRes = http.patch(
          `${BASE_URL}/lesson-plans/${planId}`,
          JSON.stringify({ status: 'COMPLETED' }),
          { headers: hdrs, tags: { name: 'lesson_plan_update' } }
        );
        check(updateRes, { 'lesson plan update 2xx': (r) => r.status < 300 });
      }
    } catch (_) {}
  }

  sleep(1);
}
