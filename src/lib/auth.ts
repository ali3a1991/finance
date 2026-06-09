import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
const TOKEN_COOKIE = "finance_token";

type TokenPayload = {
  exp: number;
  iat: number;
  sub: string;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getSecret() {
  return process.env.AUTH_SECRET || "dev-finanzmanager-secret-change-me";
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createAuthToken(sub: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    exp: now + TOKEN_TTL_SECONDS,
    iat: now,
    sub
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyAuthToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as TokenPayload;
    const now = Math.floor(Date.now() / 1000);

    if (!payload.sub || payload.exp <= now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest) {
  const header = request.headers.get("authorization");

  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }

  return request.cookies.get(TOKEN_COOKIE)?.value;
}

export function requireApiAuth(request: NextRequest) {
  const payload = verifyAuthToken(getTokenFromRequest(request));

  if (!payload) {
    return {
      error: NextResponse.json({ message: "Nicht autorisiert" }, { status: 401 }),
      payload: null
    };
  }

  return { error: null, payload };
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    maxAge: TOKEN_TTL_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(TOKEN_COOKIE, "", {
    maxAge: 0,
    path: "/"
  });
}
