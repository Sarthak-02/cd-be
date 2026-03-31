# Homework Notification System

## Overview
The homework notification system automatically notifies parents when homework is published for their children. It follows the same architecture as the attendance notification system, ensuring reliability and consistency.

## Architecture

### Service Layer
**File:** `src/services/app/homeworkNotify.service.js`

#### Main Functions:

1. **`publishHomeworkAndNotify({ homeworkId, triggeredByTeacherId })`**
   - Called when homework is published
   - Resolves all students affected by homework targets
   - Creates notifications for parents
   - Publishes to notification queue
   - Updates homework status to PUBLISHED

2. **`notifyHomeworkUpdate({ homeworkId, triggeredByTeacherId, updateType })`**
   - Optional function to send update/closure notifications
   - Can be called when homework is modified or closed
   - Similar flow but doesn't change homework status

3. **`resolveStudentsForHomework(homeworkId, tx)`**
   - Internal helper function
   - Resolves homework targets to actual students
   - Handles CLASS, SECTION, and individual STUDENT targets
   - Deduplicates students (same student may be in multiple targets)

## Workflow

### 1. Publishing Homework with Notifications

```
Teacher publishes homework
    ↓
publishHomeworkAndNotify() called
    ↓
Database Transaction:
  - Validate homework (must be DRAFT, created by teacher)
  - Update homework status to PUBLISHED
  - Resolve all target students (CLASS/SECTION/STUDENT)
  - Get parents for each student
  - Create notification records (PENDING status)
    ↓
Publish to Queue (outside transaction):
  - Send notifications to Google Cloud Pub/Sub
    ↓
Database Transaction:
  - Mark notifications as QUEUED
    ↓
Return success with stats
```

### 2. Target Resolution Logic

**STUDENT Targets:**
- Direct lookup by student_id
- Only active students included

**SECTION Targets:**
- Finds all students in specified sections
- Only active students included

**CLASS Targets:**
- Finds all students in sections belonging to specified classes
- Only active students included

**Deduplication:**
- Uses Map to ensure each student appears only once
- Even if student is in multiple targets (e.g., CLASS and SECTION)

## API Endpoints

### Publish Homework with Notifications

**Endpoint:** `POST /app/homework/:homework_id/publish`

**Request:**
```json
{
  "teacher_id": "teacher-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Homework published and notifications sent successfully",
  "data": {
    // homework object with all details
  },
  "notificationStats": {
    "queuedCount": 45,  // number of notifications sent
    "studentCount": 15   // number of students affected
  }
}
```

### Close Homework (with optional notification)

**Endpoint:** `POST /app/homework/:homework_id/close`

**Request:**
```json
{
  "teacher_id": "teacher-uuid",
  "notify": true  // optional, defaults to false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Homework closed successfully",
  "data": {
    // homework object
  },
  "notificationStats": {
    "queuedCount": 45  // if notify=true
  }
}
```

## Notification Structure

Each notification record contains:

```json
{
  "dedupeKey": "sha256-hash",           // prevents duplicate notifications
  "parentId": "parent-uuid",
  "channel": "APP",                      // APP, EMAIL, SMS, WHATSAPP
  "status": "PENDING",                   // PENDING → QUEUED → SENT/FAILED
  "sourceId": "homework-uuid",
  "sourceType": "HOMEWORK",
  "recipientType": "PARENT",
  "receiverId": "parent-uuid",
  "senderId": "teacher-uuid",
  "payload": {
    "homeworkId": "homework-uuid",
    "homeworkTitle": "Math Assignment 1",
    "homeworkDescription": "Complete exercises 1-10",
    "subject": "Mathematics",
    "dueDate": "2026-01-30T00:00:00.000Z",
    "studentId": "student-uuid",
    "studentName": "John Doe",
    "parentName": "Jane Doe",
    "notificationType": "HOMEWORK_PUBLISHED"  // or HOMEWORK_UPDATED, HOMEWORK_CLOSED
  }
}
```

## Notification Channels

Currently implemented:
- **APP**: In-app notifications (default)

Future support (infrastructure ready):
- **EMAIL**: Email notifications
- **SMS**: Text message notifications
- **WHATSAPP**: WhatsApp notifications

Channel selection will be based on parent preferences (to be implemented).

## Database Schema

### Homework Table
```prisma
model Homework {
  id          String         @id @default(uuid())
  title       String
  description String
  dueDate     DateTime
  subject     String
  createdBy   String
  status      HomeworkStatus @default(DRAFT)  // DRAFT, PUBLISHED, CLOSED
  
  teacher     Teacher              @relation(fields: [createdBy], references: [teacher_id])
  attachments HomeworkAttachment[]
  targets     HomeworkTarget[]
}
```

