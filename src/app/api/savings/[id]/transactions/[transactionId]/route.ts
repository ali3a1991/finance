import { NextRequest, NextResponse } from "next/server";
import { requireWriteAccess } from "@/lib/auth";
import { deleteSavingsTransaction, updateSavingsTransaction } from "@/lib/serverDb";

type RouteContext = {
  params: Promise<{ id: string; transactionId: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = requireWriteAccess(request);

  if (auth.error) {
    return auth.error;
  }

  const { id, transactionId } = await context.params;
  const body = (await request.json()) as {
    amount?: number;
    date?: string;
    note?: string | null;
  };

  if (!Number.isFinite(body.amount) || (body.amount ?? 0) <= 0 || !body.date) {
    return NextResponse.json({ message: "Ungultige Sparbuchung." }, { status: 400 });
  }

  const result = await updateSavingsTransaction({
    amount: body.amount as number,
    date: body.date,
    note: body.note,
    ownerId: auth.payload.ownerId,
    savingsGoalId: id,
    transactionId
  });

  if (!result) {
    return NextResponse.json({ message: "Sparbuchung nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = requireWriteAccess(request);

  if (auth.error) {
    return auth.error;
  }

  const { id, transactionId } = await context.params;
  const savingsGoal = await deleteSavingsTransaction({
    ownerId: auth.payload.ownerId,
    savingsGoalId: id,
    transactionId
  });

  if (!savingsGoal) {
    return NextResponse.json({ message: "Sparbuchung nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ savingsGoal });
}
