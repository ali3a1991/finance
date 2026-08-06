import { NextRequest, NextResponse } from "next/server";
import { requireActionAccess, requireWriteAccess } from "@/lib/auth";
import { deleteShoppingItem, setShoppingItemCompleted, updateOpenShoppingItem } from "@/lib/serverDb";
import type { ShoppingItem, ShoppingUnit } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };
const units: ShoppingUnit[] = ["kg", "package", "piece"];

export async function PATCH(request: NextRequest, context: RouteContext) {
  const body = (await request.json()) as Partial<Pick<ShoppingItem, "name" | "quantity" | "unit" | "deadline">> & { completed?: boolean };
  const auth = await requireActionAccess(request, typeof body.completed === "boolean" ? "shopping.complete" : "shopping.edit");
  if (auth.error) return auth.error;
  const { id } = await context.params;

  if (typeof body.completed === "boolean") {
    const item = await setShoppingItemCompleted(auth.payload.ownerId, id, body.completed);
    if (!item) return NextResponse.json({ message: "Eintrag nicht gefunden." }, { status: 404 });
    return NextResponse.json({ item });
  }

  if (
    !body.name?.trim() ||
    typeof body.quantity !== "number" ||
    !Number.isFinite(body.quantity) ||
    body.quantity <= 0 ||
    !body.unit ||
    !units.includes(body.unit) ||
    (body.deadline !== null && (typeof body.deadline !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.deadline)))
  ) {
    return NextResponse.json({ message: "Ungültige Einkaufsdaten." }, { status: 400 });
  }

  const item = await updateOpenShoppingItem(auth.payload.ownerId, id, {
    deadline: body.deadline ?? null,
    name: body.name.trim(),
    quantity: body.quantity,
    unit: body.unit
  });
  if (!item) return NextResponse.json({ message: "Offener Eintrag nicht gefunden." }, { status: 404 });
  return NextResponse.json({ item });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireWriteAccess(request);
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const deleted = await deleteShoppingItem(auth.payload.ownerId, id);
  if (!deleted) return NextResponse.json({ message: "Eintrag nicht gefunden." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
