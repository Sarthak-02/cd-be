// Shared config for all load test scripts
// Override BASE_URL via k6 --env flag: k6 run -e BASE_URL=http://... script.js

export const BASE_URL = __ENV.BASE_URL || 'https://vidyaarohan.in/userfacing';

// Credentials for the test user (must already exist in DB)
export const TEST_CREDENTIALS = {
  username: __ENV.TEST_USERNAME || 'teacher1@gmail.com',
  password: __ENV.TEST_PASSWORD || 'teacher001',
};

// Common IDs — override via -e flags when running against real data
export const TEST_IDS = {
  teacherId:      __ENV.TEST_TEACHER_ID       || 'teacher_001',
  campusId:       __ENV.TEST_CAMPUS_ID        || 'campus_001',
  sectionId:      __ENV.TEST_SECTION_ID       || 'section_001',
  classId:        __ENV.TEST_CLASS_ID         || 'class_001',
  studentId:      __ENV.TEST_STUDENT_ID       || 'student_001',
  studentIds:     (__ENV.TEST_STUDENT_IDS     || 'student_001,student_002,student_003').split(','),
  examId:         __ENV.TEST_EXAM_ID          || 'exam_001',
  examSubjectId:  __ENV.TEST_EXAM_SUBJECT_ID  || 'exam_subject_001',
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
