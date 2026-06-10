import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth, requireWriteAccess } from "@/lib/auth";
import { createInvestment, listInvestmentsWithQuotes } from "@/lib/serverDb";
import type { Investment } from "@/lib/types";

export async function GET(request: NextRequest) {
  const auth = requireApiAuth(request);

  if (auth.error) {
    return auth.error;
  }

  return NextResponse.json({ investments: await listInvestmentsWithQuotes(auth.payload.ownerId) });
}

export async function POST(request: NextRequest) {
  const auth = requireWriteAccess(request);

  if (auth.error) {
    return auth.error;
  }

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

  const investment = await createInvestment(auth.payload.ownerId, {
    ...body,
    assetName: body.assetName.trim(),
    id: `investment-${Date.now()}`,
    symbol: body.symbol.trim().toUpperCase()
  });

  return NextResponse.json({ investment }, { status: 201 });
}
