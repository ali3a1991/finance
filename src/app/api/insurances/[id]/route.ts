import { NextRequest, NextResponse } from "next/server";
import { requireWriteAccess } from "@/lib/auth";
import { deleteInsurance, updateInsurance } from "@/lib/serverDb";
import type { Insurance } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = requireWriteAccess(request);

  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  const body = (await request.json()) as Omit<Insurance, "id">;
  const insurance = await updateInsurance(auth.payload.ownerId, id, body);

  if (!insurance) {
    return NextResponse.json({ message: "Versicherung nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ insurance });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = requireWriteAccess(request);

  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  const deleted = await deleteInsurance(auth.payload.ownerId, id);

  if (!deleted) {
    return NextResponse.json({ message: "Versicherung nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
