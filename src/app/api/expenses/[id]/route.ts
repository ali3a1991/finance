import { NextRequest, NextResponse } from "next/server";
import { requireWriteAccess } from "@/lib/auth";
import { deleteExpense, updateExpense } from "@/lib/serverDb";
import type { Expense } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = requireWriteAccess(request);

  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  const body = (await request.json()) as Omit<Expense, "id">;

  if (!body.title?.trim() || !body.category?.trim() || !Number.isFinite(body.amount) || !body.date) {
    return NextResponse.json({ message: "Ungultige Ausgabendaten." }, { status: 400 });
  }

  const expense = await updateExpense(auth.payload.ownerId, id, body);

  if (!expense) {
    return NextResponse.json({ message: "Ausgabe nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ expense });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = requireWriteAccess(request);

  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  const deleted = await deleteExpense(auth.payload.ownerId, id);

  if (!deleted) {
    return NextResponse.json({ message: "Ausgabe nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
