import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { deleteGeneralContract, updateGeneralContract } from "@/lib/serverDb";
import type { GeneralContract } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
    Boolean(body.status?.trim())
  );
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = requireApiAuth(request);

  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  const body = (await request.json()) as Omit<GeneralContract, "id">;

  if (!isValidContract(body)) {
    return NextResponse.json({ message: "Ungultige Vertragsdaten." }, { status: 400 });
  }

  const contract = await updateGeneralContract(id, { ...body, note: body.note || null });

  if (!contract) {
    return NextResponse.json({ message: "Vertrag nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ contract });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = requireApiAuth(request);

  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  const deleted = await deleteGeneralContract(id);

  if (!deleted) {
    return NextResponse.json({ message: "Vertrag nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
