import { prisma } from "../prisma/prisma.js";

/**
 * Register a new device token or update existing one
 */
export async function upsertDeviceToken(data) {
  return prisma.deviceToken.upsert({
    where: {
      userId_token: {
        userId: data.userId,
        token: data.token
      }
    },
    update: {
      platform: data.platform,
      lastUsedAt: new Date(),
      updatedAt: new Date()
    },
    create: {
      userId: data.userId,
      userType: data.userType,
      token: data.token,
      platform: data.platform,
      lastUsedAt: new Date()
    }
  });
}

/**
 * Remove a specific device token
 */
export async function deleteDeviceToken(userId, token) {
  return prisma.deviceToken.delete({
    where: {
      userId_token: {
        userId,
        token
      }
    }
  });
}

/**
 * Remove all device tokens for a user
 */
export async function deleteAllUserDeviceTokens(userId) {
  return prisma.deviceToken.deleteMany({
    where: {
      userId
    }
  });
}

/**
 * Get all device tokens for a user
 */
export async function getUserDeviceTokens(userId) {
  return prisma.deviceToken.findMany({
    where: {
      userId
    },
    orderBy: {
      lastUsedAt: 'desc'
    }
  });
}

/**
 * Get device tokens by user type and user IDs
 * Useful for sending notifications to multiple users
 */
export async function getDeviceTokensByUserIds(userIds, userType) {
  return prisma.deviceToken.findMany({
    where: {
      userId: { in: userIds },
      userType
    },
    select: {
      token: true,
      userId: true,
      platform: true
    }
  });
}

/**
 * Update last used timestamp for a device token
 */
export async function updateDeviceTokenLastUsed(token) {
  return prisma.deviceToken.updateMany({
    where: { token },
    data: { lastUsedAt: new Date() }
  });
}

/**
 * Remove inactive device tokens (not used in X days)
 */
export async function deleteInactiveDeviceTokens(daysInactive = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
  
  return prisma.deviceToken.deleteMany({
    where: {
      lastUsedAt: {
        lt: cutoffDate
      }
    }
  });
}
