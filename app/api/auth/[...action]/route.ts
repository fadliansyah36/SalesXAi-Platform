import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE, REFRESH_COOKIE, EXPIRY_COOKIE, CSRF_COOKIE,
  OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, OAUTH_FLOW_COOKIE, OAUTH_USER_COOKIE, OAUTH_CREATED_COOKIE,
  appOrigin, authError, clearOAuthCookies, clearSessionCookies, csrfCookieOptions, csrfIsValid,
  enforceBffRateLimit, pkceChallenge, randomToken, refreshAuthSession, safeSession,
  setCsrfCookie, setSessionCookies, supabaseAuthRequest, type SupabaseAuthSession,
} from "@/lib/auth/web-session";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ action: string[] }> };

function isSession(value: unknown): value is SupabaseAuthSession {
  return Boolean(value && typeof value === "object"
    && "access_token" in value && "refresh_token" in value && "user" in value);
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

export async function GET(request: NextRequest, context: RouteContext) {
  const { action } = await context.params;
  const route = action.join("/");
  if (route === "csrf") {
    const token = randomToken(32);
    const response = NextResponse.json({ csrfToken: token }, { headers: { "Cache-Control": "no-store" } });
    setCsrfCookie(response, token);
    return response;
  }
  if (route !== "session") return authError(404, "not_found", "Resource not found.");

  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value ?? "";
  const expiry = Number(request.cookies.get(EXPIRY_COOKIE)?.value ?? 0);
  let refreshed: SupabaseAuthSession | null = null;
  if (!accessToken || expiry <= Math.floor(Date.now() / 1000) + 45) {
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
    if (user.status === 401 || user.status === 403) {
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
  if (!requestCsrf(request)) return authError(403, "csrf_validation_failed", "The request origin or CSRF token is invalid.");
  const payload = await request.json().catch(() => ({})) as Record<string, unknown>;
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value ?? "";

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
    const result = await supabaseAuthRequest<SupabaseAuthSession | { user: { id: string; email?: string } }>(
      "signup?redirect_to=" + encodeURIComponent(origin + "/auth/callback"),
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
    const result = await supabaseAuthRequest("recover?redirect_to=" + encodeURIComponent(origin + "/auth/callback?flow=recovery"), {
      method: "POST", body: JSON.stringify({ email }),
    });
    if (!result.ok) return authError(result.status, "recovery_failed", "If the account is eligible, recovery instructions will be sent.");
    return NextResponse.json({ sent: true }, { headers: { "Cache-Control": "no-store" } });
  }

  if (route === "update-password") {
    if (!accessToken) return authError(401, "unauthenticated", "An authenticated session is required.");
    const password = String(payload.password ?? "");
    if (password.length < 12) return authError(400, "invalid_password", "Password must contain at least 12 characters.");
    const limited = await enforceBffRateLimit(request, "password_update");
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
    const query = new URLSearchParams({
      provider,
      nonce,
      redirect_to: callback.toString(),
      code_challenge: pkceChallenge(verifier),
      code_challenge_method: "s256",
    });
    let authorizationUrl = "";
    if (flow === "link") {
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

  if (route === "refresh") {
    const limited = await enforceBffRateLimit(request, "refresh");
    if (limited) return limited;
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
  if (!requestCsrf(request)) return authError(403, "csrf_validation_failed", "The request origin or CSRF token is invalid.");
  const response = NextResponse.json({ cleared: true }, { headers: { "Cache-Control": "no-store" } });
  clearSessionCookies(response);
  clearOAuthCookies(response);
  return response;
}
