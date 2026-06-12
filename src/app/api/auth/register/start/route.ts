import { NextRequest, NextResponse } from "next/server";
import { sendTelegramCode } from "@/lib/telegram";
import { createRegistrationChallenge, findRegistrationAccount, findTelegramContactByUsername } from "@/lib/serverDb";

function createCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    confirmTransfer?: boolean;
    password?: string;
    username?: string;
  };
  const username = body.username?.trim();

  if (!username || !body.password || body.password.length < 6) {
    return NextResponse.json({ message: "Ungultige Registrierungsdaten." }, { status: 400 });
  }

  const existingUser = await findRegistrationAccount(username);

  if (existingUser?.accessLevel === "owner") {
    return NextResponse.json({ message: "Dieser Benutzer hat bereits ein eigenes Konto." }, { status: 409 });
  }

  if (existingUser && !body.confirmTransfer) {
    return NextResponse.json({
      message:
        "Dieser Benutzer hat bereits Zugriff auf ein anderes Konto. Wenn du registrierst, verlierst du diesen Zugriff.",
      requiresTransferConfirmation: true
    });
  }

  const code = createCode();
  const botUsername = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "");

  try {
    const challenge = await createRegistrationChallenge({
      code,
      password: body.password,
      telegramContact: username,
      transferSharedUserId: existingUser?.id,
      username
    });
    const payload = challenge.id;
    const contact = await findTelegramContactByUsername(username);
    let sent = false;

    if (contact) {
      await sendTelegramCode(contact.contact, code);
      sent = true;
    }

    return NextResponse.json({
      botLink: botUsername ? `https://t.me/${botUsername}?start=${encodeURIComponent(payload)}` : null,
      challengeId: challenge.id,
      sent
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? `Registrierung konnte nicht gestartet werden: ${error.message}`
            : "Registrierung konnte nicht gestartet werden."
      },
      { status: 502 }
    );
  }
}
