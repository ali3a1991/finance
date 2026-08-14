import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import {
  deletePushSubscription,
  getVapidPublicKey,
  isPushConfigured,
  savePushSubscription,
  type BrowserPushSubscription
} from "@/lib/pushNotifications";

function isValidSubscription(value: unknown): value is BrowserPushSubscription {
  if (!value || typeof value !== "object") return false;
  const subscription = value as Partial<BrowserPushSubscription>;
  return Boolean(
    typeof subscription.endpoint === "string" &&
    subscription.endpoint.startsWith("https://") &&
    subscription.keys &&
    typeof subscription.keys.auth === "string" &&
    typeof subscription.keys.p256dh === "string"
  );
}

export async function GET(request: NextRequest) {
  const auth = requireApiAuth(request);
  if (auth.error) return auth.error;

  const publicKey = getVapidPublicKey();
  return NextResponse.json({ configured: isPushConfigured(), publicKey });
}

export async function POST(request: NextRequest) {
  const auth = requireApiAuth(request);
  if (auth.error) return auth.error;

  const publicKey = getVapidPublicKey();
  if (!publicKey || !isPushConfigured()) {
    return NextResponse.json({ message: "Push-Benachrichtigungen sind auf dem Server noch nicht konfiguriert." }, { status: 503 });
  }

  const subscription = (await request.json()) as unknown;
  if (!isValidSubscription(subscription)) {
    return NextResponse.json({ message: "Ungültige Push-Subscription." }, { status: 400 });
  }

  await savePushSubscription(auth.payload.ownerId, auth.payload.sub, subscription);
  return NextResponse.json({ enabled: true });
}

export async function DELETE(request: NextRequest) {
  const auth = requireApiAuth(request);
  if (auth.error) return auth.error;

  const body = (await request.json()) as { endpoint?: unknown };
  if (typeof body.endpoint !== "string") {
    return NextResponse.json({ message: "Push-Endpunkt fehlt." }, { status: 400 });
  }

  await deletePushSubscription(auth.payload.ownerId, body.endpoint);
  return NextResponse.json({ enabled: false });
}
