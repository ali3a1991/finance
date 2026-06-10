import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { createGeneralContract, listGeneralContracts } from "@/lib/serverDb";
import type { GeneralContract } from "@/lib/types";

function isValidContract(body: Omit<GeneralContract, "id">) {
  return (
    Boolean(body.title?.trim()) &&
    Boolean(body.provider?.trim()) &&
    Boolean(body.category?.trim()) &&
    Number.isFinite(body.monthlyAmount) &&
    Number.isFinite(body.debitDay) &&
    body.debitDay >= 1 &&
    body.debitDay <= 31 &&
    Boolean(body.startDate) &&
    Boolean(body.endDate) &&
    Boolean(body.status?.trim())
  );
}

export async function GET(request: NextRequest) {
  const auth = requireApiAuth(request);

  if (auth.error) {
    return auth.error;
  }

  return NextResponse.json({ contracts: await listGeneralContracts() });
}

export async function POST(request: NextRequest) {
  const auth = requireApiAuth(request);

  if (auth.error) {
    return auth.error;
  }

  const body = (await request.json()) as Omit<GeneralContract, "id">;

  if (!isValidContract(body)) {
    return NextResponse.json({ message: "Ungultige Vertragsdaten." }, { status: 400 });
  }

  const contract = await createGeneralContract({
    ...body,
    id: `contract-${Date.now()}`,
    note: body.note || null
  });

  return NextResponse.json({ contract }, { status: 201 });
}
