import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createScopedAuthToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { password, username } = (await request.json()) as {
    password?: string;
    username?: string;
  };

  const user = username && password ? await authenticateUser(username, password) : null;

  if (!user) {
    return NextResponse.json({ message: "Benutzername oder Passwort ist falsch." }, { status: 401 });
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
