import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth, requireWriteAccess } from "@/lib/auth";
import { createShoppingItem, listShoppingItems } from "@/lib/serverDb";
import type { ShoppingItem, ShoppingUnit } from "@/lib/types";

const units: ShoppingUnit[] = ["kg", "package", "piece", "bottle"];

export async function GET(request: NextRequest) {
  const auth = requireApiAuth(request);
  if (auth.error) return auth.error;
  return NextResponse.json({ items: await listShoppingItems(auth.payload.ownerId) });
}

export async function POST(request: NextRequest) {
  const auth = await requireWriteAccess(request);
  if (auth.error) return auth.error;

  const body = (await request.json()) as Pick<ShoppingItem, "name" | "quantity" | "unit" | "deadline">;
  if (
    !body.name?.trim() ||
    !Number.isFinite(body.quantity) ||
    body.quantity <= 0 ||
    !units.includes(body.unit) ||
    (body.deadline !== null && !/^\d{4}-\d{2}-\d{2}$/.test(body.deadline))
  ) {
    return NextResponse.json({ message: "Ungültige Einkaufsdaten." }, { status: 400 });
  }

  const item = await createShoppingItem(auth.payload.ownerId, {
    deadline: body.deadline,
    name: body.name.trim(),
    quantity: body.quantity,
    unit: body.unit
  });
  return NextResponse.json({ item }, { status: 201 });
}
