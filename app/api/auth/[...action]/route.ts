import { NextRequest, NextResponse } from "next/server";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import {
  ACCESS_COOKIE, REFRESH_COOKIE, EXPIRY_COOKIE, CSRF_COOKIE,
  OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, OAUTH_FLOW_COOKIE, OAUTH_USER_COOKIE, OAUTH_CREATED_COOKIE,
  apiUrl, appOrigin, authError, authorizeBffRefresh, clearOAuthCookies, clearSessionCookies, csrfCookieOptions, csrfIsValid,
  enforceBffRateLimit, pkceChallenge, randomToken, refreshAuthSession, safeSession,
  setCsrfCookie, setSessionCookies, subjectFromJwt, tokenFingerprint, supabaseAuthRequest, supabaseUrl, type SupabaseAuthSession,
} from "@/lib/auth/web-session";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ action: string[] }> };

function isSession(value: unknown): value is SupabaseAuthSession {
  return Boolean(value && typeof value === "object"
    && "access_token" in value && "refresh_token" in value && "user" in value);
}


type PortalHandoffTarget = { origin: string; path: string };
function portalHandoffTarget(portal: string): PortalHandoffTarget | null {
  const origin = (value: string | undefined, fallback: string) => {
    const candidate = (value?.trim() || fallback).replace(/\/$/, "");
    try { return new URL(candidate).origin; } catch { return ""; }
  };
  const website = origin(process.env.NEXT_PUBLIC_SALESX_WEBSITE_URL, "https://salesx-website-production.up.railway.app");
  const customer = origin(process.env.NEXT_PUBLIC_SALESX_CUSTOMER_URL, "https://salesx-customer-production.up.railway.app");
  const company = origin(process.env.NEXT_PUBLIC_SALESX_COMPANY_URL, "https://salesx-company-production.up.railway.app");
  const targets: Record<string, PortalHandoffTarget> = {
    sales: { origin: website, path: "/sales/portal" },
    customer: { origin: customer, path: "/" },
    company: { origin: company, path: "/" },
    distributor: { origin: company, path: "/distributor/portal" },
    principal: { origin: company, path: "/principal/portal" },
    supervisor: { origin: company, path: "/supervisor/portal" },
  };
  return targets[portal] ?? null;
}

function encryptPortalSession(value: Record<string, unknown>, secret: string): string {
  const key = createHash("sha256").update(secret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64url");
}

function decryptPortalSession(value: string, secret: string): Record<string, unknown> {
  const bytes = Buffer.from(value, "base64url");
  if (bytes.length < 29) throw new Error("Invalid portal handoff payload.");
  const key = createHash("sha256").update(secret).digest();
  const decipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  const plain = Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]);
  return JSON.parse(plain.toString("utf8")) as Record<string, unknown>;
}

function supabaseMessage(body: Record<string, unknown>): string {
  const value = body.message ?? body.msg ?? body.error_description;
  return typeof value === "string" ? value : "Supabase Auth request failed.";
}

async function userForAccessToken(accessToken: string) {
  return supabaseAuthRequest<{ id: string; email?: string; phone?: string }>("user", { method: "GET" }, accessToken);
}

function requestCsrf(request: NextRequest): boolean {
  return csrfIsValid(request);
}

