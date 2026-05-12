import { prisma } from "../prisma/prisma.js";

function joinNameParts(parts) {
  return parts.filter(Boolean).join(" ").trim() || null;
}

function teacherFullName(t) {
  return joinNameParts([t.teacher_first_name, t.teacher_middle_name, t.teacher_last_name]);
}

function studentFullName(s) {
  return joinNameParts([s.student_first_name, s.student_middle_name, s.student_last_name]);
}

/**
 * Batch-resolve human-readable names for chat participants (EndUser.userid + role).
 * Returns a Map userId -> display string.
 */
export async function resolveParticipantDisplayNames(participantRefs) {
  const map = new Map();
  if (!participantRefs?.length) return map;

  const seen = new Set();
  const unique = [];
  for (const ref of participantRefs) {
    if (!ref?.userId || seen.has(ref.userId)) continue;
    seen.add(ref.userId);
    unique.push({ userId: ref.userId, userRole: ref.userRole });
  }

  const teacherIds = [];
  const studentIds = [];
  const parentIds = [];
  const endUserIds = [];

  for (const { userId, userRole } of unique) {
    switch (userRole) {
      case "TEACHER":
        teacherIds.push(userId);
        break;
      case "STUDENT":
        studentIds.push(userId);
        break;
      case "PARENT":
        parentIds.push(userId);
        break;
      default:
        endUserIds.push(userId);
        break;
    }
  }

  const [teachers, students, parents, adminsAndFallback] = await Promise.all([
    teacherIds.length
      ? prisma.teacher.findMany({
          where: { teacher_id: { in: teacherIds } },
          select: {
            teacher_id: true,
            teacher_first_name: true,
            teacher_middle_name: true,
            teacher_last_name: true,
          },
        })
      : [],
    studentIds.length
      ? prisma.student.findMany({
          where: { student_id: { in: studentIds } },
          select: {
            student_id: true,
            student_first_name: true,
            student_middle_name: true,
            student_last_name: true,
          },
        })
      : [],
    parentIds.length
      ? prisma.parent.findMany({
          where: { parent_id: { in: parentIds } },
          select: { parent_id: true, name: true },
        })
      : [],
    endUserIds.length
      ? prisma.endUser.findMany({
          where: { userid: { in: endUserIds } },
          select: { userid: true, username: true },
        })
      : [],
  ]);

  for (const t of teachers) {
    map.set(t.teacher_id, teacherFullName(t) || t.teacher_id);
  }
  for (const s of students) {
    map.set(s.student_id, studentFullName(s) || s.student_id);
  }
  for (const p of parents) {
    map.set(p.parent_id, (p.name && p.name.trim()) || p.parent_id);
  }
  for (const u of adminsAndFallback) {
    map.set(u.userid, (u.username && u.username.trim()) || u.userid);
  }

  return map;
}

function directKeyFor(userIdA, userIdB) {
  return [userIdA, userIdB].sort((a, b) => a.localeCompare(b)).join(":");
}

export async function getEndUsersByUserids(userids) {
  if (!userids?.length) return [];
  return prisma.endUser.findMany({
    where: { userid: { in: [...new Set(userids)] }, isActive: true },
    select: { userid: true, role: true },
  });
}

