import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE, EXPIRY_COOKIE, appOrigin, authError, authorizeBffRefresh, clearSessionCookies, csrfIsValid,
  enforceBffRateLimit, refreshAuthSession, setSessionCookies, tokenFingerprint, type SupabaseAuthSession,
} from "@/lib/auth/web-session";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ path: string[] }> };

const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "PUT", "DELETE"]);

async function proxy(request: NextRequest, context: RouteContext): Promise<Response> {
  if (!ALLOWED_METHODS.has(request.method)) return authError(405, "method_not_allowed", "Method not allowed.");
  const { path } = await context.params;
  if (!path.length || path.some(segment => segment === "." || segment === ".." || segment.includes("\\"))) {
    return authError(400, "invalid_api_path", "The API path is invalid.");
  }
  const apiOrigin = (process.env.SALESX_API_URL ?? "").replace(/\/$/, "");
  if (!apiOrigin) return authError(503, "api_not_configured", "SALESX_API_URL is deployment-pending.");
  const apiPath = "/" + path.map(segment => encodeURIComponent(segment)).join("/");
  if (!apiPath.startsWith("/api/v1/")) return authError(404, "not_found", "Resource not found.");
  const mutating = !["GET", "HEAD"].includes(request.method);
  if (mutating) {
    try { appOrigin(request); } catch {
      return authError(503,"app_origin_not_configured","APP_PUBLIC_URL is deployment-pending.");
    }
    if (!csrfIsValid(request)) return authError(403, "csrf_validation_failed", "The request origin or CSRF token is invalid.");
  }

  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value ?? "";
  const expiry = Number(request.cookies.get(EXPIRY_COOKIE)?.value ?? 0);
  let refreshed: SupabaseAuthSession | null = null;
  if (!accessToken || expiry <= Math.floor(Date.now() / 1000) + 45) {
    const limited = await enforceBffRateLimit(request, "refresh", tokenFingerprint(request.cookies.get("salesx_refresh")?.value ?? ""));
    if (limited) return limited;
    const authorized = await authorizeBffRefresh(accessToken);
    if (authorized) {
      const response = new NextResponse(authorized.body, { status: authorized.status, headers: authorized.headers });
      if (authorized.status === 401 || authorized.status === 403) clearSessionCookies(response);
      return response;
    }
    refreshed = await refreshAuthSession(request);
    if (!refreshed) {
      const response = NextResponse.json({ error: { code: "unauthenticated", message: "An authenticated session is required." } }, { status: 401, headers: { "Cache-Control": "no-store" } });
      clearSessionCookies(response);
      return response;
    }
    accessToken = refreshed.access_token;
  }

  const forward = async (token: string) => {
    const headers = new Headers();
    headers.set("Authorization", "Bearer " + token);
    headers.set("X-Client-Platform", "web");
    for (const name of ["content-type", "x-organization-id", "x-resource-branch-id", "x-correlation-id", "idempotency-key"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    return fetch(apiOrigin + apiPath + request.nextUrl.search, {
      method: request.method,
      headers,
      ...(mutating ? { body: await request.arrayBuffer() } : {}),
      cache: "no-store",
      redirect: "manual",
    });
  };

  let upstream = await forward(accessToken);
  let body = await upstream.clone().json().catch(() => ({})) as { error?: { code?: string } };
  const terminalCodes = ["session_revoked", "account_inactive", "identity_unverified"];
  if (upstream.status === 401 && !terminalCodes.includes(body.error?.code ?? "") && !refreshed) {
    const limited = await enforceBffRateLimit(request, "refresh", tokenFingerprint(request.cookies.get("salesx_refresh")?.value ?? ""));
    if (limited) return limited;
    const authorized = await authorizeBffRefresh(accessToken);
    if (authorized) {
      const response = new NextResponse(authorized.body, { status: authorized.status, headers: authorized.headers });
      clearSessionCookies(response);
      return response;
    }
    refreshed = await refreshAuthSession(request);
    if (refreshed) {
      accessToken = refreshed.access_token;
      upstream = await forward(accessToken);
      body = await upstream.clone().json().catch(() => ({})) as { error?: { code?: string } };
    }
  }

  const responseHeaders = new Headers();
  for (const name of ["content-type", "x-correlation-id", "retry-after"]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  responseHeaders.set("Cache-Control", "no-store");
  const response = new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
  if (refreshed) setSessionCookies(response, refreshed);
  if (upstream.status === 401 && (terminalCodes.includes(body.error?.code ?? "") || body.error?.code === "unauthorized" || body.error?.code === "session_not_found")) {
    clearSessionCookies(response);
  }
  return response;
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
