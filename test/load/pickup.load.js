/**
 * Load test: Pickup endpoints
 * GET  /userfacing/pickup/authorized-persons
 * GET  /userfacing/pickup/requests
 * GET  /userfacing/pickup/requests/pending
 * GET  /userfacing/pickup/logs
 * GET  /userfacing/pickup/logs/today
 *
 * Run: k6 run test/load/pickup.load.js
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

export function setup() {
  return loginAndGetToken();
}

export default function ({ cookie }) {
  const hdrs = authHeaders(cookie);

  const endpoints = [
    { url: `${BASE_URL}/pickup/authorized-persons`, name: 'pickup_persons' },
    { url: `${BASE_URL}/pickup/requests`,           name: 'pickup_requests' },
    { url: `${BASE_URL}/pickup/requests/pending`,   name: 'pickup_pending'  },
    { url: `${BASE_URL}/pickup/logs`,               name: 'pickup_logs'     },
    { url: `${BASE_URL}/pickup/logs/today`,         name: 'pickup_today'    },
  ];

  for (const ep of endpoints) {
    const res = http.get(ep.url, { headers: hdrs, tags: { name: ep.name } });
    check(res, { [`${ep.name} 200`]: (r) => r.status === 200 });
  }

  sleep(1);
}
