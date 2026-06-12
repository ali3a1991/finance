import { NextRequest, NextResponse } from "next/server";
import {
  activateLatestRegistrationChallengeByTelegramUsername,
  activateRegistrationChallenge
} from "@/lib/serverDb";
import { sendTelegramCode, sendTelegramMessage } from "@/lib/telegram";

type TelegramUpdate = {
  message?: {
    chat?: {
      id?: number | string;
      username?: string;
    };
    from?: {
      username?: string;
    };
    text?: string;
  };
};

function getStartPayload(text?: string) {
  const match = text?.trim().match(/^\/start(?:@\w+)?\s+(reg_[A-Za-z0-9]+)$/);
  return match?.[1] ?? null;
}

function isStartCommand(text?: string) {
  return /^\/start(?:@\w+)?(?:\s|$)/.test(text?.trim() ?? "");
}

export async function POST(request: NextRequest) {
  const update = (await request.json()) as TelegramUpdate;
  const chatId = update.message?.chat?.id;
  const payload = getStartPayload(update.message?.text);

  if (!chatId || !isStartCommand(update.message?.text)) {
    return NextResponse.json({ ok: true });
  }

  const telegramUsername = update.message?.from?.username ?? update.message?.chat?.username;
  const challenge = payload
    ? await activateRegistrationChallenge(payload, String(chatId))
    : telegramUsername
      ? await activateLatestRegistrationChallengeByTelegramUsername(telegramUsername, String(chatId))
      : null;

  if (!challenge) {
    await sendTelegramMessage(
      String(chatId),
      "Ich finde keine offene Registrierung. Bitte starte die Registrierung in der App erneut und offne dann den Telegram-Link."
    );
    return NextResponse.json({ ok: true });
  }

  await sendTelegramCode(String(chatId), challenge.code);

  return NextResponse.json({ ok: true });
}
