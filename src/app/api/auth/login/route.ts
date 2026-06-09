import { NextRequest, NextResponse } from "next/server";
import { createAuthToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { password, username } = (await request.json()) as {
    password?: string;
    username?: string;
  };

  const expectedUsername = process.env.AUTH_USERNAME || "admin";
  const expectedPassword = process.env.AUTH_PASSWORD || "admin123";

  if (username !== expectedUsername || password !== expectedPassword) {
    return NextResponse.json({ message: "Benutzername oder Passwort ist falsch." }, { status: 401 });
  }

  const token = createAuthToken(username);
  const response = NextResponse.json({ token, expiresInDays: 30 });
  setAuthCookie(response, token);

  return response;
}
