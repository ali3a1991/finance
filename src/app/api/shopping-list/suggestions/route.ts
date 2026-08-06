import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { listShoppingSuggestions } from "@/lib/serverDb";

export async function GET(request: NextRequest) {
  const auth = requireApiAuth(request);
  if (auth.error) return auth.error;
  return NextResponse.json({ suggestions: await listShoppingSuggestions(auth.payload.ownerId) });
}
