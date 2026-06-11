import { NextRequest, NextResponse } from "next/server";
import { requireWriteAccess } from "@/lib/auth";
import { deleteInvestment, updateInvestment } from "@/lib/serverDb";
import type { Investment } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = requireWriteAccess(request);

  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  const body = (await request.json()) as Omit<Investment, "id">;

  if (
    !body.assetName?.trim() ||
    !body.symbol?.trim() ||
    !Number.isFinite(body.quantity) ||
    body.quantity <= 0 ||
    !Number.isFinite(body.purchasePrice) ||
    body.purchasePrice < 0 ||
    !body.purchaseDate
  ) {
    return NextResponse.json({ message: "Ungultige Investitionsdaten." }, { status: 400 });
  }

  const investment = await updateInvestment(auth.payload.ownerId, id, {
    ...body,
    assetName: body.assetName.trim(),
    symbol: body.symbol.trim().toUpperCase()
  });

  if (!investment) {
    return NextResponse.json({ message: "Investition nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ investment });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = requireWriteAccess(request);

  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  const deleted = await deleteInvestment(auth.payload.ownerId, id);

  if (!deleted) {
    return NextResponse.json({ message: "Investition nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
