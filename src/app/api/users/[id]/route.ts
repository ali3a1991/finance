import { NextRequest, NextResponse } from "next/server";
import { requireOwnerAccess } from "@/lib/auth";
import { deleteSharedUser, updateSharedUser } from "@/lib/serverDb";
import type { AccessLevel } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isAccessLevel(value: unknown): value is AccessLevel {
  return value === "readonly" || value === "readwrite";
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = requireOwnerAccess(request);

  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    accessLevel?: unknown;
    password?: string;
    username?: string;
  };

  if (!body.username?.trim() || !isAccessLevel(body.accessLevel) || (body.password && body.password.length < 6)) {
    return NextResponse.json({ message: "Ungultige Benutzerdaten." }, { status: 400 });
  }

  if (body.username.trim() === auth.payload.sub) {
    return NextResponse.json({ message: "Der Inhaber kann nicht als freigegebener Benutzer verwendet werden." }, { status: 409 });
  }

  try {
    const user = await updateSharedUser(auth.payload.ownerId, id, {
      accessLevel: body.accessLevel,
      password: body.password || undefined,
      username: body.username.trim()
    });

    if (!user) {
      return NextResponse.json({ message: "Benutzer nicht gefunden." }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ message: "Benutzername ist bereits vergeben." }, { status: 409 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = requireOwnerAccess(request);

  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  const deleted = await deleteSharedUser(auth.payload.ownerId, id);

  if (!deleted) {
    return NextResponse.json({ message: "Benutzer nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
