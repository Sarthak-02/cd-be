/**
 * Load test: Broadcast endpoints
 * GET  /userfacing/broadcast/list
 * GET  /userfacing/broadcast/received
 * GET  /userfacing/broadcast/sent
 * POST /userfacing/broadcast   (create, low VU %)
 *
 * Run: k6 run test/load/broadcast.load.js
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

const CAMPUS_ID  = __ENV.TEST_CAMPUS_ID  || 'campus_001';
const SECTION_ID = __ENV.TEST_SECTION_ID || 'section_001';

export function setup() {
  return loginAndGetToken();
}

export default function ({ cookie }) {
  const hdrs = authHeaders(cookie);

  // Read paths
  for (const path of ['list', 'received', 'sent']) {
    const res = http.get(
      `${BASE_URL}/broadcast/${path}`,
      { headers: hdrs, tags: { name: `broadcast_${path}` } }
    );
    check(res, { [`broadcast ${path} 200`]: (r) => r.status === 200 });
  }

  // Write path — only 1 in 5 VUs to keep DB writes reasonable
  if (__VU % 5 === 0) {
    const createRes = http.post(
      `${BASE_URL}/broadcast`,
      JSON.stringify({
        title: `Load Test Broadcast ${__VU}-${__ITER}`,
        content: 'This is a load test broadcast message.',
        campus_id: CAMPUS_ID,
        targets: [{ targetType: 'SECTION', targetId: SECTION_ID }],
      }),
      { headers: hdrs, tags: { name: 'broadcast_create' } }
    );
    check(createRes, { 'broadcast create 2xx': (r) => r.status < 300 });
  }

  sleep(1);
}
