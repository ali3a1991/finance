import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth, requireWriteAccess } from "@/lib/auth";
import { createInsurance, listInsurances } from "@/lib/serverDb";
import type { Insurance } from "@/lib/types";

export async function GET(request: NextRequest) {
  const auth = requireApiAuth(request);

  if (auth.error) {
    return auth.error;
  }

  return NextResponse.json({ insurances: await listInsurances(auth.payload.ownerId) });
}

export async function POST(request: NextRequest) {
  const auth = requireWriteAccess(request);

  if (auth.error) {
    return auth.error;
  }

  const body = (await request.json()) as Omit<Insurance, "id">;
  const insurance = await createInsurance(auth.payload.ownerId, {
    ...body,
    id: `ins-${Date.now()}`
  });

  return NextResponse.json({ insurance }, { status: 201 });
}
