import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
const TOKEN_COOKIE = "finance_token";

export type AccessLevel = "readonly" | "readwrite" | "owner";

type TokenPayload = {
  accessLevel: AccessLevel;
  exp: number;
  iat: number;
  ownerId: string;
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

function getPrimaryOwnerId() {
  return process.env.AUTH_OWNER_ID || "admin";
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createAuthToken(sub: string) {
  return createScopedAuthToken({
    accessLevel: "owner",
    ownerId: getPrimaryOwnerId(),
    sub
  });
}

export function createScopedAuthToken({
  accessLevel,
  ownerId,
  sub
}: {
  accessLevel: AccessLevel;
  ownerId: string;
  sub: string;
}) {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    accessLevel,
    exp: now + TOKEN_TTL_SECONDS,
    iat: now,
    ownerId,
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

    return {
      accessLevel: payload.accessLevel || "owner",
      exp: payload.exp,
      iat: payload.iat,
      ownerId: payload.ownerId || payload.sub,
      sub: payload.sub
    };
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

export function requireWriteAccess(request: NextRequest) {
  const auth = requireApiAuth(request);

  if (auth.error) {
    return auth;
  }

  if (auth.payload.accessLevel === "readonly") {
    return {
      error: NextResponse.json({ message: "Nur-Lesen Zugriff erlaubt diese Aktion nicht." }, { status: 403 }),
      payload: auth.payload
    };
  }

  return auth;
}

export function requireOwnerAccess(request: NextRequest) {
  const auth = requireApiAuth(request);

  if (auth.error) {
    return auth;
  }

  if (auth.payload.accessLevel !== "owner") {
    return {
      error: NextResponse.json({ message: "Nur der Kontoinhaber darf diese Einstellung andern." }, { status: 403 }),
      payload: auth.payload
    };
  }

  return auth;
}

export function getPasswordHash(password: string) {
  return createHmac("sha256", getSecret()).update(password).digest("hex");
}

export function verifyPassword(password: string, passwordHash: string) {
  const actual = Buffer.from(getPasswordHash(password));
  const expected = Buffer.from(passwordHash);

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function authenticateUser(username: string, password: string) {
  const expectedUsername = process.env.AUTH_USERNAME || "admin";
  const expectedPassword = process.env.AUTH_PASSWORD || "admin123";

  if (username === expectedUsername && password === expectedPassword) {
    return {
      accessLevel: "owner" as const,
      ownerId: getPrimaryOwnerId(),
      username
    };
  }

  const user = await prisma.appUser.findUnique({ where: { username } });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return {
    accessLevel: user.accessLevel === "readonly" ? ("readonly" as const) : ("readwrite" as const),
    ownerId: user.ownerId,
    username: user.username
  };
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
