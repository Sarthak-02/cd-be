// Shared config for all load test scripts
// Override BASE_URL via k6 --env flag: k6 run -e BASE_URL=http://... script.js

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:5001/userfacing';

// Credentials for the test user (must already exist in DB)
export const TEST_CREDENTIALS = {
  username: __ENV.TEST_USERNAME || 'test_teacher',
  password: __ENV.TEST_PASSWORD || 'test1234',
};

// Common thresholds applied across tests
export const DEFAULT_THRESHOLDS = {
  http_req_duration: ['p(95)<2000'],   // 95th percentile under 2s
  http_req_failed: ['rate<0.05'],      // less than 5% failures
};

// Reusable scenario presets
export const SCENARIOS = {
  smoke: {
    executor: 'constant-vus',
    vus: 2,
    duration: '30s',
  },
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: 20 },
      { duration: '1m',  target: 20 },
      { duration: '30s', target: 0  },
    ],
  },
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: 50  },
      { duration: '1m',  target: 100 },
      { duration: '30s', target: 0   },
    ],
  },
  spike: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '10s', target: 100 },
      { duration: '30s', target: 100 },
      { duration: '10s', target: 0   },
    ],
  },
};
