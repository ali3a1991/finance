import { NextRequest, NextResponse } from "next/server";
import { requireWriteAccess } from "@/lib/auth";
import { deleteInvestment } from "@/lib/serverDb";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = requireWriteAccess(request);

  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  const deleted = await deleteInvestment(auth.payload.ownerId, id);

  if (!deleted) {
    return NextResponse.json({ message: "Investition nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
