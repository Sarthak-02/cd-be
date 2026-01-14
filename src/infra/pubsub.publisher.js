import { PubSub } from "@google-cloud/pubsub";
import dotenv from 'dotenv'

dotenv.config()

const pubsub = new PubSub({
  projectId: process.env.GOOGLE_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
});

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
