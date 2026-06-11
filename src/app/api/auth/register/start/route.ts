import { NextRequest, NextResponse } from "next/server";
import { createRegistrationChallenge, findRegistrationAccount } from "@/lib/serverDb";
import { sendTelegramCode } from "@/lib/telegram";

function createCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    confirmTransfer?: boolean;
    password?: string;
    telegramContact?: string;
    username?: string;
  };
  const username = body.username?.trim();
  const telegramContact = body.telegramContact?.trim() || username;

  if (!username || !telegramContact || !body.password || body.password.length < 6) {
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

  try {
    const challenge = await createRegistrationChallenge({
      code,
      password: body.password,
      telegramContact,
      transferSharedUserId: existingUser?.id,
      username
    });
    await sendTelegramCode(telegramContact, code);

    return NextResponse.json({ challengeId: challenge.id, sent: true });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? `Telegram-Code konnte nicht gesendet werden: ${error.message}`
            : "Telegram-Code konnte nicht gesendet werden."
      },
      { status: 502 }
    );
  }
}
