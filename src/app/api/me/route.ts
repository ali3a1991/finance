import { NextRequest, NextResponse } from "next/server";
import { getUserActionPermissions, requireApiAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = requireApiAuth(request);

  if (auth.error) {
    return auth.error;
  }

  const permissions = await getUserActionPermissions(auth.payload);

  return NextResponse.json({
    accessLevel: auth.payload.accessLevel === "owner" ? "owner" : permissions.length > 0 ? "readwrite" : "readonly",
    ownerId: auth.payload.ownerId,
    username: auth.payload.sub,
    permissions
  });
}
