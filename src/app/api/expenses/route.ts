import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { createExpense, listExpenses } from "@/lib/serverDb";
import type { Expense } from "@/lib/types";

export async function GET(request: NextRequest) {
  const auth = requireApiAuth(request);

  if (auth.error) {
    return auth.error;
  }

  return NextResponse.json({ expenses: await listExpenses() });
}

export async function POST(request: NextRequest) {
  const auth = requireApiAuth(request);

  if (auth.error) {
    return auth.error;
  }

  const body = (await request.json()) as Omit<Expense, "id">;

  if (!body.title?.trim() || !body.category?.trim() || !Number.isFinite(body.amount) || !body.date) {
    return NextResponse.json({ message: "Ungultige Ausgabendaten." }, { status: 400 });
  }

  const expense = await createExpense({
    ...body,
    id: `exp-${Date.now()}`
  });

  return NextResponse.json({ expense }, { status: 201 });
}
