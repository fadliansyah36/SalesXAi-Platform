import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const ACCESS_COOKIE = "salesx_access";
export const REFRESH_COOKIE = "salesx_refresh";
export const EXPIRY_COOKIE = "salesx_access_expires";
export const CSRF_COOKIE = "salesx_csrf";
export const OAUTH_STATE_COOKIE = "salesx_oauth_state";
export const OAUTH_VERIFIER_COOKIE = "salesx_oauth_verifier";
export const OAUTH_FLOW_COOKIE = "salesx_oauth_flow";
export const OAUTH_USER_COOKIE = "salesx_oauth_user";
export const OAUTH_CREATED_COOKIE = "salesx_oauth_created";

export interface SupabaseAuthSession {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: number;
  user: { id: string; email?: string; phone?: string };
}

export function supabaseUrl(): string {
  const value = process.env.SUPABASE_URL ?? "";
  if (!value || new URL(value).hostname !== "eyofuiyxalbehbqoaeny.supabase.co") {
    throw new Error("Supabase Auth server configuration is unavailable for the bound SalesX-Ai project.");
  }
  return value.replace(/\/$/, "");
}

export function publishableKey(): string {
  return process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
}

export function apiUrl(): string {
  return (process.env.SALESX_API_URL ?? "").replace(/\/$/, "");
}

export function appOrigin(request: NextRequest): string {
  const configured = process.env.APP_PUBLIC_URL?.replace(/\/$/, "");
  if (configured) {
    const parsed = new URL(configured);
    if (parsed.origin !== configured || (process.env.NODE_ENV === "production" && parsed.protocol !== "https:")) {
      throw new Error("APP_PUBLIC_URL must be an exact HTTPS origin in production.");
    }
    return configured;
  }
  if (process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(request.nextUrl.hostname)) {
    return request.nextUrl.origin;
  }
  throw new Error("APP_PUBLIC_URL must be configured before enabling the Web authentication BFF.");
}

export function csrfCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: 60 * 60 * 2,
  };
}

function authCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function setSessionCookies(response: NextResponse, session: SupabaseAuthSession): void {
  const expiresAt = session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in;
  response.cookies.set(ACCESS_COOKIE, session.access_token, authCookieOptions(Math.max(60, expiresAt - Math.floor(Date.now() / 1000))));
  response.cookies.set(REFRESH_COOKIE, session.refresh_token, authCookieOptions(60 * 60 * 24 * 30));
  response.cookies.set(EXPIRY_COOKIE, String(expiresAt), authCookieOptions(60 * 60 * 24 * 30));
}

export function clearSessionCookies(response: NextResponse): void {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, EXPIRY_COOKIE]) {
    response.cookies.set(name, "", { ...authCookieOptions(0), maxAge: 0 });
  }
}

export function clearOAuthCookies(response: NextResponse): void {
  for (const name of [OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, OAUTH_FLOW_COOKIE, OAUTH_USER_COOKIE, OAUTH_CREATED_COOKIE]) {
    response.cookies.set(name, "", { ...authCookieOptions(0), maxAge: 0 });
  }
}

export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE, token, csrfCookieOptions());
}

export function csrfIsValid(request: NextRequest): boolean {
  const expectedOrigin = (() => {
    try { return appOrigin(request); } catch { return ""; }
  })();
  const origin = request.headers.get("origin") ?? "";
  const cookie = request.cookies.get(CSRF_COOKIE)?.value ?? "";
  const header = request.headers.get("x-csrf-token") ?? "";
  if (!expectedOrigin || origin !== expectedOrigin || !cookie || !header || cookie.length !== header.length) return false;
  return timingSafeEqual(Buffer.from(cookie), Buffer.from(header));
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export async function supabaseAuthRequest<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<{ ok: true; data: T } | { ok: false; status: number; body: Record<string, unknown> }> {
  const key = publishableKey();
  if (!key) throw new Error("SUPABASE_PUBLISHABLE_KEY is deployment-pending.");
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", "Bearer " + accessToken);
  const response = await fetch(supabaseUrl() + "/auth/v1/" + path, {
    ...init,
    headers,
    cache: "no-store",
    redirect: "manual",
    signal: init.signal ?? AbortSignal.timeout(10000),
  });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) return { ok: false, status: response.status, body };
  return { ok: true, data: body as T };
}

export async function enforceBffRateLimit(
  request: NextRequest,
  action: string,
  identifier?: string,
): Promise<Response | null> {
  const origin = apiUrl();
  const secret = process.env.SALESX_BFF_SHARED_SECRET ?? "";
  if (!origin || !secret) {
    return Response.json({ error: { code: "rate_limit_store_unavailable", message: "The server-side authentication rate limiter is not configured." } }, { status: 503 });
  }
  // Vercel/ingress must overwrite X-Real-IP; do not trust a client-supplied X-Forwarded-For chain.
  const clientIp = request.headers.get("x-real-ip")?.trim()
    ?? (process.env.NODE_ENV !== "production" ? "127.0.0.1" : "");
  if (!clientIp) return Response.json({ error: { code: "rate_limit_ip_unavailable", message: "Trusted ingress client IP is unavailable." } }, { status: 503 });
  try {
    const response = await fetch(origin + "/api/v1/security/rate-limit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SalesX-BFF-Secret": secret,
        "X-Rate-Limit-IP": clientIp,
      },
      body: JSON.stringify({ action, identifier: identifier?.trim().slice(0, 320) || null }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) return null;
    const body = await response.text();
    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json",
        ...(response.headers.get("retry-after") ? { "Retry-After": response.headers.get("retry-after")! } : {}),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json({ error: { code: "rate_limit_store_unavailable", message: "The distributed security rate-limit store is unavailable." } }, { status: 503 });
  }
}

export async function refreshAuthSession(request: NextRequest): Promise<SupabaseAuthSession | null> {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;
  const result = await supabaseAuthRequest<SupabaseAuthSession>("token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!result.ok || !result.data.access_token || !result.data.refresh_token) return null;
  return result.data;
}

export function safeSession(session: SupabaseAuthSession) {
  return {
    user: { id: session.user.id, email: session.user.email ?? null, phone: session.user.phone ?? null },
    expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in,
    expires_in: session.expires_in,
    token_type: session.token_type,
  };
}

export function authError(status: number, code: string, message: string, retryAfter?: string): Response {
  return Response.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "no-store", ...(retryAfter ? { "Retry-After": retryAfter } : {}) } },
  );
}
