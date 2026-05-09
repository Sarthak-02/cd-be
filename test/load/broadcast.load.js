/**
 * Load test: Broadcast endpoints
 * GET  /broadcast/list               (campusId optional)
 * GET  /broadcast/received           (receiverId required)
 * GET  /broadcast/sent               (createdBy required)
 * GET  /broadcast/:id
 * POST /broadcast                    (create, low VU %)
 * PUT  /broadcast/:id                (update, low VU %)
 *
 * Run: k6 run -e TEST_TEACHER_ID=<id> -e TEST_CAMPUS_ID=<id> -e TEST_SECTION_ID=<id> test/load/broadcast.load.js
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

const CAMPUS_ID  = __ENV.TEST_CAMPUS_ID  || TEST_IDS.campusId;
const SECTION_ID = __ENV.TEST_SECTION_ID || TEST_IDS.sectionId;
const TEACHER_ID = __ENV.TEST_TEACHER_ID || TEST_IDS.teacherId;

export function setup() {
  return loginAndGetToken();
}

export default function ({ cookie }) {
  const hdrs = authHeaders(cookie);

  // GET list (no required params)
  const listRes = http.get(
    `${BASE_URL}/broadcast/list?campusId=${CAMPUS_ID}`,
    { headers: hdrs, tags: { name: 'broadcast_list' } }
  );
  check(listRes, { 'broadcast list 200': (r) => r.status === 200 });

  // GET received (receiverId required)
  const receivedRes = http.get(
    `${BASE_URL}/broadcast/received?receiverId=${TEACHER_ID}&campusId=${CAMPUS_ID}`,
    { headers: hdrs, tags: { name: 'broadcast_received' } }
  );
  check(receivedRes, { 'broadcast received 200': (r) => r.status === 200 });

  // GET sent (createdBy required)
  const sentRes = http.get(
    `${BASE_URL}/broadcast/sent?createdBy=${TEACHER_ID}&campusId=${CAMPUS_ID}`,
    { headers: hdrs, tags: { name: 'broadcast_sent' } }
  );
  check(sentRes, { 'broadcast sent 200': (r) => r.status === 200 });

  // Write path — only 1 in 5 VUs
  if (__VU % 5 === 0) {
    const createRes = http.post(
      `${BASE_URL}/broadcast`,
      JSON.stringify({
        title: `Load Test Broadcast ${__VU}-${__ITER}`,
        message: 'This is a load test broadcast message.',
        campusId: CAMPUS_ID,
        targets: [{ targetType: 'SECTION', targetId: SECTION_ID }],
      }),
      { headers: hdrs, tags: { name: 'broadcast_create' } }
    );
    check(createRes, { 'broadcast create 2xx': (r) => r.status < 300 });

    // GET by id + update
    try {
      const created = JSON.parse(createRes.body);
      const broadcastId = created?.data?.id || created?.id;
      if (broadcastId) {
        const getRes = http.get(
          `${BASE_URL}/broadcast/${broadcastId}`,
          { headers: hdrs, tags: { name: 'broadcast_get_by_id' } }
        );
        check(getRes, { 'broadcast get by id 200': (r) => r.status === 200 });

        const updateRes = http.put(
          `${BASE_URL}/broadcast/${broadcastId}`,
          JSON.stringify({ category: 'information' }),
          { headers: hdrs, tags: { name: 'broadcast_update' } }
        );
        check(updateRes, { 'broadcast update 2xx': (r) => r.status < 300 });
      }
    } catch (_) {}
  }

  sleep(1);
}
