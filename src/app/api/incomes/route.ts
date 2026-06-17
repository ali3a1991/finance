import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth, requireWriteAccess } from "@/lib/auth";
import { createIncome, getPreviousMonthBalance, listIncomes, updatePreviousMonthBalance } from "@/lib/serverDb";
import type { Income } from "@/lib/types";

export async function GET(request: NextRequest) {
  const auth = requireApiAuth(request);

  if (auth.error) {
    return auth.error;
  }

  const month = request.nextUrl.searchParams.get("month");

  return NextResponse.json({
    incomes: await listIncomes(auth.payload.ownerId),
    previousMonthBalance: await getPreviousMonthBalance(auth.payload.ownerId, month)
  });
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

export async function PATCH(request: NextRequest) {
  const auth = requireWriteAccess(request);

  if (auth.error) {
    return auth.error;
  }

  const body = (await request.json()) as { amount?: number; month?: string };

  if (!body.month || typeof body.amount !== "number") {
    return NextResponse.json({ message: "Ungultige Vormonat-Daten." }, { status: 400 });
  }

  return NextResponse.json({
    previousMonthBalance: await updatePreviousMonthBalance(auth.payload.ownerId, body.month, body.amount)
  });
}