function callbackNextPath(request: NextRequest, origin: string): string | null {
  const referer = request.headers.get("referer");
  if (!referer) return null;
  try {
    const source = new URL(referer);
    if (source.origin !== origin) return null;
    const pathname = source.pathname;
    const prefixes = ["/sales", "/distributor", "/principal", "/supervisor", "/admin"];
    const portalPrefix = prefixes.find((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
    if (portalPrefix) return portalPrefix;
    if (pathname === "/") return "/";
    if (pathname === "/portal" || pathname.startsWith("/portal/")) return "/portal";
    return "/";
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { action } = await context.params;
  const route = action.join("/");
  if (route === "csrf") {
    const token = request.cookies.get(CSRF_COOKIE)?.value || randomToken(32);
    const response = NextResponse.json({ csrfToken: token }, { headers: { "Cache-Control": "no-store" } });
    setCsrfCookie(response, token);
    return response;
  }
  if (route !== "session") return authError(404, "not_found", "Resource not found.");

  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value ?? "";
  const expiry = Number(request.cookies.get(EXPIRY_COOKIE)?.value ?? 0);
  let refreshed: SupabaseAuthSession | null = null;
  if (!accessToken || expiry <= Math.floor(Date.now() / 1000) + 45) {
    const limited = await enforceBffRateLimit(request, "refresh",
      tokenFingerprint(request.cookies.get(REFRESH_COOKIE)?.value ?? ""));
    if (limited) return limited;
    const authorized = await authorizeBffRefresh(accessToken);
    if (authorized) {
      const response = new NextResponse(authorized.body, { status: authorized.status, headers: authorized.headers });
      if (authorized.status === 401 || authorized.status === 403) clearSessionCookies(response);
      return response;
    }
    refreshed = await refreshAuthSession(request);
    if (!refreshed) {
      const response = NextResponse.json({ session: null }, { headers: { "Cache-Control": "no-store" } });
      clearSessionCookies(response);
      return response;
    }
    accessToken = refreshed.access_token;
  }
  const user = await userForAccessToken(accessToken);
  if (!user.ok) {
    if (!refreshed && (user.status === 401 || user.status === 403)) {
      const limited = await enforceBffRateLimit(request, "refresh", tokenFingerprint(request.cookies.get(REFRESH_COOKIE)?.value ?? ""));
      if (limited) return limited;
      const authorized = await authorizeBffRefresh(accessToken);
      if (authorized) {
        const response = new NextResponse(authorized.body, { status: authorized.status, headers: authorized.headers });
        clearSessionCookies(response);
        return response;
      }
      const retry = await refreshAuthSession(request);
      if (retry) {
        const verified = await userForAccessToken(retry.access_token);
        if (verified.ok) {
          const response = NextResponse.json({ session: safeSession({ ...retry, user: verified.data }) }, { headers: { "Cache-Control": "no-store" } });
          setSessionCookies(response, retry);
          return response;
        }
      }
    }
    const response = NextResponse.json({ session: null }, { headers: { "Cache-Control": "no-store" } });
    clearSessionCookies(response);
    return response;
  }
  const session = refreshed ?? {
    access_token: accessToken,
    refresh_token: request.cookies.get(REFRESH_COOKIE)?.value ?? "",
    token_type: "bearer",
    expires_in: Math.max(0, expiry - Math.floor(Date.now() / 1000)),
    expires_at: expiry,
    user: user.data,
  };
  const response = NextResponse.json({ session: safeSession({ ...session, user: user.data }) }, { headers: { "Cache-Control": "no-store" } });
  if (refreshed) setSessionCookies(response, refreshed);
  return response;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { action } = await context.params;
  const route = action.join("/");
  try { appOrigin(request); } catch {
    return authError(503,"app_origin_not_configured","APP_PUBLIC_URL is deployment-pending.");
  }
  if (!requestCsrf(request)) return authError(403, "csrf_validation_failed", "The request origin or CSRF token is invalid.");
  const payload = await request.json().catch(() => ({})) as Record<string, unknown>;
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value ?? "";


  if (route === "portal-handoff") {
    const targetPortal = String(payload.target_portal ?? "");
    const target = portalHandoffTarget(targetPortal);
    const secret = process.env.SALESX_BFF_SHARED_SECRET ?? "";
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value ?? "";
    if (!target || !target.origin || !accessToken || !refreshToken || secret.length < 32) {
      return authError(400, "portal_handoff_unavailable", "The requested portal handoff is not available.");
    }
    const limited = await enforceBffRateLimit(request, "portal_handoff", targetPortal);
    if (limited) return limited;
    const origin = apiUrl();
    if (!origin) return authError(503, "api_not_configured", "SALESX_API_URL is deployment-pending.");
    const code = randomToken(32);
    const expiry = Math.floor(Date.now() / 1000) + 60;
    const encryptedSession = encryptPortalSession({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "bearer",
      expires_at: Number(request.cookies.get(EXPIRY_COOKIE)?.value ?? expiry),
      user_id: subjectFromJwt(accessToken) ?? "",
      target_origin: target.origin,
      expires_at_ticket: expiry,
    }, secret);
    try {
      const created = await fetch(origin + "/api/v1/auth/portal-handoffs", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json",
          "X-Client-Platform": "web",
          "X-SalesX-BFF-Secret": secret,
        },
        body: JSON.stringify({
          token: code,
          encrypted_session: encryptedSession,
          target_portal: targetPortal,
          target_origin: target.origin,
          expires_at: new Date(expiry * 1000).toISOString(),
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (!created.ok) return authError(created.status, "portal_handoff_create_failed", "The destination portal session could not be prepared.");
    } catch {
      return authError(503, "portal_handoff_unavailable", "The portal handoff service is temporarily unavailable.");
    }
    const destination = new URL(target.path, target.origin);
    destination.searchParams.set("portal_handoff", code);
    return NextResponse.json({ target_url: destination.toString() }, { headers: { "Cache-Control": "no-store" } });
  }

  if (route === "portal-handoff-exchange") {
    const code = String(payload.code ?? "");
    const secret = process.env.SALESX_BFF_SHARED_SECRET ?? "";
    const targetOrigin = appOrigin(request);
    const origin = apiUrl();
    if (code.length < 32 || secret.length < 32 || !origin) {
      return authError(400, "portal_handoff_invalid", "The portal handoff ticket is invalid.");
    }
    const limited = await enforceBffRateLimit(request, "portal_handoff_exchange", tokenFingerprint(code));
    if (limited) return limited;
    try {
      const exchanged = await fetch(origin + "/api/v1/auth/portal-handoffs/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-SalesX-BFF-Secret": secret },
        body: JSON.stringify({ token: code, target_origin: targetOrigin }),
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (!exchanged.ok) return authError(exchanged.status, "portal_handoff_exchange_failed", "The portal handoff ticket is invalid, expired or already used.");
      const body = await exchanged.json() as { encrypted_session?: string };
      if (!body.encrypted_session) return authError(502, "portal_handoff_exchange_failed", "The handoff service returned no session.");
      const session = decryptPortalSession(body.encrypted_session, secret);
      const access = String(session.access_token ?? "");
      const refresh = String(session.refresh_token ?? "");
      const expiresAt = Number(session.expires_at ?? 0);
      const ticketExpiry = Number(session.expires_at_ticket ?? 0);
      const userId = String(session.user_id ?? "");
      if (!access || !refresh || !userId || userId !== subjectFromJwt(access)
        || session.target_origin !== targetOrigin || ticketExpiry <= Math.floor(Date.now() / 1000)) {
        return authError(401, "portal_handoff_session_invalid", "The handoff session could not be verified.");
      }
      const verified = await userForAccessToken(access);
      if (!verified.ok || verified.data.id !== userId) return authError(401, "portal_handoff_session_invalid", "The transferred session is no longer valid.");
      const expiresIn = Math.max(60, expiresAt - Math.floor(Date.now() / 1000));
      const sessionValue: SupabaseAuthSession = {
        access_token: access,
        refresh_token: refresh,
        token_type: "bearer",
        expires_in: expiresIn,
        expires_at: expiresAt,
        user: verified.data,
      };
      const response = NextResponse.json({ accepted: true }, { headers: { "Cache-Control": "no-store" } });
      setSessionCookies(response, sessionValue);
      return response;
    } catch {
      return authError(401, "portal_handoff_session_invalid", "The handoff session could not be decrypted or verified.");
    }
  }

  if (route === "sign-in") {
    const identifier = String(payload.identifier ?? payload.email ?? payload.phone ?? "").trim();
    const password = String(payload.password ?? "");
    if (!identifier || password.length < 1) return authError(400, "invalid_credentials", "Identifier and password are required.");
    const limited = await enforceBffRateLimit(request, "login", identifier);
    if (limited) return limited;
    const credentials = identifier.includes("@") ? { email: identifier } : { phone: identifier };
    const result = await supabaseAuthRequest<SupabaseAuthSession>("token?grant_type=password", {
      method: "POST", body: JSON.stringify({ ...credentials, password }),
    });
    if (!result.ok) return authError(result.status, "authentication_failed", supabaseMessage(result.body));
    const response = NextResponse.json({ session: safeSession(result.data) }, { headers: { "Cache-Control": "no-store" } });
    setSessionCookies(response, result.data);
    return response;
  }

  if (route === "sign-up") {
    const email = String(payload.email ?? "").trim().toLowerCase();
    const password = String(payload.password ?? "");
    if (!email || !email.includes("@") || password.length < 12) return authError(400, "invalid_signup", "A valid email and password of at least 12 characters are required.");
    const limited = await enforceBffRateLimit(request, "signup", email);
    if (limited) return limited;
    const origin = appOrigin(request);
    const callback = new URL(origin + "/auth/callback");
    const next = callbackNextPath(request, origin);
    if (next) callback.searchParams.set("next", next);
    const result = await supabaseAuthRequest<SupabaseAuthSession | { user: { id: string; email?: string } }>(
      "signup?redirect_to=" + encodeURIComponent(callback.toString()),
      { method: "POST", body: JSON.stringify({ email, password }) },
    );
    if (!result.ok) return authError(result.status, "signup_failed", supabaseMessage(result.body));
    if (isSession(result.data)) {
      const response = NextResponse.json({ session: safeSession(result.data), verification_required: false }, { headers: { "Cache-Control": "no-store" } });
      setSessionCookies(response, result.data);
      return response;
    }
    return NextResponse.json({ session: null, verification_required: true }, { headers: { "Cache-Control": "no-store" } });
  }

  if (route === "otp-send") {
    const phone = String(payload.phone ?? "").trim();
    if (!phone) return authError(400, "invalid_phone", "A phone number is required.");
    const limited = await enforceBffRateLimit(request, "otp_send", phone);
    if (limited) return limited;
    const result = await supabaseAuthRequest("otp", { method: "POST", body: JSON.stringify({ phone, create_user: false }) });
    if (!result.ok) return authError(result.status, "otp_send_failed", supabaseMessage(result.body));
    return NextResponse.json({ sent: true }, { headers: { "Cache-Control": "no-store" } });
  }

  if (route === "otp-verify") {
    const phone = String(payload.phone ?? "").trim();
    const token = String(payload.token ?? "").trim();
    if (!phone || !token) return authError(400, "invalid_otp", "Phone and OTP are required.");
    const limited = await enforceBffRateLimit(request, "otp_verify", phone);
    if (limited) return limited;
    const result = await supabaseAuthRequest<SupabaseAuthSession>("verify", {
      method: "POST", body: JSON.stringify({ phone, token, type: "sms" }),
    });
    if (!result.ok) return authError(result.status, "otp_verification_failed", supabaseMessage(result.body));
    const response = NextResponse.json({ session: safeSession(result.data) }, { headers: { "Cache-Control": "no-store" } });
    setSessionCookies(response, result.data);
    return response;
  }

  if (route === "verify") {
    const tokenHash = String(payload.token_hash ?? "");
    const type = String(payload.type ?? "signup");
    if (!tokenHash || !["signup", "invite", "magiclink", "recovery", "email_change"].includes(type)) return authError(400, "invalid_verification", "Verification token or type is invalid.");
    const limited = await enforceBffRateLimit(request, "email_verify", tokenHash);
    if (limited) return limited;
    const result = await supabaseAuthRequest<SupabaseAuthSession | { user: { id: string } }>("verify", {
      method: "POST", body: JSON.stringify({ token_hash: tokenHash, type }),
    });
    if (!result.ok) return authError(result.status, "verification_failed", supabaseMessage(result.body));
    if (isSession(result.data)) {
      const response = NextResponse.json({ session: safeSession(result.data) }, { headers: { "Cache-Control": "no-store" } });
      setSessionCookies(response, result.data);
      return response;
    }
    return NextResponse.json({ session: null }, { headers: { "Cache-Control": "no-store" } });
  }

  if (route === "recover") {
    const email = String(payload.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) return authError(400, "invalid_email", "A valid email address is required.");
    const limited = await enforceBffRateLimit(request, "password_recovery", email);
    if (limited) return limited;
    const origin = appOrigin(request);
    const callback = new URL(origin + "/auth/callback");
    callback.searchParams.set("flow", "recovery");
    const next = callbackNextPath(request, origin);
    if (next) callback.searchParams.set("next", next);
    const result = await supabaseAuthRequest("recover?redirect_to=" + encodeURIComponent(callback.toString()), {
      method: "POST", body: JSON.stringify({ email }),
    });
    if (!result.ok) return authError(result.status, "recovery_failed", "If the account is eligible, recovery instructions will be sent.");
    return NextResponse.json({ sent: true }, { headers: { "Cache-Control": "no-store" } });
  }

  if (route === "update-password") {
    if (!accessToken) return authError(401, "unauthenticated", "An authenticated session is required.");
    const password = String(payload.password ?? "");
    if (password.length < 12) return authError(400, "invalid_password", "Password must contain at least 12 characters.");
    const limited = await enforceBffRateLimit(request, "password_update", subjectFromJwt(accessToken));
    if (limited) return limited;
    const result = await supabaseAuthRequest("user", { method: "PUT", body: JSON.stringify({ password }) }, accessToken);
    if (!result.ok) return authError(result.status, "password_update_failed", supabaseMessage(result.body));
    return NextResponse.json({ updated: true }, { headers: { "Cache-Control": "no-store" } });
  }

  if (route === "oauth-start") {
    const provider = String(payload.provider ?? "google");
    const flow = payload.flow === "link" ? "link" : "signin";
    if (provider !== "google") return authError(400, "oauth_provider_not_allowed", "Only the configured Google provider is supported.");
    const limited = await enforceBffRateLimit(request, flow === "link" ? "identity_link" : "oauth_start", provider);
    if (limited) return limited;
    let userId = "";
    if (flow === "link") {
      if (!accessToken) return authError(401, "unauthenticated", "Sign in before linking an identity.");
      const user = await userForAccessToken(accessToken);
      if (!user.ok) return authError(401, "unauthenticated", "The current session is invalid.");
      userId = user.data.id;
    }
    const state = randomToken(32);
    const verifier = randomToken(48);
    const nonce = randomToken(32);
    const origin = appOrigin(request);
    const callback = new URL(origin + "/auth/callback");
    callback.searchParams.set("oauth_state", state);
    const next = callbackNextPath(request, origin);
    if (next) callback.searchParams.set("next", next);
    const query = new URLSearchParams({
      provider,
      nonce,
      redirect_to: callback.toString(),
      code_challenge: pkceChallenge(verifier),
      code_challenge_method: "s256",
    });
    let authorizationUrl = "";
    if (flow === "link") {
      const backend = apiUrl();
      if (!backend) return authError(503,"api_not_configured","SALESX_API_URL is deployment-pending.");
      const authorization = await fetch(backend + "/api/v1/auth/identities/link-authorize", {
        method:"POST",
        headers:{Authorization:"Bearer "+accessToken,"X-Client-Platform":"web"},
        cache:"no-store",
      });
      if (!authorization.ok) {
        const denied = await authorization.json().catch(()=>({}));
        return authError(authorization.status,denied?.error?.code??"identity_link_forbidden",
          denied?.error?.message??"Identity linking is not permitted for this account.");
      }
      query.set("skip_http_redirect", "true");
      const result = await supabaseAuthRequest<{ url: string }>("user/identities/authorize?" + query.toString(), { method: "GET" }, accessToken);
      if (!result.ok || typeof result.data.url !== "string") return authError(result.ok ? 502 : result.status, "identity_link_start_failed", result.ok ? "Supabase did not return an identity authorization URL." : supabaseMessage(result.body));
      authorizationUrl = result.data.url;
    } else {
      authorizationUrl = new URL(supabaseUrl() + "/auth/v1/authorize?" + query.toString()).toString();
    }
    const response = NextResponse.json({ authorization_url: authorizationUrl }, { headers: { "Cache-Control": "no-store" } });
    const options = { ...csrfCookieOptions(), sameSite: "lax" as const, maxAge: 600 };
    response.cookies.set(OAUTH_STATE_COOKIE, state, options);
    response.cookies.set(OAUTH_VERIFIER_COOKIE, verifier, options);
    response.cookies.set(OAUTH_FLOW_COOKIE, flow, options);
    response.cookies.set(OAUTH_USER_COOKIE, userId, options);
    response.cookies.set(OAUTH_CREATED_COOKIE, String(Date.now()), options);
    return response;
  }

  if (route === "oauth-complete") {
    const state = String(payload.state ?? "");
    const code = String(payload.code ?? "");
    const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value ?? "";
    const verifier = request.cookies.get(OAUTH_VERIFIER_COOKIE)?.value ?? "";
    const flow = request.cookies.get(OAUTH_FLOW_COOKIE)?.value ?? "signin";
    const originalUser = request.cookies.get(OAUTH_USER_COOKIE)?.value ?? "";
    const createdAt = Number(request.cookies.get(OAUTH_CREATED_COOKIE)?.value ?? 0);
    if (!state || !expectedState || state !== expectedState || !verifier || !createdAt || Date.now() - createdAt > 10 * 60 * 1000 || !code) {
      const response = NextResponse.json({ error: { code: "oauth_state_invalid", message: "OAuth state validation failed or expired." } }, { status: 400 });
      clearOAuthCookies(response);
      return response;
    }
    const limited = await enforceBffRateLimit(request, "oauth_complete", originalUser || "google");
    if (limited) return limited;
    const result = await supabaseAuthRequest<SupabaseAuthSession>("token?grant_type=pkce", {
      method: "POST", body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
    });
    if (!result.ok) {
      const response = NextResponse.json({ error: { code: "oauth_exchange_failed", message: supabaseMessage(result.body) } }, { status: result.status });
      clearOAuthCookies(response);
      return response;
    }
    if (flow === "link" && originalUser && result.data.user.id !== originalUser) {
      await supabaseAuthRequest("logout?scope=local", { method: "POST" }, result.data.access_token);
      const response = NextResponse.json({ error: { code: "identity_link_account_mismatch", message: "Linked identity did not resolve to the original account." } }, { status: 403 });
      clearOAuthCookies(response);
      return response;
    }
    const response = NextResponse.json({ session: safeSession(result.data) }, { headers: { "Cache-Control": "no-store" } });
    setSessionCookies(response, result.data);
    clearOAuthCookies(response);
    return response;
  }

  if (route === "oauth-error") {
    const state = String(payload.state ?? "");
    const expected = request.cookies.get(OAUTH_STATE_COOKIE)?.value ?? "";
    if (!state || !expected || state !== expected) return authError(400, "oauth_state_mismatch", "OAuth error callback state validation failed.");
    const response = NextResponse.json({ cancelled: true }, { headers: { "Cache-Control": "no-store" } });
    clearOAuthCookies(response);
    return response;
  }

  if (route === "sign-out") {
    const scope = payload.scope === "global" || payload.scope === "others" ? String(payload.scope) : "local";
    const limited = await enforceBffRateLimit(request, "signout", subjectFromJwt(accessToken));
    if (limited) return limited;
    if (accessToken) {
      const result = await supabaseAuthRequest("logout?scope=" + scope, { method: "POST" }, accessToken);
      if (!result.ok && scope !== "local") return authError(result.status, "signout_failed", supabaseMessage(result.body));
    }
    const response = NextResponse.json({ signed_out: true }, { headers: { "Cache-Control": "no-store" } });
    if (scope !== "others") clearSessionCookies(response);
    clearOAuthCookies(response);
    return response;
  }

  if (route === "refresh") {
    const limited = await enforceBffRateLimit(request, "refresh",
      tokenFingerprint(request.cookies.get(REFRESH_COOKIE)?.value ?? ""));
    if (limited) return limited;
    const authorized = await authorizeBffRefresh(request.cookies.get(ACCESS_COOKIE)?.value ?? "");
    if (authorized) {
      const response = new NextResponse(authorized.body, { status: authorized.status, headers: authorized.headers });
      clearSessionCookies(response);
      return response;
    }
    const refreshed = await refreshAuthSession(request);
    if (!refreshed) {
      const response = NextResponse.json({ session: null }, { status: 401, headers: { "Cache-Control": "no-store" } });
      clearSessionCookies(response);
      return response;
    }
    const response = NextResponse.json({ session: safeSession(refreshed) }, { headers: { "Cache-Control": "no-store" } });
    setSessionCookies(response, refreshed);
    return response;
  }

  return authError(404, "not_found", "Resource not found.");
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { action } = await context.params;
  if (action.join("/") !== "session") return authError(404, "not_found", "Resource not found.");
  try { appOrigin(request); } catch {
    return authError(503,"app_origin_not_configured","APP_PUBLIC_URL is deployment-pending.");
  }
  if (!requestCsrf(request)) return authError(403, "csrf_validation_failed", "The request origin or CSRF token is invalid.");
  const response = NextResponse.json({ cleared: true }, { headers: { "Cache-Control": "no-store" } });
  clearSessionCookies(response);
  clearOAuthCookies(response);
  return response;
}