### HomeworkTarget Table
```prisma
model HomeworkTarget {
  id         String     @id @default(uuid())
  homeworkId String
  targetType TargetType  // CLASS | SECTION | STUDENT
  targetId   String      // class_id, section_id, or student_id
  
  homework Homework @relation(fields: [homeworkId], references: [id], onDelete: Cascade)
}
```

### Notification Table
```prisma
model Notification {
  id        String @id @default(uuid())
  dedupeKey String @unique
  
  recipientType NotificationRecipientType  // PARENT
  receiverId    String?
  parentId      String?
  senderId      String?
  
  channel NotificationChannel   // EMAIL, SMS, WHATSAPP, APP
  payload Json
  
  sourceType NotificationSourceType  // HOMEWORK
  sourceId   String                   // homeworkId
  
  status     NotificationStatus      // PENDING, QUEUED, SENT, FAILED
  retryCount Int @default(0)
  lastError  String?
  queuedAt   DateTime?
  sentAt     DateTime?
}
```

## Error Handling

### Transaction Safety
- Homework status update and notification creation happen in same transaction
- If notification creation fails, homework status is rolled back
- If queue publishing fails, notifications remain PENDING for retry

### Validations
- Homework must be in DRAFT status to publish
- Only the homework creator can publish it
- Teacher ID must match homework.createdBy

### Retry Logic
- Failed notifications can be retried up to 3 times
- Dedupe key prevents duplicate notifications on retry
- Queue infrastructure handles retry scheduling

## Example Usage

### 1. Create and Publish Homework

```javascript
// Step 1: Create homework
POST /app/homework
{
  "title": "Math Assignment 1",
  "description": "Complete exercises 1-10 from chapter 5",
  "due_date": "2026-01-30T23:59:59Z",
  "subject": "Mathematics",
  "teacher_id": "teacher-123",
  "attachments": [
    {
      "fileUrl": "https://example.com/file.pdf",
      "fileName": "exercises.pdf",
      "fileType": "application/pdf",
      "fileSize": 1024000
    }
  ],
  "targets": [
    {
      "targetType": "SECTION",
      "targetId": "section-456"
    }
  ]
}

// Step 2: Publish homework (triggers notifications)
POST /app/homework/homework-uuid/publish
{
  "teacher_id": "teacher-123"
}

// Response includes notification stats:
{
  "success": true,
  "message": "Homework published and notifications sent successfully",
  "data": { /* homework object */ },
  "notificationStats": {
    "queuedCount": 60,   // 30 students × 2 parents each
    "studentCount": 30
  }
}
```

### 2. Close Homework with Notification

```javascript
POST /app/homework/homework-uuid/close
{
  "teacher_id": "teacher-123",
  "notify": true
}
```

## Monitoring & Debugging

### Check Notification Status

Query notifications for a specific homework:
```sql
SELECT 
  id, 
  status, 
  channel, 
  recipientType,
  retryCount,
  lastError,
  sentAt
FROM Notification
WHERE sourceType = 'HOMEWORK' 
  AND sourceId = 'homework-uuid'
ORDER BY createdAt DESC;
```

### Notification Status Counts
```sql
SELECT 
  status, 
  COUNT(*) as count
FROM Notification
WHERE sourceType = 'HOMEWORK'
GROUP BY status;
```

## Future Enhancements

1. **Parent Preferences**
   - Allow parents to choose notification channels
   - Store preferences per notification type
   - Honor quiet hours

2. **Notification Templates**
   - Customizable message templates
   - Multi-language support
   - Rich formatting for different channels

3. **Student Direct Notifications**
   - Notify students directly (not just parents)
   - Support for student app users

4. **Homework Reminders**
   - Automatic reminders X days before due date
   - Escalating reminders for overdue homework

5. **Analytics**
   - Track notification delivery rates
   - Monitor channel effectiveness
   - Parent engagement metrics

## Related Files

- **Service**: `src/services/app/homeworkNotify.service.js`
- **Controller**: `src/controllers/app/homework.controller.js`
- **Routes**: `src/routes/app/homework.route.js`
- **Schemas**: `src/schemas/app/homework.schema.js`
- **DB Functions**: `src/db/homework.db.js`
- **Notification DB**: `src/db/notification.db.js`
- **Queue Publisher**: `src/infra/pubsub.publisher.js`
- **Crypto Utils**: `src/utils/crypto.js`

## Testing Checklist

- [ ] Create homework with CLASS target
- [ ] Create homework with SECTION target
- [ ] Create homework with multiple STUDENT targets
- [ ] Publish homework and verify notifications created
- [ ] Check notification count matches expected (students × parents × channels)
- [ ] Verify dedupe key prevents duplicate notifications
- [ ] Test with student in multiple targets (CLASS + SECTION)
- [ ] Verify only active students receive notifications
- [ ] Test authorization (only creator can publish)
- [ ] Test invalid status transitions
- [ ] Close homework with notify=true
- [ ] Close homework with notify=false
- [ ] Monitor notification queue processing