export async function findDirectConversationByKey(key) {
  return prisma.chatConversation.findUnique({
    where: { directKey: key },
    include: {
      participants: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

/**
 * Find or create a DIRECT conversation between two users.
 */
export async function findOrCreateDirectConversation(currentUserId, currentRole, otherUserId) {
  if (currentUserId === otherUserId) {
    throw Object.assign(new Error("Cannot start a direct chat with yourself"), { status: 400 });
  }

  const others = await getEndUsersByUserids([otherUserId]);
  const other = others[0];
  if (!other) {
    throw Object.assign(new Error("Other user not found"), { status: 404 });
  }

  const key = directKeyFor(currentUserId, otherUserId);
  const existing = await findDirectConversationByKey(key);
  if (existing) return existing;

  return prisma.$transaction(async (tx) => {
    const dup = await tx.chatConversation.findUnique({ where: { directKey: key } });
    if (dup) {
      return tx.chatConversation.findUnique({
        where: { id: dup.id },
        include: {
          participants: true,
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      });
    }

    const conv = await tx.chatConversation.create({
      data: {
        type: "DIRECT",
        directKey: key,
        participants: {
          create: [
            { userId: currentUserId, userRole: currentRole },
            { userId: other.userid, userRole: other.role },
          ],
        },
      },
      include: {
        participants: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    return conv;
  });
}

/**
 * Create a GROUP conversation. `otherUserIds` must not include `creatorUserId`.
 */
export async function createGroupConversation({
  title,
  campusId,
  creatorUserId,
  creatorRole,
  otherUserIds,
}) {
  const uniqueOthers = [...new Set(otherUserIds || [])].filter((id) => id && id !== creatorUserId);
  if (!title?.trim()) {
    throw Object.assign(new Error("title is required for a group chat"), { status: 400 });
  }
  if (uniqueOthers.length === 0) {
    throw Object.assign(new Error("At least one other participant is required"), { status: 400 });
  }

  const allIds = [creatorUserId, ...uniqueOthers];
  const endUsers = await getEndUsersByUserids(allIds);
  if (endUsers.length !== allIds.length) {
    throw Object.assign(new Error("One or more participants are not valid users"), { status: 404 });
  }

  const roleByUserid = new Map(endUsers.map((u) => [u.userid, u.role]));

  return prisma.chatConversation.create({
    data: {
      type: "GROUP",
      title: title.trim(),
      campusId: campusId || null,
      participants: {
        create: allIds.map((userId) => ({
          userId,
          userRole: roleByUserid.get(userId),
        })),
      },
    },
    include: {
      participants: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function getParticipant(conversationId, userId) {
  return prisma.chatParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
  });
}

export async function getConversationById(conversationId) {
  return prisma.chatConversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function listConversationsForUser(userId) {
  const rows = await prisma.chatParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          participants: true,
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { conversation: { updatedAt: "desc" } },
  });

  return rows.map((row) => ({
    participant: row,
    conversation: row.conversation,
  }));
}

export async function countUnreadMessages(conversationId, readerUserId, lastReadAt) {
  const since = lastReadAt ?? new Date(0);
  return prisma.chatMessage.count({
    where: {
      conversationId,
      senderUserId: { not: readerUserId },
      createdAt: { gt: since },
    },
  });
}

export async function batchCountUnreadMessages(userId) {
  const rows = await prisma.$queryRaw`
    SELECT cp."conversationId", COUNT(m.id)::int AS unread_count
    FROM "ChatParticipant" cp
    LEFT JOIN "ChatMessage" m
      ON m."conversationId" = cp."conversationId"
      AND m."senderUserId" != ${userId}
      AND m."createdAt" > COALESCE(cp."lastReadAt", '1970-01-01 00:00:00+00'::timestamptz)
    WHERE cp."userId" = ${userId}
    GROUP BY cp."conversationId"
  `;
  return new Map(rows.map(r => [r.conversationId, Number(r.unread_count)]));
}

export async function listMessages(conversationId, { after, before, limit = 50 }) {
  const take = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const where = { conversationId };

  if (after && before) {
    where.createdAt = { gt: new Date(after), lt: new Date(before) };
  } else if (after) {
    where.createdAt = { gt: new Date(after) };
  } else if (before) {
    where.createdAt = { lt: new Date(before) };
  }

  const useAsc = Boolean(after);

  const messages = await prisma.chatMessage.findMany({
    where,
    orderBy: { createdAt: useAsc ? "asc" : "desc" },
    take,
    include: { attachments: true },
  });

  if (!useAsc) {
    messages.reverse();
  }
  return messages;
}

export async function createChatMessage(conversationId, senderUserId, body, attachments = []) {
  const text = typeof body === "string" ? body.trim() : "";
  if (!text && (!attachments || attachments.length === 0)) {
    throw Object.assign(new Error("body or at least one attachment is required"), { status: 400 });
  }

  return prisma.$transaction(async (tx) => {
    const msg = await tx.chatMessage.create({
      data: {
        conversationId,
        senderUserId,
        body: text,
        attachments: attachments?.length
          ? {
              create: attachments.map((a) => ({
                fileUrl: a.file_url,
                fileName: a.file_name,
                fileType: a.file_type,
                fileSize: a.file_size,
              })),
            }
          : undefined,
      },
      include: { attachments: true },
    });
    await tx.chatConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    return msg;
  });
}

export async function markConversationRead(conversationId, userId, readAt = new Date()) {
  return prisma.chatParticipant.update({
    where: {
      conversationId_userId: { conversationId, userId },
    },
    data: { lastReadAt: readAt },
  });
}

/**
 * Broadcast a message from one sender to multiple recipients.
 * Finds or creates a DIRECT conversation for each recipient, then sends the message.
 * Returns arrays of succeeded and failed results.
 */
export async function broadcastMessageToUsers(senderUserId, senderRole, recipientUserIds, body, attachments = []) {
  const unique = [...new Set(recipientUserIds.filter((id) => id && id !== senderUserId))];

  const results = await Promise.allSettled(
    unique.map(async (recipientId) => {
      const conversation = await findOrCreateDirectConversation(senderUserId, senderRole, recipientId);
      const msg = await createChatMessage(conversation.id, senderUserId, body, attachments);
      return { recipient_user_id: recipientId, conversation_id: conversation.id, message_id: msg.id };
    })
  );

  const succeeded = [];
  const failed = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled") {
      succeeded.push(r.value);
    } else {
      failed.push({ recipient_user_id: unique[i], error: r.reason?.message || "Unknown error" });
    }
  }
  return { succeeded, failed };
}

/**
 * Unread counts per linked account (e.g. student + parents). Each userId is an EndUser.userid.
 */
export async function getMessagingSummaryForUserIds(userIds) {
  const unique = [...new Set((userIds || []).filter(Boolean))];
  if (!unique.length) {
    return { totalUnreadMessages: 0, profiles: [] };
  }

  const profiles = await Promise.all(
    unique.map(async (userId) => {
      const rows = await listConversationsForUser(userId);
      let unreadMessages = 0;
      for (const { conversation, participant } of rows) {
        unreadMessages += await countUnreadMessages(
          conversation.id,
          userId,
          participant.lastReadAt
        );
      }
      return {
        userId,
        unreadMessages,
        conversationCount: rows.length,
      };
    })
  );

  const totalUnreadMessages = profiles.reduce((sum, p) => sum + p.unreadMessages, 0);
  return { totalUnreadMessages, profiles };
}
