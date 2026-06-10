import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth, requireWriteAccess } from "@/lib/auth";
import { createLoan, listLoans } from "@/lib/serverDb";
import type { Loan } from "@/lib/types";

export async function GET(request: NextRequest) {
  const auth = requireApiAuth(request);

  if (auth.error) {
    return auth.error;
  }

  return NextResponse.json({ loans: await listLoans(auth.payload.ownerId) });
}

export async function POST(request: NextRequest) {
  const auth = requireWriteAccess(request);

  if (auth.error) {
    return auth.error;
  }

  const body = (await request.json()) as Omit<Loan, "id" | "status">;
  const loan = await createLoan(auth.payload.ownerId, {
    ...body,
    id: `loan-${Date.now()}`,
    status: "Aktiv"
  });

  return NextResponse.json({ loan }, { status: 201 });
}
