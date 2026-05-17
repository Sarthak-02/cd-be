import {
  findOrCreateDirectConversation,
  createGroupConversation,
  getParticipant,
  getConversationById,
  listConversationsForUser,
  countUnreadMessages,
  batchCountUnreadMessages,
  listMessages,
  createChatMessage,
  markConversationRead,
  resolveParticipantDisplayNames,
  broadcastMessageToUsers,
} from "../../db/chat.db.js";
import { generateDocumentUploadSignedUrl } from "../../services/gcsSignedUrl.js";

function formatMessage(m) {
  return {
    id: m.id,
    conversation_id: m.conversationId,
    sender_user_id: m.senderUserId,
    body: m.body,
    created_at: m.createdAt,
    attachments: (m.attachments ?? []).map((a) => ({
      id: a.id,
      file_url: a.fileUrl,
      file_name: a.fileName,
      file_type: a.fileType,
      file_size: a.fileSize,
    })),
  };
}

function formatParticipants(participants) {
  return participants.map((p) => ({
    user_id: p.userId,
    user_role: p.userRole,
    last_read_at: p.lastReadAt,
    joined_at: p.joinedAt,
  }));
}

function formatConversationDetail(
  conversation,
  { unread_count, my_participant, displayNameMap, currentUserId }
) {
  const last = conversation.messages?.[0];

  let display_name;
  /** For DIRECT: the other party (for list / header UI). Omitted for GROUP. */
  let receiver = null;

  if (conversation.type === "GROUP") {
    display_name = (conversation.title && conversation.title.trim()) || "Group chat";
  } else {
    const other = conversation.participants.find((p) => p.userId !== currentUserId);
    if (other) {
      const name = displayNameMap?.get(other.userId) || other.userId;
      display_name = name;
      receiver = {
        user_id: other.userId,
        user_role: other.userRole,
        name,
      };
    } else {
      display_name = "Chat";
    }
  }

  return {
    conversation_id: conversation.id,
    type: conversation.type,
    title: conversation.title,
    display_name,
    receiver,
    campus_id: conversation.campusId,
    created_at: conversation.createdAt,
    updated_at: conversation.updatedAt,
    last_message: last ? formatMessage(last) : null,
    unread_count,
    participants: formatParticipants(conversation.participants),
    my_last_read_at: my_participant?.lastReadAt ?? null,
  };
}

export async function createConversationController(req, reply) {
  try {
    const userInfo = req.token_info;
    if (!userInfo?.userid || !userInfo?.role) {
      return reply.code(401).send({ success: false, error: "Unauthorized" });
    }

    const body = req.body;
    let conversation;

    if (body.type === "DIRECT") {
      conversation = await findOrCreateDirectConversation(
        userInfo.userid,
        userInfo.role,
        body.other_user_id
      );
    } else {
      conversation = await createGroupConversation({
        title: body.title,
        campusId: body.campus_id,
        creatorUserId: userInfo.userid,
        creatorRole: userInfo.role,
        otherUserIds: body.participant_user_ids,
      });
    }

    const me = conversation.participants.find((p) => p.userId === userInfo.userid);
    const other =
      conversation.type === "DIRECT"
        ? conversation.participants.find((p) => p.userId !== userInfo.userid)
        : null;

    const [unread_count, displayNameMap] = await Promise.all([
      countUnreadMessages(conversation.id, userInfo.userid, me?.lastReadAt),
      other
        ? resolveParticipantDisplayNames([{ userId: other.userId, userRole: other.userRole }])
        : Promise.resolve(new Map()),
    ]);

    const payload = formatConversationDetail(conversation, {
      unread_count,
      my_participant: me,
      displayNameMap,
      currentUserId: userInfo.userid,
    });

    return reply.code(201).send({
      success: true,
      data: payload,
    });
  } catch (err) {
    req.log.error(err);
    const status = err.status || 500;
    return reply.code(status).send({
      success: false,
      error: err.message || "Unable to create conversation",
    });
  }
}

export async function listConversationsController(req, reply) {
  try {
    const userInfo = req.token_info;
    if (!userInfo?.userid) {
      return reply.code(401).send({ success: false, error: "Unauthorized" });
    }

    const [rows, unreadCountMap] = await Promise.all([
      listConversationsForUser(userInfo.userid),
      batchCountUnreadMessages(userInfo.userid),
    ]);

    const directOthers = [];
    for (const { conversation } of rows) {
      if (conversation.type === "DIRECT") {
        const other = conversation.participants.find((p) => p.userId !== userInfo.userid);
        if (other) {
          directOthers.push({ userId: other.userId, userRole: other.userRole });
        }
      }
    }
    const displayNameMap = await resolveParticipantDisplayNames(directOthers);

    const data = rows.map(({ participant, conversation }) =>
      formatConversationDetail(conversation, {
        unread_count: unreadCountMap.get(conversation.id) ?? 0,
        my_participant: participant,
        displayNameMap,
        currentUserId: userInfo.userid,
      })
    );

    return reply.send({
      success: true,
      data,
      count: data.length,
    });
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({
      success: false,
      error: err.message || "Unable to list conversations",
    });
  }
}

