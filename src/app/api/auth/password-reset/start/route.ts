import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetChallenge } from "@/lib/serverDb";
import { sendTelegramMessage } from "@/lib/telegram";

function createCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: NextRequest) {
  const { username } = (await request.json()) as { username?: string };
  const cleanUsername = username?.trim();

  if (!cleanUsername) {
    return NextResponse.json({ message: "Benutzername fehlt." }, { status: 400 });
  }

  const code = createCode();
  const reset = await createPasswordResetChallenge(cleanUsername, code);

  if (reset) {
    await sendTelegramMessage(reset.contact, `Finanzmanager password reset code: ${code}`);
  }

  return NextResponse.json({
    challengeId: reset?.challengeId ?? null,
    message: "Wenn ein Telegram-Kontakt existiert, wurde ein Code gesendet."
  });
}
