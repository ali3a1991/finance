import { NextRequest, NextResponse } from "next/server";
import { listTelegramContacts } from "@/lib/serverDb";
import { sendTelegramMessage } from "@/lib/telegram";

function isAuthorized(request: NextRequest) {
  const secret = process.env.UPDATE_BROADCAST_SECRET;
  return Boolean(secret && request.headers.get("x-broadcast-secret") === secret);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Nicht autorisiert." }, { status: 401 });
  }

  const { message, title } = (await request.json()) as {
    message?: string;
    title?: string;
  };
  const cleanMessage = message?.trim();

  if (!cleanMessage) {
    return NextResponse.json({ message: "Broadcast message fehlt." }, { status: 400 });
  }

  const contacts = await listTelegramContacts();
  const uniqueContacts = Array.from(
    new Map(contacts.map((contact) => [contact.contact.trim(), contact])).values()
  ).filter((contact) => contact.contact);
  const text = `${title?.trim() || "FyNest Update"}\n\n${cleanMessage}`;
  const results = await Promise.allSettled(uniqueContacts.map((contact) => sendTelegramMessage(contact.contact, text)));
  const sent = results.filter((result) => result.status === "fulfilled").length;

  return NextResponse.json({
    failed: results.length - sent,
    recipients: uniqueContacts.length,
    sent
  });
}