export async function getConversationController(req, reply) {
  try {
    const userInfo = req.token_info;
    if (!userInfo?.userid) {
      return reply.code(401).send({ success: false, error: "Unauthorized" });
    }

    const { conversation_id } = req.params;
    const me = await getParticipant(conversation_id, userInfo.userid);
    if (!me) {
      return reply.code(404).send({ success: false, error: "Conversation not found" });
    }

    const conversation = await getConversationById(conversation_id);
    if (!conversation) {
      return reply.code(404).send({ success: false, error: "Conversation not found" });
    }

    const unread_count = await countUnreadMessages(
      conversation_id,
      userInfo.userid,
      me.lastReadAt
    );

    const other =
      conversation.type === "DIRECT"
        ? conversation.participants.find((p) => p.userId !== userInfo.userid)
        : null;
    const displayNameMap = other
      ? await resolveParticipantDisplayNames([{ userId: other.userId, userRole: other.userRole }])
      : new Map();

    return reply.send({
      success: true,
      data: formatConversationDetail(conversation, {
        unread_count,
        my_participant: me,
        displayNameMap,
        currentUserId: userInfo.userid,
      }),
    });
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({
      success: false,
      error: err.message || "Unable to load conversation",
    });
  }
}

export async function listMessagesController(req, reply) {
  try {
    const userInfo = req.token_info;
    if (!userInfo?.userid) {
      return reply.code(401).send({ success: false, error: "Unauthorized" });
    }

    const { conversation_id } = req.params;
    const me = await getParticipant(conversation_id, userInfo.userid);
    if (!me) {
      return reply.code(404).send({ success: false, error: "Conversation not found" });
    }

    const { after, before, limit } = req.query;
    if (after && Number.isNaN(new Date(after).getTime())) {
      return reply.code(400).send({ success: false, error: "Invalid after datetime" });
    }
    if (before && Number.isNaN(new Date(before).getTime())) {
      return reply.code(400).send({ success: false, error: "Invalid before datetime" });
    }

    const messages = await listMessages(conversation_id, { after, before, limit });

    return reply.send({
      success: true,
      data: messages.map(formatMessage),
      count: messages.length,
    });
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({
      success: false,
      error: err.message || "Unable to load messages",
    });
  }
}

export async function sendMessageController(req, reply) {
  try {
    const userInfo = req.token_info;
    if (!userInfo?.userid) {
      return reply.code(401).send({ success: false, error: "Unauthorized" });
    }

    const { conversation_id } = req.params;
    const me = await getParticipant(conversation_id, userInfo.userid);
    if (!me) {
      return reply.code(404).send({ success: false, error: "Conversation not found" });
    }

    const msg = await createChatMessage(conversation_id, userInfo.userid, req.body.body, req.body.attachments);

    return reply.code(201).send({
      success: true,
      data: formatMessage(msg),
    });
  } catch (err) {
    req.log.error(err);
    const status = err.status || 500;
    return reply.code(status).send({
      success: false,
      error: err.message || "Unable to send message",
    });
  }
}

export async function broadcastMessageController(req, reply) {
  try {
    const userInfo = req.token_info;
    if (!userInfo?.userid || !userInfo?.role) {
      return reply.code(401).send({ success: false, error: "Unauthorized" });
    }

    const { recipient_user_ids, body, attachments } = req.body;

    const { succeeded, failed } = await broadcastMessageToUsers(
      userInfo.userid,
      userInfo.role,
      recipient_user_ids,
      body,
      attachments
    );

    return reply.code(207).send({
      success: true,
      data: {
        total: recipient_user_ids.length,
        sent: succeeded.length,
        failed: failed.length,
        succeeded,
        failed,
      },
    });
  } catch (err) {
    req.log.error(err);
    const status = err.status || 500;
    return reply.code(status).send({
      success: false,
      error: err.message || "Unable to broadcast message",
    });
  }
}

export async function generateChatAttachmentUploadUrlController(req, reply) {
  try {
    const userInfo = req.token_info;
    if (!userInfo?.userid) {
      return reply.code(401).send({ success: false, error: "Unauthorized" });
    }

    const { file_name, mime_type, campus_id } = req.body;

    const result = await generateDocumentUploadSignedUrl({
      entity: "chat_message",
      entityId: userInfo.userid,
      fileName: file_name,
      mimeType: mime_type,
      campus_id,
    });

    return reply.code(200).send({
      success: true,
      data: {
        upload_url: result.uploadUrl,
        public_url: result.publicUrl,
        object_path: result.objectPath,
      },
    });
  } catch (err) {
    req.log.error(err);
    const status = err.status || 500;
    return reply.code(status).send({
      success: false,
      error: err.message || "Unable to generate upload URL",
    });
  }
}

export async function markConversationReadController(req, reply) {
  try {
    const userInfo = req.token_info;
    if (!userInfo?.userid) {
      return reply.code(401).send({ success: false, error: "Unauthorized" });
    }

    const { conversation_id } = req.params;
    const me = await getParticipant(conversation_id, userInfo.userid);
    if (!me) {
      return reply.code(404).send({ success: false, error: "Conversation not found" });
    }

    const readAtRaw = req.body?.read_at;
    const readAt = readAtRaw ? new Date(readAtRaw) : new Date();
    if (Number.isNaN(readAt.getTime())) {
      return reply.code(400).send({ success: false, error: "Invalid read_at" });
    }

    const updated = await markConversationRead(conversation_id, userInfo.userid, readAt);

    return reply.send({
      success: true,
      data: {
        conversation_id,
        user_id: updated.userId,
        last_read_at: updated.lastReadAt,
      },
    });
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({
      success: false,
      error: err.message || "Unable to update read state",
    });
  }
}
