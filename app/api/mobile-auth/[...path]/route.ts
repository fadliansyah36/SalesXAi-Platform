import { NextRequest, NextResponse } from "next/server";
import { authError, enforceBffRateLimit, publishableKey, subjectFromJwt, tokenFingerprint, supabaseUrl } from "@/lib/auth/web-session";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ path: string[] }> };

function classify(method: string, path: string, query: URLSearchParams, payload: Record<string, unknown>) {
  if (path === "auth/v1/token" && method === "POST") {
    const grant = query.get("grant_type");
    if (grant === "password") return { action: "login", identifier: String(payload.email ?? payload.phone ?? "") };
    if (grant === "refresh_token") return { action: "refresh", identifier: "" };
    if (grant === "pkce") return { action: "oauth_complete", identifier: "" };
  }
  if (path === "auth/v1/signup" && method === "POST") return { action: "signup", identifier: String(payload.email ?? "") };
  if (path === "auth/v1/otp" && method === "POST") return { action: "otp_send", identifier: String(payload.phone ?? payload.email ?? "") };
  if (path === "auth/v1/verify" && method === "POST") {
    return payload.type === "sms" || payload.type === "phone_change"
      ? { action: "otp_verify", identifier: String(payload.phone ?? "") }
      : { action: "email_verify", identifier: String(payload.token_hash ?? "") };
  }
  if (path === "auth/v1/recover" && method === "POST") return { action: "password_recovery", identifier: String(payload.email ?? "") };
  if (path === "auth/v1/authorize" && method === "GET") return { action: "oauth_start", identifier: query.get("provider") ?? "" };
  if (path === "auth/v1/user/identities/authorize" && method === "GET") return { action: "identity_link", identifier: query.get("provider") ?? "" };
  if (path === "auth/v1/logout" && method === "POST") return { action: "signout", identifier: "" };
  if (path === "auth/v1/user" && method === "PUT") return { action: "password_update", identifier: "" };
  if (path.startsWith("auth/v1/user/identities/") && method === "DELETE") return { action: "identity_link", identifier: path.split("/").at(-1) ?? "" };
  return null;
}

function allowed(method: string, path: string): boolean {
  if (path === "auth/v1/token") return method === "POST";
  if (path === "auth/v1/signup" || path === "auth/v1/otp" || path === "auth/v1/verify" || path === "auth/v1/recover" || path === "auth/v1/logout") return method === "POST";
  if (path === "auth/v1/authorize" || path === "auth/v1/user/identities/authorize") return method === "GET";
  if (path === "auth/v1/user") return ["GET", "PUT", "PATCH"].includes(method);
  if (/^auth\/v1\/user\/identities\/[0-9a-f-]{36}$/i.test(path)) return method === "DELETE";
  return false;
}

async function proxy(request: NextRequest, context: RouteContext): Promise<Response> {
  const { path: segments } = await context.params;
  const path = segments.join("/");
  if (!allowed(request.method, path)) return authError(404, "not_found", "Resource not found.");

  const payload = ["POST", "PUT", "PATCH"].includes(request.method)
    ? await request.clone().json().catch(() => ({})) as Record<string, unknown>
    : {};
  const rateRule = classify(request.method, path, request.nextUrl.searchParams, payload);
  if (rateRule) {
    const bearer = request.headers.get("authorization")?.replace(/^Bearer\\s+/i,"") ?? "";
    const identifier = rateRule.identifier
      || subjectFromJwt(bearer)
      || (rateRule.action === "refresh" ? tokenFingerprint(String(payload.refresh_token ?? "")) : undefined);
    const limited = await enforceBffRateLimit(request, rateRule.action, identifier);
    if (limited) return limited;
  }

  const key = publishableKey();
  if (!key) return authError(503, "auth_provider_not_configured", "SUPABASE_PUBLISHABLE_KEY is deployment-pending.");
  const headers = new Headers({
    apikey: key,
    "Content-Type": request.headers.get("content-type") ?? "application/json",
  });
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);
  const clientInfo = request.headers.get("x-client-info");
  if (clientInfo) headers.set("X-Client-Info", clientInfo);

  const body = ["POST", "PUT", "PATCH"].includes(request.method) ? await request.arrayBuffer() : undefined;
  let upstream: Response;
  try {
    upstream = await fetch(supabaseUrl() + "/" + path + request.nextUrl.search, {
      method: request.method,
      headers,
      ...(body ? { body } : {}),
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return authError(503, "auth_provider_unavailable", "Supabase Auth could not be reached.");
  }

  const responseHeaders = new Headers();
  for (const name of ["content-type", "location", "retry-after", "cache-control"]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  responseHeaders.set("Cache-Control", "no-store");
  return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
