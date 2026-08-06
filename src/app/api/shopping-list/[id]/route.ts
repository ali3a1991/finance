import { NextRequest, NextResponse } from "next/server";
import { requireWriteAccess } from "@/lib/auth";
import { deleteShoppingItem, setShoppingItemCompleted } from "@/lib/serverDb";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = requireWriteAccess(request);
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const body = (await request.json()) as { completed?: boolean };
  if (typeof body.completed !== "boolean") {
    return NextResponse.json({ message: "Ungültiger Status." }, { status: 400 });
  }
  const item = await setShoppingItemCompleted(auth.payload.ownerId, id, body.completed);
  if (!item) return NextResponse.json({ message: "Eintrag nicht gefunden." }, { status: 404 });
  return NextResponse.json({ item });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = requireWriteAccess(request);
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const deleted = await deleteShoppingItem(auth.payload.ownerId, id);
  if (!deleted) return NextResponse.json({ message: "Eintrag nicht gefunden." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
