/**
 * Load test: Auth endpoints
 * POST /userfacing/login
 * POST /userfacing/logout
 * POST /userfacing/change-password
 *
 * Run:  k6 run test/load/auth.load.js
 * Smoke: k6 run -e SCENARIO=smoke test/load/auth.load.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, TEST_CREDENTIALS, DEFAULT_THRESHOLDS, SCENARIOS } from './config.js';

const scenario = __ENV.SCENARIO || 'load';

export const options = {
  scenarios: { default: SCENARIOS[scenario] },
  thresholds: DEFAULT_THRESHOLDS,
};

const HEADERS = { 'Content-Type': 'application/json' };

export default function () {
  // Login
  const loginRes = http.post(
    `${BASE_URL}/login`,
    JSON.stringify(TEST_CREDENTIALS),
    { headers: HEADERS, tags: { name: 'login' } }
  );

  const loginOk = check(loginRes, {
    'login 200': (r) => r.status === 200,
    'login has token': (r) => {
      try { return !!JSON.parse(r.body); } catch { return false; }
    },
  });

  if (!loginOk) {
    sleep(1);
    return;
  }

  // Extract cookie set by the server (Fastify sets JWT in a cookie)
  const cookieHeader = loginRes.headers['Set-Cookie'] || '';

  // Logout
  const logoutRes = http.post(
    `${BASE_URL}/logout`,
    null,
    { headers: { ...HEADERS, Cookie: cookieHeader }, tags: { name: 'logout' } }
  );

  check(logoutRes, { 'logout 200': (r) => r.status === 200 });

  sleep(1);
}
