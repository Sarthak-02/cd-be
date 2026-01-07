import { PubSub } from "@google-cloud/pubsub";

const pubsub = new PubSub();
const TOPIC = "notifications";

export async function publishNotifications(notifications,) {
  // notifications = array of { id, channel, parentId, payload }
  const topic = pubsub.topic(TOPIC);

  const results = [];
  for (const n of notifications) {
    const messageBuffer = Buffer.from(JSON.stringify({
      notificationId: n.id,
      channel: n.channel,
    }));

    const messageId = await topic.publishMessage({
      data: messageBuffer,
      attributes: {
        notificationId: n.id,
        channel: n.channel,
      },
    });

    results.push({ id: n.id, messageId });
  }
  return results;
}
