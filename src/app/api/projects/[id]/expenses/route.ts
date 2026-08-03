import { NextRequest, NextResponse } from "next/server";
import { requireWriteAccess } from "@/lib/auth";
import { createProjectExpense } from "@/lib/serverDb";
import { isValidProjectExpenseInput } from "@/lib/projectValidation";
import type { ProjectExpenseInput } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = requireWriteAccess(request);
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const body = (await request.json()) as ProjectExpenseInput;
  if (!isValidProjectExpenseInput(body)) {
    return NextResponse.json({ message: "Ungültige Ausgabendaten." }, { status: 400 });
  }
  const project = await createProjectExpense(auth.payload.ownerId, id, body);
  if (!project) return NextResponse.json({ message: "Projekt oder Auswahl nicht gefunden." }, { status: 404 });
  return NextResponse.json({ project }, { status: 201 });
}
