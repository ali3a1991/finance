import { NextRequest, NextResponse } from "next/server";
import { requireOwnerAccess } from "@/lib/auth";
import { isActionPermission } from "@/lib/actionPermissions";
import { updateSharedUserPermissions } from "@/lib/serverDb";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = requireOwnerAccess(request);
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const body = (await request.json()) as { permissions?: unknown };
  if (!Array.isArray(body.permissions) || !body.permissions.every(isActionPermission)) {
    return NextResponse.json({ message: "Ungültige Berechtigungen." }, { status: 400 });
  }
  const permissions = [...new Set(body.permissions)];
  const user = await updateSharedUserPermissions(auth.payload.ownerId, id, permissions);
  if (!user) return NextResponse.json({ message: "Benutzer nicht gefunden." }, { status: 404 });
  return NextResponse.json({ user });
}
