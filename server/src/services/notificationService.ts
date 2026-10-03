import webpush from 'web-push';
import { config } from '../config.js';
import { db } from '../db/index.js';
import { PushSubscriptionRecord } from '../types.js';

let isWebPushConfigured = false;

if (config.vapidPublicKey && config.vapidPrivateKey) {
  try {
    webpush.setVapidDetails(
      config.vapidSubject,
      config.vapidPublicKey,
      config.vapidPrivateKey
    );
    isWebPushConfigured = true;
  } catch (err) {
    console.warn('⚠️ Web Push initialization warning:', err);
  }
}

export function getVapidPublicKey(): string {
  return config.vapidPublicKey;
}

export async function sendPushNotification(payload: { title: string; body: string; url?: string }) {
  if (!isWebPushConfigured) {
    return { success: false, reason: 'VAPID keys not configured' };
  }

  const subscriptions = db.prepare('SELECT * FROM push_subscriptions').all() as PushSubscriptionRecord[];
  const dataString = JSON.stringify(payload);

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        const keys = JSON.parse(sub.keys_json);
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys
          },
          dataString
        );
      } catch (err: any) {
        // If subscription is gone or expired (410 Gone or 404 Not Found), remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(sub.id);
        }
        throw err;
      }
    })
  );

  return { success: true, total: subscriptions.length, results };
}
