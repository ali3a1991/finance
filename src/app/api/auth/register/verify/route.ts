import { NextRequest, NextResponse } from "next/server";
import { createScopedAuthToken, setAuthCookie } from "@/lib/auth";
import { completeRegistration } from "@/lib/serverDb";

export async function POST(request: NextRequest) {
  const { challengeId, code } = (await request.json()) as {
    challengeId?: string;
    code?: string;
  };

  if (!challengeId || !code?.trim()) {
    return NextResponse.json({ message: "Der Code ist ungultig." }, { status: 400 });
  }

  const user = await completeRegistration(challengeId, code.trim());

  if (!user) {
    return NextResponse.json({ message: "Der Code ist falsch oder abgelaufen." }, { status: 400 });
  }

  const token = createScopedAuthToken({
    accessLevel: user.accessLevel,
    ownerId: user.ownerId,
    sub: user.username
  });
  const response = NextResponse.json({
    accessLevel: user.accessLevel,
    ownerId: user.ownerId,
    token,
    username: user.username,
    expiresInDays: 30
  });
  setAuthCookie(response, token);

  return response;
}
