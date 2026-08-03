import { NextRequest, NextResponse } from "next/server";
import { requireWriteAccess } from "@/lib/auth";
import { deleteProjectExpense, updateProjectExpense } from "@/lib/serverDb";
import { isValidProjectExpenseInput } from "@/lib/projectValidation";
import type { ProjectExpenseInput } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string; expenseId: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = requireWriteAccess(request);
  if (auth.error) return auth.error;
  const { id, expenseId } = await context.params;
  const body = (await request.json()) as ProjectExpenseInput;
  if (!isValidProjectExpenseInput(body)) {
    return NextResponse.json({ message: "Ungültige Ausgabendaten." }, { status: 400 });
  }
  const project = await updateProjectExpense(auth.payload.ownerId, id, expenseId, body);
  if (!project) return NextResponse.json({ message: "Ausgabe nicht gefunden." }, { status: 404 });
  return NextResponse.json({ project });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = requireWriteAccess(request);
  if (auth.error) return auth.error;
  const { id, expenseId } = await context.params;
  const deleted = await deleteProjectExpense(auth.payload.ownerId, id, expenseId);
  if (!deleted) return NextResponse.json({ message: "Ausgabe nicht gefunden." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
