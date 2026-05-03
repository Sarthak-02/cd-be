/**
 * Load test: Notification endpoints
 * GET   /userfacing/notifications
 * PATCH /userfacing/notifications/:id/read
 * POST  /userfacing/notifications/mark-all-read
 *
 * Run: k6 run test/load/notifications.load.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, DEFAULT_THRESHOLDS, SCENARIOS } from './config.js';
import { loginAndGetToken, authHeaders } from './helpers.js';

const scenario = __ENV.SCENARIO || 'load';

export const options = {
  scenarios: { default: SCENARIOS[scenario] },
  thresholds: {
    ...DEFAULT_THRESHOLDS,
    'http_req_duration{name:get_notifications}': ['p(95)<1000'],
  },
};

export function setup() {
  return loginAndGetToken();
}

export default function ({ cookie }) {
  const hdrs = authHeaders(cookie);

  // GET notifications (most common read path)
  const listRes = http.get(
    `${BASE_URL}/notifications`,
    { headers: hdrs, tags: { name: 'get_notifications' } }
  );
  check(listRes, { 'notifications 200': (r) => r.status === 200 });

  // Mark all read (write path, only some VUs)
  if (__VU % 10 === 0) {
    const markAllRes = http.post(
      `${BASE_URL}/notifications/mark-all-read`,
      null,
      { headers: hdrs, tags: { name: 'mark_all_read' } }
    );
    check(markAllRes, { 'mark all read 200': (r) => r.status === 200 });
  }

  sleep(0.5);
}
