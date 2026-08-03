import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth, requireWriteAccess } from "@/lib/auth";
import { createExpenseProject, listExpenseProjects } from "@/lib/serverDb";
import { isValidProjectInput } from "@/lib/projectValidation";
import type { ExpenseProjectInput } from "@/lib/types";

export async function GET(request: NextRequest) {
  const auth = requireApiAuth(request);
  if (auth.error) return auth.error;
  return NextResponse.json({ projects: await listExpenseProjects(auth.payload.ownerId) });
}

export async function POST(request: NextRequest) {
  const auth = requireWriteAccess(request);
  if (auth.error) return auth.error;
  const body = (await request.json()) as ExpenseProjectInput;
  if (!isValidProjectInput(body)) {
    return NextResponse.json({ message: "Ungültige Projektdaten." }, { status: 400 });
  }
  const project = await createExpenseProject(auth.payload.ownerId, body);
  return NextResponse.json({ project }, { status: 201 });
}
