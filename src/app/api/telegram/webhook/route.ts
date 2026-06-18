import { NextRequest, NextResponse } from "next/server";
import {
  activateLatestRegistrationChallengeByTelegramUsername,
  activateRegistrationChallenge,
  canBroadcastFromTelegram,
  listTelegramContacts,
  saveTelegramContact
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

function getBroadcastMessage(text?: string) {
  const match = text?.trim().match(/^\/broadcast(?:@\w+)?(?:\s+([\s\S]+))?$/);
  return match ? match[1]?.trim() ?? "" : null;
}

export async function POST(request: NextRequest) {
  const update = (await request.json()) as TelegramUpdate;
  const chatId = update.message?.chat?.id;
  const chatContact = chatId ? String(chatId) : "";
  const telegramUsername = update.message?.from?.username ?? update.message?.chat?.username;
  const broadcastMessage = getBroadcastMessage(update.message?.text);

  if (chatId && telegramUsername) {
    await saveTelegramContact(telegramUsername, chatContact);
  }

  if (chatId && broadcastMessage !== null) {
    if (!(await canBroadcastFromTelegram(telegramUsername, chatContact))) {
      await sendTelegramMessage(chatContact, "Du darfst keine Update-Nachrichten senden.");
      return NextResponse.json({ ok: true });
    }

    if (!broadcastMessage) {
      await sendTelegramMessage(chatContact, "Bitte schreibe die Nachricht nach /broadcast.");
      return NextResponse.json({ ok: true });
    }

    const contacts = await listTelegramContacts();
    const uniqueContacts = Array.from(
      new Map(contacts.map((contact) => [contact.contact.trim(), contact.contact.trim()])).values()
    ).filter(Boolean);
    const results = await Promise.allSettled(
      uniqueContacts.map((contact) => sendTelegramMessage(contact, broadcastMessage))
    );
    const sent = results.filter((result) => result.status === "fulfilled").length;
    const failed = results.length - sent;

    await sendTelegramMessage(chatContact, `Update gesendet.\nEmpfänger: ${uniqueContacts.length}\nErfolgreich: ${sent}\nFehlgeschlagen: ${failed}`);
    return NextResponse.json({ ok: true, recipients: uniqueContacts.length, sent, failed });
  }

  const payload = getStartPayload(update.message?.text);

  if (!chatId || !isStartCommand(update.message?.text)) {
    return NextResponse.json({ ok: true });
  }

  const challenge = payload
    ? await activateRegistrationChallenge(payload, chatContact)
    : telegramUsername
      ? await activateLatestRegistrationChallengeByTelegramUsername(telegramUsername, chatContact)
      : null;

  if (!challenge) {
    await sendTelegramMessage(
      chatContact,
      "Ich finde keine offene Registrierung. Bitte starte die Registrierung in der App erneut und offne dann den Telegram-Link."
    );
    return NextResponse.json({ ok: true });
  }

  await sendTelegramCode(chatContact, challenge.code);

  return NextResponse.json({ ok: true });
}
