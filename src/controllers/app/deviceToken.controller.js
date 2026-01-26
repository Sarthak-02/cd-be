import {
  upsertDeviceToken,
  deleteDeviceToken,
  deleteAllUserDeviceTokens,
  getUserDeviceTokens
} from "../../db/deviceToken.db.js";

/**
 * Register a device token for push notifications
 */
export async function registerDeviceTokenController(req, reply) {
  try {
    const { token, platform } = req.body;
    const userInfo = req.token_info; // From auth hook

    // Validate that user info exists
    if (!userInfo || !userInfo.id || !userInfo.role) {
      return reply.code(401).send({ 
        error: "Unauthorized: User information not found" 
      });
    }

    // Create or update the device token
    const deviceToken = await upsertDeviceToken({
      userId: userInfo.id,
      userType: userInfo.role,
      token,
      platform
    });

    reply.code(200).send({
      success: true,
      message: "Device token registered successfully",
      data: deviceToken
    });
  } catch (err) {
    req.log.error(err);
    
    // Handle unique constraint errors
    if (err.code === 'P2002') {
      return reply.code(409).send({ 
        error: "Device token already registered" 
      });
    }
    
    reply.code(500).send({ 
      error: "Failed to register device token"
    });
  }
}

/**
 * Unregister a specific device token
 */
export async function unregisterDeviceTokenController(req, reply) {
  try {
    const { token } = req.body;
    const userInfo = req.token_info; // From auth hook

    if (!userInfo || !userInfo.id) {
      return reply.code(401).send({ 
        error: "Unauthorized: User information not found" 
      });
    }

    await deleteDeviceToken(userInfo.id, token);

    reply.code(200).send({
      success: true,
      message: "Device token unregistered successfully"
    });
  } catch (err) {
    req.log.error(err);
    
    // Handle case where token doesn't exist
    if (err.code === 'P2025') {
      return reply.code(404).send({ 
        error: "Device token not found" 
      });
    }
    
    reply.code(500).send({ 
      error: "Failed to unregister device token"
    });
  }
}

/**
 * Unregister all device tokens for the authenticated user
 */
export async function unregisterAllDeviceTokensController(req, reply) {
  try {
    const userInfo = req.token_info; // From auth hook

    if (!userInfo || !userInfo.id) {
      return reply.code(401).send({ 
        error: "Unauthorized: User information not found" 
      });
    }

    const result = await deleteAllUserDeviceTokens(userInfo.id);

    reply.code(200).send({
      success: true,
      message: "All device tokens unregistered successfully",
      data: {
        count: result.count
      }
    });
  } catch (err) {
    req.log.error(err);
    reply.code(500).send({ 
      error: "Failed to unregister device tokens"
    });
  }
}

/**
 * Get all device tokens for the authenticated user
 */
export async function getDeviceTokensController(req, reply) {
  try {
    const userInfo = req.token_info; // From auth hook

    if (!userInfo || !userInfo.id) {
      return reply.code(401).send({ 
        error: "Unauthorized: User information not found" 
      });
    }

    const tokens = await getUserDeviceTokens(userInfo.id);

    // Remove sensitive full token, show only last 10 chars for reference
    const sanitizedTokens = tokens.map(t => ({
      id: t.id,
      token: `...${t.token.slice(-10)}`,
      platform: t.platform,
      createdAt: t.createdAt,
      lastUsedAt: t.lastUsedAt
    }));

    reply.code(200).send({
      success: true,
      data: sanitizedTokens
    });
  } catch (err) {
    req.log.error(err);
    reply.code(500).send({ 
      error: "Failed to fetch device tokens"
    });
  }
}
