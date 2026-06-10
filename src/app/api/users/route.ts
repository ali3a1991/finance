import { NextRequest, NextResponse } from "next/server";
import { requireOwnerAccess } from "@/lib/auth";
import { createSharedUser, listSharedUsers } from "@/lib/serverDb";
import type { AccessLevel } from "@/lib/types";

function isAccessLevel(value: unknown): value is AccessLevel {
  return value === "readonly" || value === "readwrite";
}

export async function GET(request: NextRequest) {
  const auth = requireOwnerAccess(request);

  if (auth.error) {
    return auth.error;
  }

  return NextResponse.json({ users: await listSharedUsers(auth.payload.ownerId) });
}

export async function POST(request: NextRequest) {
  const auth = requireOwnerAccess(request);

  if (auth.error) {
    return auth.error;
  }

  const body = (await request.json()) as {
    accessLevel?: unknown;
    password?: string;
    username?: string;
  };

  if (!body.username?.trim() || !body.password || body.password.length < 6 || !isAccessLevel(body.accessLevel)) {
    return NextResponse.json({ message: "Ungultige Benutzerdaten." }, { status: 400 });
  }

  try {
    const user = await createSharedUser({
      accessLevel: body.accessLevel,
      ownerId: auth.payload.ownerId,
      password: body.password,
      username: body.username.trim()
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Benutzername ist bereits vergeben." }, { status: 409 });
  }
}
