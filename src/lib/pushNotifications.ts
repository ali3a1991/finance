import { createECDH, createHmac, randomUUID } from "crypto";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

export type BrowserPushSubscription = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    auth: string;
    p256dh: string;
  };
};

type StoredPushSubscription = {
  auth: string;
  endpoint: string;
  id: string;
  p256dh: string;
};

let tableReady: Promise<void> | null = null;

function ensurePushSubscriptionTable() {
  if (!tableReady) {
    tableReady = prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PushSubscription" (
        "id" TEXT PRIMARY KEY,
        "ownerId" TEXT NOT NULL,
        "username" TEXT NOT NULL,
        "endpoint" TEXT NOT NULL UNIQUE,
        "p256dh" TEXT NOT NULL,
        "auth" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).then(async () => {
      await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "PushSubscription_ownerId_idx" ON "PushSubscription"("ownerId")');
    });
  }

  return tableReady;
}

export function getVapidPublicKey() {
  return getVapidKeys()?.publicKey ?? null;
}

function getVapidKeys() {
  const configuredPublicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const configuredPrivateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (configuredPublicKey && configuredPrivateKey) {
    return { privateKey: configuredPrivateKey, publicKey: configuredPublicKey };
  }
  if (configuredPublicKey || configuredPrivateKey) return null;

  const secret = process.env.AUTH_SECRET || "dev-fynest-secret-change-me";
  for (let counter = 0; counter < 100; counter += 1) {
    const privateKey = createHmac("sha256", secret).update(`fynest-web-push-v1:${counter}`).digest();
    try {
      const ecdh = createECDH("prime256v1");
      ecdh.setPrivateKey(privateKey);
      return {
        privateKey: privateKey.toString("base64url"),
        publicKey: ecdh.getPublicKey().toString("base64url")
      };
    } catch {
      // Try the next deterministic candidate if this scalar is outside the curve range.
    }
  }
  return null;
}

export function isPushConfigured() {
  return Boolean(getVapidKeys());
}

function configureWebPush() {
  const keys = getVapidKeys();
  if (!keys) return false;

  const configuredSubject = process.env.VAPID_SUBJECT?.trim();
  const appUrl = process.env.APP_URL?.trim();
  const subject = configuredSubject || (appUrl?.startsWith("https://") ? appUrl : "mailto:admin@fynest.app");
  webpush.setVapidDetails(subject, keys.publicKey, keys.privateKey);
  return true;
}

export async function savePushSubscription(ownerId: string, username: string, subscription: BrowserPushSubscription) {
  await ensurePushSubscriptionTable();
  await prisma.$executeRaw`
    INSERT INTO "PushSubscription" ("id", "ownerId", "username", "endpoint", "p256dh", "auth", "createdAt", "updatedAt")
    VALUES (${randomUUID()}, ${ownerId}, ${username}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("endpoint") DO UPDATE SET
      "ownerId" = EXCLUDED."ownerId",
      "username" = EXCLUDED."username",
      "p256dh" = EXCLUDED."p256dh",
      "auth" = EXCLUDED."auth",
      "updatedAt" = CURRENT_TIMESTAMP
  `;
}

export async function deletePushSubscription(ownerId: string, endpoint: string) {
  await ensurePushSubscriptionTable();
  await prisma.$executeRaw`DELETE FROM "PushSubscription" WHERE "ownerId" = ${ownerId} AND "endpoint" = ${endpoint}`;
}

async function deleteExpiredSubscription(id: string) {
  await prisma.$executeRaw`DELETE FROM "PushSubscription" WHERE "id" = ${id}`;
}

export async function notifyShoppingItemCreated({
  itemName,
  ownerId,
  username
}: {
  itemName: string;
  ownerId: string;
  username: string;
}) {
  if (!configureWebPush()) return;
  await ensurePushSubscriptionTable();

  const subscriptions = await prisma.$queryRaw<StoredPushSubscription[]>`
    SELECT "id", "endpoint", "p256dh", "auth"
    FROM "PushSubscription"
    WHERE "ownerId" = ${ownerId} AND "username" <> ${username}
  `;
  const payload = JSON.stringify({
    body: `${username} hat „${itemName}“ zur Einkaufsliste hinzugefügt.`,
    tag: "shopping-list-update",
    title: "FyNest · Einkaufsliste",
    url: "/shopping-list"
  });

  await Promise.allSettled(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: { auth: subscription.auth, p256dh: subscription.p256dh }
      }, payload, { TTL: 60 * 60, timeout: 5_000 });
    } catch (error) {
      const statusCode = typeof error === "object" && error && "statusCode" in error
        ? Number(error.statusCode)
        : 0;
      if (statusCode === 404 || statusCode === 410) {
        await deleteExpiredSubscription(subscription.id);
        return;
      }
      console.error("Push notification failed", error);
    }
  }));
}
