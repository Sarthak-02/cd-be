# Load Tests (k6)

## Prerequisites

Install [k6](https://k6.io/docs/get-started/installation/):

```bash
# macOS
brew install k6
```

## Files

| File | What it tests |
|---|---|
| `config.js` | Shared BASE_URL, thresholds, scenario presets |
| `helpers.js` | Shared `loginAndGetToken()` helper |
| `auth.load.js` | Login / logout |
| `attendance.load.js` | Bulk create, get details, student history |
| `homework.load.js` | Create, list, get by id |
| `exam.load.js` | Create, list by teacher/campus, upcoming |
| `notifications.load.js` | List, mark-all-read |
| `pickup.load.js` | Authorized persons, requests, logs |
| `broadcast.load.js` | List received/sent, create |
| `full-journey.load.js` | End-to-end teacher session (recommended) |

## Scenarios

| Name | VUs | Duration |
|---|---|---|
| `smoke` | 2 | 30s |
| `load` | ramp to 20 | ~2m |
| `stress` | ramp to 100 | ~2m |
| `spike` | instant 100 | 50s |

## Running

```bash
# Smoke test (verify things work before a real run)
npm run test:smoke

# Default load test on full journey
npm run test:load:journey

# Stress test a specific module
k6 run -e SCENARIO=stress test/load/attendance.load.js

# Point at a different server
k6 run -e BASE_URL=https://your-server.com/userfacing test/load/full-journey.load.js

# Pass real IDs
k6 run \
  -e TEST_SECTION_ID=sec_abc123 \
  -e TEST_TEACHER_ID=tea_xyz456 \
  -e TEST_STUDENT_IDS=stu_1,stu_2,stu_3 \
  -e TEST_USERNAME=teacher_user \
  -e TEST_PASSWORD=secret \
  test/load/full-journey.load.js

# Save HTML report
k6 run --out json=results.json test/load/full-journey.load.js
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `BASE_URL` | `http://localhost:5001/userfacing` | Server base URL |
| `TEST_USERNAME` | `test_teacher` | Login username |
| `TEST_PASSWORD` | `test1234` | Login password |
| `TEST_SECTION_ID` | `section_001` | Section ID used in tests |
| `TEST_TEACHER_ID` | `teacher_001` | Teacher ID used in tests |
| `TEST_STUDENT_IDS` | `student_001,student_002,student_003` | Comma-separated student IDs |
| `TEST_CAMPUS_ID` | `campus_001` | Campus ID used in exam/broadcast tests |
| `SCENARIO` | `load` | `smoke` / `load` / `stress` / `spike` |
