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
| `config.js` | Shared BASE_URL, TEST_IDS, thresholds, scenario presets |
| `helpers.js` | Shared `loginAndGetToken()` helper |
| `auth.load.js` | Login / logout |
| `attendance.load.js` | Bulk create, get details, student history |
| `homework.load.js` | Create, list by teacher/student/target, stats, upcoming, overdue |
| `exam.load.js` | Create, list by teacher/campus, upcoming, ongoing, grades |
| `examGrade.load.js` | Upsert, bulk upsert, get by exam/student, statistics |
| `notifications.load.js` | List, mark-all-read |
| `pickup.load.js` | Authorized persons, requests, logs |
| `broadcast.load.js` | List, received, sent, create, update |
| `lessonPlan.load.js` | Create, list, get by id, update |
| `masterLessonPlan.load.js` | List, fetch, create, get by id |
| `classPlan.load.js` | Create, list, add topics, record progress |
| `studentReport.load.js` | Summary, grades, subjects, exam-specific report |
| `teacherReport.load.js` | Sections, section summary, grades, exam report |
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

# Run individual modules
npm run test:load:homework
npm run test:load:exam
npm run test:load:examGrade
npm run test:load:lessonPlan
npm run test:load:masterLessonPlan
npm run test:load:classPlan
npm run test:load:studentReport
npm run test:load:teacherReport

# Stress test a specific module
k6 run -e SCENARIO=stress test/load/attendance.load.js

# Point at a different server
k6 run -e BASE_URL=https://your-server.com/userfacing test/load/full-journey.load.js

# Pass real IDs (recommended — defaults are placeholder values)
k6 run \
  -e TEST_SECTION_ID=sec_abc123 \
  -e TEST_TEACHER_ID=tea_xyz456 \
  -e TEST_CLASS_ID=cls_789 \
  -e TEST_STUDENT_ID=stu_001 \
  -e TEST_STUDENT_IDS=stu_1,stu_2,stu_3 \
  -e TEST_EXAM_ID=exam_001 \
  -e TEST_EXAM_SUBJECT_ID=examsub_001 \
  -e TEST_USERNAME=teacher_user \
  -e TEST_PASSWORD=secret \
  test/load/full-journey.load.js

# Save results as JSON
k6 run --out json=results.json test/load/full-journey.load.js
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `BASE_URL` | `http://localhost:5001/userfacing` | Server base URL |
| `TEST_USERNAME` | `teacher1@gmail.com` | Login username |
| `TEST_PASSWORD` | `teacher001` | Login password |
| `TEST_TEACHER_ID` | `teacher_001` | Teacher ID |
| `TEST_CAMPUS_ID` | `campus_001` | Campus ID |
| `TEST_SECTION_ID` | `section_001` | Section ID |
| `TEST_CLASS_ID` | `class_001` | Class ID (for lesson/class plans) |
| `TEST_STUDENT_ID` | `student_001` | Single student ID (for reports and grades) |
| `TEST_STUDENT_IDS` | `student_001,student_002,student_003` | Comma-separated student IDs (for attendance) |
| `TEST_EXAM_ID` | `exam_001` | Exam ID (for grades and reports) |
| `TEST_EXAM_SUBJECT_ID` | `exam_subject_001` | Exam subject ID (for grade upsert) |
| `SCENARIO` | `load` | `smoke` / `load` / `stress` / `spike` |
| `TEST_BOARD` | `CBSE` | Board name (for master lesson plans) |
| `TEST_SUBJECT` | `Mathematics` | Subject name (for master/lesson plans) |
| `TEST_CLASS_NAME` | `Class 8` | Class name string (for master lesson plans) |
| `TEST_ACADEMIC_YEAR` | `2025-26` | Academic year (for class/master plans) |

## Thresholds

All tests enforce:
- p95 response time < 2s
- Failure rate < 5%

Specific overrides:
- `attendance/bulk_create` — p95 < 3s
- `exam-grade/bulk` — p95 < 3s
- `notifications` GET — p95 < 1s
- Full journey total — p95 < 15s
