import { NextRequest, NextResponse } from "next/server";
import { activateRegistrationChallenge } from "@/lib/serverDb";
import { sendTelegramCode, sendTelegramMessage } from "@/lib/telegram";

type TelegramUpdate = {
  message?: {
    chat?: {
      id?: number | string;
    };
    text?: string;
  };
};

function getStartPayload(text?: string) {
  const match = text?.trim().match(/^\/start(?:@\w+)?\s+(reg_[A-Za-z0-9]+)$/);
  return match?.[1] ?? null;
}

export async function POST(request: NextRequest) {
  const update = (await request.json()) as TelegramUpdate;
  const chatId = update.message?.chat?.id;
  const payload = getStartPayload(update.message?.text);

  if (!chatId || !payload) {
    return NextResponse.json({ ok: true });
  }

  const challenge = await activateRegistrationChallenge(payload, String(chatId));

  if (!challenge) {
    await sendTelegramMessage(String(chatId), "Der Registrierungslink ist abgelaufen. Bitte starte die Registrierung erneut.");
    return NextResponse.json({ ok: true });
  }

  await sendTelegramCode(String(chatId), challenge.code);

  return NextResponse.json({ ok: true });
}
