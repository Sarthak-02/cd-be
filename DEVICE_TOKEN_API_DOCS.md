# Device Token API Documentation

## Overview

This API allows mobile and web clients to register and manage FCM (Firebase Cloud Messaging) device tokens for push notifications. The device tokens are stored per user and can be used by your separate FCM Cloud Run service to send push notifications.

## Base URL

All endpoints are prefixed with: `/app/device-token`

## Authentication

All endpoints require authentication via JWT token (sent as httpOnly cookie). The user information is automatically extracted from the token.

## Endpoints

### 1. Register Device Token

**Endpoint:** `POST /app/device-token/register`

**Description:** Register a new device token or update an existing one for the authenticated user.

**Request Body:**
```json
{
  "token": "fcm_device_token_here",
  "platform": "android"  // "ios" | "android" | "web"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Device token registered successfully",
  "data": {
    "id": "uuid",
    "userId": "user_id",
    "userType": "STUDENT",
    "token": "fcm_device_token_here",
    "platform": "android",
    "createdAt": "2026-01-26T10:00:00.000Z",
    "updatedAt": "2026-01-26T10:00:00.000Z",
    "lastUsedAt": "2026-01-26T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Unauthorized (invalid or missing JWT token)
- `409` - Device token already registered
- `500` - Server error

**Notes:**
- Uses upsert operation: if token already exists for the user, it updates the `lastUsedAt` and `platform`
- Automatically associates token with authenticated user's ID and role (STUDENT, TEACHER, PARENT, ADMIN)

---

### 2. Unregister Device Token

**Endpoint:** `POST /app/device-token/unregister`

**Description:** Remove a specific device token for the authenticated user.

**Request Body:**
```json
{
  "token": "fcm_device_token_here"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Device token unregistered successfully"
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - Device token not found
- `500` - Server error

**Use Cases:**
- User logs out from a specific device
- User revokes notification permissions
- App uninstall cleanup

---

### 3. Unregister All Device Tokens

**Endpoint:** `DELETE /app/device-token/unregister-all`

**Description:** Remove all device tokens for the authenticated user.

**Request Body:** None

**Response (200):**
```json
{
  "success": true,
  "message": "All device tokens unregistered successfully",
  "data": {
    "count": 3
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `500` - Server error

**Use Cases:**
- User logs out from all devices
- Account deletion
- Security: revoke all sessions

---

### 4. Get Device Tokens

**Endpoint:** `GET /app/device-token/list`

**Description:** Get all registered device tokens for the authenticated user (sanitized).

**Request Body:** None

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "token": "...last10chars",
      "platform": "android",
      "createdAt": "2026-01-26T10:00:00.000Z",
      "lastUsedAt": "2026-01-26T10:30:00.000Z"
    },
    {
      "id": "uuid2",
      "token": "...last10chars",
      "platform": "ios",
      "createdAt": "2026-01-25T10:00:00.000Z",
      "lastUsedAt": "2026-01-26T09:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `401` - Unauthorized
- `500` - Server error

**Notes:**
- Tokens are sanitized (only last 10 characters shown) for security
- Useful for showing user which devices have notifications enabled

---

## Database Schema

```prisma
model DeviceToken {
  id        String   @id @default(uuid())
  userId    String   // Can be student_id, teacher_id, or parent_id
  userType  EndUserRole // STUDENT | TEACHER | PARENT | ADMIN
  token     String   @unique // FCM device token
  platform  String?  // ios, android, web
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  lastUsedAt DateTime @default(now())
  
  @@unique([userId, token])
  @@index([userId])
  @@index([userType])
}
```

---

## Database Functions

The following database functions are available for your FCM Cloud Run service:

### `getDeviceTokensByUserIds(userIds, userType)`

Fetch device tokens for multiple users (useful for batch notifications).

**Example:**
```javascript
import { getDeviceTokensByUserIds } from './db/deviceToken.db.js';

// Get all tokens for specific students
const studentIds = ['student1', 'student2', 'student3'];
const tokens = await getDeviceTokensByUserIds(studentIds, 'STUDENT');

// tokens = [
//   { token: 'fcm_token_1', userId: 'student1', platform: 'android' },
//   { token: 'fcm_token_2', userId: 'student2', platform: 'ios' },
//   ...
// ]
```

### `updateDeviceTokenLastUsed(token)`

Update the last used timestamp (for analytics/cleanup).

### `deleteInactiveDeviceTokens(daysInactive)`

Remove tokens that haven't been used in X days (default: 90 days).

**Example Cron Job:**
```javascript
// Run weekly to cleanup old tokens
import { deleteInactiveDeviceTokens } from './db/deviceToken.db.js';

const result = await deleteInactiveDeviceTokens(90);
console.log(`Deleted ${result.count} inactive tokens`);
```

---

## Integration Examples

### Client-Side (React Native / Mobile App)

```javascript
// After user logs in and FCM token is obtained
async function registerDeviceForNotifications() {
  try {
    // Get FCM token from Firebase
    const fcmToken = await messaging().getToken();
    const platform = Platform.OS; // 'ios' or 'android'
    
    // Register with backend
    const response = await fetch('https://your-api.com/app/device-token/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for JWT cookie
      body: JSON.stringify({
        token: fcmToken,
        platform: platform
      })
    });
    
    const result = await response.json();
    console.log('Device registered:', result);
  } catch (error) {
    console.error('Failed to register device:', error);
  }
}

