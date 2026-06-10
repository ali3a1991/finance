import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth, requireWriteAccess } from "@/lib/auth";
import { createIncome, listIncomes } from "@/lib/serverDb";
import type { Income } from "@/lib/types";

export async function GET(request: NextRequest) {
  const auth = requireApiAuth(request);

  if (auth.error) {
    return auth.error;
  }

  return NextResponse.json({ incomes: await listIncomes(auth.payload.ownerId) });
}

export async function POST(request: NextRequest) {
  const auth = requireWriteAccess(request);

  if (auth.error) {
    return auth.error;
  }

  const body = (await request.json()) as Omit<Income, "id">;
  const income = await createIncome(auth.payload.ownerId, {
    ...body,
    id: `income-${Date.now()}`
  });

  return NextResponse.json({ income }, { status: 201 });
}
