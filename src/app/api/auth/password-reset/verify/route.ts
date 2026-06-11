import { NextRequest, NextResponse } from "next/server";
import { completePasswordReset } from "@/lib/serverDb";

export async function POST(request: NextRequest) {
  const { challengeId, code, password } = (await request.json()) as {
    challengeId?: string | null;
    code?: string;
    password?: string;
  };

  if (!challengeId || !code?.trim() || !password || password.length < 6) {
    return NextResponse.json({ message: "Ungultige Daten." }, { status: 400 });
  }

  const ok = await completePasswordReset(challengeId, code.trim(), password);

  if (!ok) {
    return NextResponse.json({ message: "Der Code ist falsch oder abgelaufen." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
