import bcrypt from "bcrypt";
import { getEndUserByUsername, createEndUser } from "../../db/enduser.db.js";
import { loginEndUser } from "../../services/app/auth.service.js";

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
