import { NextRequest, NextResponse } from "next/server";
import { requireWriteAccess } from "@/lib/auth";
import { deleteSavingsGoal, updateSavingsGoal } from "@/lib/serverDb";
import type { SavingsGoal } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isValidSavingsGoal(goal: Omit<SavingsGoal, "id">) {
  return (
    Boolean(goal.name?.trim()) &&
    Number.isFinite(goal.targetAmount) &&
    goal.targetAmount > 0 &&
    Number.isFinite(goal.currentAmount) &&
    goal.currentAmount >= 0 &&
    Number.isFinite(goal.monthlyContribution) &&
    goal.monthlyContribution >= 0
  );
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = requireWriteAccess(request);

  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  const body = (await request.json()) as Omit<SavingsGoal, "id">;

  if (!isValidSavingsGoal(body)) {
    return NextResponse.json({ message: "Ungultige Spardaten." }, { status: 400 });
  }

  const savingsGoal = await updateSavingsGoal(auth.payload.ownerId, id, {
    ...body,
    name: body.name.trim(),
    note: body.note || null
  });

  if (!savingsGoal) {
    return NextResponse.json({ message: "Sparziel nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ savingsGoal });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = requireWriteAccess(request);

  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  const deleted = await deleteSavingsGoal(auth.payload.ownerId, id);

  if (!deleted) {
    return NextResponse.json({ message: "Sparziel nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
