import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { deleteLoan, updateLoan } from "@/lib/serverDb";
import type { Loan } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = requireApiAuth(request);

  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  const body = (await request.json()) as Omit<Loan, "id" | "status">;
  const loan = await updateLoan(id, body);

  if (!loan) {
    return NextResponse.json({ message: "Kredit nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ loan });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = requireApiAuth(request);

  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  const deleted = await deleteLoan(id);

  if (!deleted) {
    return NextResponse.json({ message: "Kredit nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