// On logout
async function unregisterDevice() {
  const fcmToken = await messaging().getToken();
  
  await fetch('https://your-api.com/app/device-token/unregister', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      token: fcmToken
    })
  });
}
```

### FCM Cloud Run Service (Node.js)

```javascript
import admin from 'firebase-admin';
import { getDeviceTokensByUserIds } from './db/deviceToken.db.js';

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

// Send notification to specific students
async function sendNotificationToStudents(studentIds, notification) {
  // Get all device tokens for these students
  const deviceTokens = await getDeviceTokensByUserIds(studentIds, 'STUDENT');
  
  if (deviceTokens.length === 0) {
    console.log('No device tokens found');
    return;
  }
  
  // Prepare FCM message
  const message = {
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: notification.data || {},
    tokens: deviceTokens.map(dt => dt.token)
  };
  
  // Send to all devices
  const response = await admin.messaging().sendEachForMulticast(message);
  
  console.log(`Successfully sent: ${response.successCount}`);
  console.log(`Failed: ${response.failureCount}`);
  
  // Handle failed tokens (invalid/expired)
  if (response.failureCount > 0) {
    const failedTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        failedTokens.push(deviceTokens[idx].token);
      }
    });
    
    // Clean up invalid tokens
    // await deleteInvalidTokens(failedTokens);
  }
  
  return response;
}

// Example: Send attendance notification
async function sendAttendanceNotification(attendanceData) {
  const studentIds = attendanceData.students.map(s => s.id);
  
  await sendNotificationToStudents(studentIds, {
    title: 'Attendance Submitted',
    body: `Your attendance for ${attendanceData.date} has been submitted`,
    data: {
      type: 'ATTENDANCE',
      sessionId: attendanceData.sessionId
    }
  });
}
```

---

## Security Considerations

1. **Token Storage**: Device tokens are stored with unique constraints to prevent duplicates
2. **User Association**: Tokens are automatically linked to authenticated user
3. **Token Sanitization**: The list endpoint only shows last 10 chars of tokens
4. **Authentication Required**: All endpoints require valid JWT authentication
5. **Cleanup**: Implement periodic cleanup of inactive tokens (90+ days)

---

## Best Practices

1. **Register Early**: Register device token immediately after user login
2. **Handle Updates**: If FCM token changes, re-register with new token
3. **Logout Cleanup**: Always unregister token on logout
4. **Multi-Device Support**: Users can have multiple tokens (multiple devices)
5. **Error Handling**: Handle registration failures gracefully (offline, network issues)
6. **Token Refresh**: Listen to FCM token refresh events and update backend
7. **Platform Tracking**: Always specify platform for better analytics

---

## Error Handling

```javascript
// Recommended error handling pattern
async function registerWithRetry(token, platform, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('/app/device-token/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, platform })
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      if (response.status === 401) {
        // Authentication failed - don't retry
        throw new Error('Authentication required');
      }
      
      // Retry on server errors
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

---

## Testing

### Using cURL

```bash
# Login first to get JWT cookie
curl -X POST https://your-api.com/app/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","password":"password123"}' \
  -c cookies.txt

# Register device token
curl -X POST https://your-api.com/app/device-token/register \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"token":"test_fcm_token_12345","platform":"android"}'

# List tokens
curl -X GET https://your-api.com/app/device-token/list \
  -b cookies.txt

# Unregister token
curl -X POST https://your-api.com/app/device-token/unregister \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"token":"test_fcm_token_12345"}'
```

---

## Future Enhancements

1. **Token Validation**: Validate FCM token format before storage
2. **Rate Limiting**: Prevent abuse of registration endpoint
3. **Analytics**: Track notification delivery rates per platform
4. **Topic Subscriptions**: Support FCM topics for broadcast notifications
5. **Priority Tokens**: Mark primary/active device for each user
6. **Notification Preferences**: Allow users to configure notification types per device

---

## Support

For issues or questions, contact the backend team or refer to the main repository documentation.
