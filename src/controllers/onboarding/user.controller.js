import {
  createUser,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
} from "../../db/user.db.js";
import bcrypt from "bcrypt";

function stripPassword(user) {
  if (!user) return user;
  const { password: _p, ...rest } = user;
  return rest;
}

function sendPrismaError(reply, err, req) {
  req.log?.error(err);
  if (err.code === "P2002") {
    return reply.code(409).send({
      success: false,
      message: "User already exists or conflicts with an existing record",
    });
  }
  if (err.code === "P2003") {
    return reply.code(400).send({
      success: false,
      message: "Invalid reference",
    });
  }
  if (err.code === "P2025") {
    return reply.code(404).send({
      success: false,
      message: "User not found",
    });
  }
  return reply.code(500).send({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  });
}

export async function user_post(req, reply) {
  try {
    const data = { ...req.body };
    const passwordHash = await bcrypt.hash(data.password, 10);
    data.password = passwordHash;
    const user = await createUser(data);
    return reply.code(201).send({
      success: true,
      message: "User created successfully",
      data: stripPassword(user),
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function user_put(req, reply) {
  try {
    const data = { ...req.body };

    if (
      Object.prototype.hasOwnProperty.call(data, "password") &&
      typeof data.password === "string" &&
      data.password.trim() !== ""
    ) {
      data.password = await bcrypt.hash(data.password, 10);
    } else {
      delete data.password;
    }

    const user = await updateUser(data);
    return reply.send({
      success: true,
      message: "User updated successfully",
      data: stripPassword(user),
    });
  } catch (err) {
    if (err.code === "NO_FIELDS_TO_UPDATE") {
      return reply.code(400).send({
        success: false,
        message: "Provide at least one field to update besides userid",
      });
    }
    return sendPrismaError(reply, err, req);
  }
}

export async function user_get(req, reply) {
  try {
    const { userid } = req.query;
    const user = await getUser(userid, { password: true });
    if (!user) {
      return reply.code(404).send({
        success: false,
        message: "User not found",
        data: null,
      });
    }
    return reply.send({
      success: true,
      message: "Fetched user details",
      data: user,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function user_all_get(req, reply) {
  try {
    const users = await getAllUsers();
    return reply.send({
      success: true,
      message: "Fetched all users",
      data: users,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}

export async function user_delete(req, reply) {
  try {
    const { userid } = req.query;
    await deleteUser(userid);
    return reply.send({
      success: true,
      message: "User deleted successfully",
      data: null,
    });
  } catch (err) {
    return sendPrismaError(reply, err, req);
  }
}
