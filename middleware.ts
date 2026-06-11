import { NextRequest, NextResponse } from "next/server";

const protectedPagePattern = /^\/(?!(login|register|forgot-password)(\/)?$|api|_next|favicon\.ico|manifest\.webmanifest|manifest\.json|sw\.js|icon-192\.png|icon-512\.png).*/;

function hasUsableToken(request: NextRequest) {
  const token = request.cookies.get("finance_token")?.value;

  if (!token) {
    return false;
  }

  const [payload] = token.split(".");

  if (!payload) {
    return false;
  }

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "="
    );
    const decoded = JSON.parse(atob(paddedPayload)) as { exp?: number };
    const now = Math.floor(Date.now() / 1000);
    return Boolean(decoded.exp && decoded.exp > now);
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!protectedPagePattern.test(pathname)) {
    return NextResponse.next();
  }

  if (hasUsableToken(request)) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|manifest.json|sw.js|icon-192.png|icon-512.png).*)"]
};
