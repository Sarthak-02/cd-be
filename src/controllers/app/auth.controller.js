import bcrypt from "bcrypt";
import { getEndUserByUsername, createEndUser, incrementTokenVersion } from "../../db/enduser.db.js";
import { loginEndUser } from "../../services/app/auth.service.js";
import { clearEndUserCache } from "../../utils/cache/enduser.cache.js";

export async function signupController(req, reply) {
  const { username, userid, password, role } = req.body;

  // Check if username already exists
  const existingUser = await getEndUserByUsername(username);
  if (existingUser) {
    return reply.code(409).send({ error: "Username already exists" });
  }

  // Hash password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const newUser = await createEndUser({
    username,
    userid,
    passwordHash,
    role,
    authProvider: "LOCAL",
    isActive: true
  });

  if (!newUser) {
    return reply.code(500).send({ error: "Failed to create user" });
  }

  // Generate token
  const token = req.server.jwt.sign(
    { id: newUser.id, username: newUser.username, role: newUser.role },
    { expiresIn: "1d" }
  );

  reply.setCookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 86400
  });

  // Remove sensitive data
  delete newUser.passwordHash;

  reply.code(201).send({
    success: true,
    message: "User created successfully",
    data: newUser
  });
}

export async function loginController(req, reply) {
  try {
    const { username, password } = req.body;
    const { token, user } = await loginEndUser({ username, password });

    const signedToken = req.server.jwt.sign(token, { expiresIn: "1d" });

    reply.setCookie("token", signedToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 86400
    });

    reply.send({
      success: true,
      message: "Logged in",
      data: user
    });
  } catch (err) {
    const status = err?.status || 500;
    const message = err?.message || "Unable to login";
    reply.code(status).send({ error: message });
  }
}

export async function logoutController(req, reply) {
  try {
    const userInfo = req.token_info;

    if (userInfo?.userid) {
      await incrementTokenVersion(userInfo.userid);
      await clearEndUserCache(userInfo.userid);
    }

    // Clear the cookie
    reply.clearCookie("token", {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "none"
    });

    reply.send({
      success: true,
      message: "Logged out successfully"
    });
  } catch (err) {
    req.log.error(err);
    reply.code(500).send({
      error: "Failed to logout"
    });
  }
}

export async function changePasswordController(req, reply) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userInfo = req.token_info;

    if (!userInfo || !userInfo.userid) {
      return reply.code(401).send({ 
        error: "Unauthorized: User information not found" 
      });
    }

    const user = await getEndUserByUsername(userInfo.username);
    
    if (!user) {
      return reply.code(404).send({ 
        error: "User not found" 
      });
    }

    if (!user.passwordHash) {
      return reply.code(400).send({ 
        error: "Password change not available for this account" 
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    
    if (!isCurrentPasswordValid) {
      return reply.code(401).send({ 
        error: "Current password is incorrect" 
      });
    }

    if (currentPassword === newPassword) {
      return reply.code(400).send({ 
        error: "New password must be different from current password" 
      });
    }

    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    const { updateEndUserByUserid } = await import("../../db/enduser.db.js");
    const updatedUser = await updateEndUserByUserid(userInfo.userid, {
      passwordHash: newPasswordHash
    });

    if (!updatedUser) {
      return reply.code(500).send({ 
        error: "Failed to update password" 
      });
    }

    await clearEndUserCache(userInfo.userid);

    reply.send({
      success: true,
      message: "Password changed successfully"
    });
  } catch (err) {
    req.log.error(err);
    reply.code(500).send({
      error: "Failed to change password",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
