import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { deleteInsurance, updateInsurance } from "@/lib/serverDb";
import type { Insurance } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = requireApiAuth(request);

  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  const body = (await request.json()) as Omit<Insurance, "id">;
  const insurance = await updateInsurance(id, body);

  if (!insurance) {
    return NextResponse.json({ message: "Versicherung nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ insurance });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = requireApiAuth(request);

  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  const deleted = await deleteInsurance(id);

  if (!deleted) {
    return NextResponse.json({ message: "Versicherung nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
