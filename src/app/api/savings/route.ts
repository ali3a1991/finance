import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth, requireWriteAccess } from "@/lib/auth";
import { createSavingsGoal, listSavingsGoals } from "@/lib/serverDb";
import type { SavingsGoal } from "@/lib/types";

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

export async function GET(request: NextRequest) {
  const auth = requireApiAuth(request);

  if (auth.error) {
    return auth.error;
  }

  return NextResponse.json({ savingsGoals: await listSavingsGoals(auth.payload.ownerId) });
}

export async function POST(request: NextRequest) {
  const auth = requireWriteAccess(request);

  if (auth.error) {
    return auth.error;
  }

  const body = (await request.json()) as Omit<SavingsGoal, "id">;

  if (!isValidSavingsGoal(body)) {
    return NextResponse.json({ message: "Ungultige Spardaten." }, { status: 400 });
  }

  const savingsGoal = await createSavingsGoal(auth.payload.ownerId, {
    ...body,
    id: `saving-${Date.now()}`,
    name: body.name.trim(),
    note: body.note || null
  });

  return NextResponse.json({ savingsGoal }, { status: 201 });
}
