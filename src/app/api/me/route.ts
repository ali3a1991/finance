import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = requireApiAuth(request);

  if (auth.error) {
    return auth.error;
  }

  return NextResponse.json({
    accessLevel: auth.payload.accessLevel,
    ownerId: auth.payload.ownerId,
    username: auth.payload.sub
  });
}
