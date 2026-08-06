import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth, requireWriteAccess } from "@/lib/auth";
import { deleteExpenseProject, getExpenseProject, updateExpenseProject } from "@/lib/serverDb";
import { isValidProjectInput } from "@/lib/projectValidation";
import type { ExpenseProjectInput } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = requireApiAuth(request);
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const project = await getExpenseProject(auth.payload.ownerId, id);
  if (!project) return NextResponse.json({ message: "Projekt nicht gefunden." }, { status: 404 });
  return NextResponse.json({ project });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await requireWriteAccess(request);
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const body = (await request.json()) as ExpenseProjectInput;
  if (!isValidProjectInput(body)) {
    return NextResponse.json({ message: "Ungültige Projektdaten." }, { status: 400 });
  }
  const project = await updateExpenseProject(auth.payload.ownerId, id, body);
  if (!project) return NextResponse.json({ message: "Projekt nicht gefunden." }, { status: 404 });
  return NextResponse.json({ project });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireWriteAccess(request);
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const deleted = await deleteExpenseProject(auth.payload.ownerId, id);
  if (!deleted) return NextResponse.json({ message: "Projekt nicht gefunden." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
