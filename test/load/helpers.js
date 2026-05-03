/**
 * Shared helper: login once and return { cookie, body }.
 * Use inside setup() so each VU group gets a token before the test starts.
 */
import http from 'k6/http';
import { BASE_URL, TEST_CREDENTIALS } from './config.js';

const HEADERS = { 'Content-Type': 'application/json' };

export function loginAndGetToken() {
  const res = http.post(
    `${BASE_URL}/login`,
    JSON.stringify(TEST_CREDENTIALS),
    { headers: HEADERS }
  );

  if (res.status !== 200) {
    throw new Error(`Login failed: ${res.status} ${res.body}`);
  }

  const cookie = res.headers['Set-Cookie'] || '';
  let body = {};
  try { body = JSON.parse(res.body); } catch (_) {}

  return { cookie, body };
}

export function authHeaders(cookie) {
  return { 'Content-Type': 'application/json', Cookie: cookie };
}
