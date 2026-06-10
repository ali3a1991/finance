import { NextRequest, NextResponse } from "next/server";
import { requireWriteAccess } from "@/lib/auth";
import { deleteIncome, updateIncome } from "@/lib/serverDb";
import type { Income } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = requireWriteAccess(request);

  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  const body = (await request.json()) as Omit<Income, "id">;
  const income = await updateIncome(auth.payload.ownerId, id, body);

  if (!income) {
    return NextResponse.json({ message: "Einnahme nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ income });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = requireWriteAccess(request);

  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  const deleted = await deleteIncome(auth.payload.ownerId, id);

  if (!deleted) {
    return NextResponse.json({ message: "Einnahme nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
