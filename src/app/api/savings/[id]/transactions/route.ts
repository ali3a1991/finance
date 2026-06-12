import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth, requireWriteAccess } from "@/lib/auth";
import { applySavingsTransaction, listSavingsTransactions } from "@/lib/serverDb";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = requireApiAuth(request);

  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  return NextResponse.json({
    transactions: await listSavingsTransactions(auth.payload.ownerId, id)
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = requireWriteAccess(request);

  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    amount?: number;
    date?: string;
    note?: string | null;
    type?: "deposit" | "withdrawal";
  };

  if (
    (body.type !== "deposit" && body.type !== "withdrawal") ||
    !Number.isFinite(body.amount) ||
    (body.amount ?? 0) <= 0 ||
    !body.date
  ) {
    return NextResponse.json({ message: "Ungultige Sparbuchung." }, { status: 400 });
  }

  const amount = body.amount as number;
  const date = body.date as string;
  const type = body.type as "deposit" | "withdrawal";

  const savingsGoal = await applySavingsTransaction({
    amount,
    date,
    note: body.note,
    ownerId: auth.payload.ownerId,
    savingsGoalId: id,
    type
  });

  if (!savingsGoal) {
    return NextResponse.json({ message: "Spartopf nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ savingsGoal });
}
