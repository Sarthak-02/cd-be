import bcrypt from "bcrypt";
import { getEndUserByUsername, createEndUser } from "../../db/enduser.db.js";

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
  const { username, password } = req.body;

  const user = await getEndUserByUsername(username);

  if (!user) {
    return reply.code(401).send({ error: "Invalid credentials" });
  }

  // Check if user is active
  if (!user.isActive) {
    return reply.code(403).send({ error: "Account is inactive" });
  }

  // Check if user has a password (LOCAL auth)
  if (!user.passwordHash) {
    return reply.code(401).send({ error: "Invalid credentials" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return reply.code(401).send({ error: "Invalid credentials" });
  }

  const token = req.server.jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    { expiresIn: "1d" }
  );

  reply.setCookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 86400
  });

  delete user.passwordHash;

  reply.send({
    success: true,
    message: "Logged in",
    data: user
  });
}
