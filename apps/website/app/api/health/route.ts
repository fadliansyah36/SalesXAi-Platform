export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

async function checkPortalRuntime() {
  const apiOrigin = (process.env.SALESX_API_URL ?? "").replace(/\/$/, "");
  const appOrigin = (process.env.APP_PUBLIC_URL ?? "").replace(/\/$/, "");
  const port = process.env.PORT ?? "3000";
  if (!apiOrigin || !appOrigin) {
    return { ok: false, reason: "origin_not_configured" as const };
  }

  try {
    const parsedOrigin = new URL(appOrigin);
    if (parsedOrigin.origin !== appOrigin || parsedOrigin.protocol !== "https:") {
      return { ok: false, reason: "invalid_portal_origin" as const };
    }

    const [api, preflight, csrf, session] = await Promise.all([
      fetch(apiOrigin + "/readyz", {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      }),
      fetch(apiOrigin + "/api/v1/auth/me", {
        method: "OPTIONS",
        headers: {
          Origin: appOrigin,
          "Access-Control-Request-Method": "GET",
          "Access-Control-Request-Headers": "authorization,content-type",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      }),
      fetch(`http://127.0.0.1:${port}/api/auth/csrf`, {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      }),
      fetch(`http://127.0.0.1:${port}/api/auth/session`, {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      }),
    ]);

    const corsReady =
      preflight.ok &&
      preflight.headers.get("access-control-allow-origin") === appOrigin &&
      preflight.headers.get("access-control-allow-credentials") === "true";
    const bffReady = csrf.ok && session.ok;
    return {
      ok: api.ok && corsReady && bffReady,
      reason: api.ok ? (corsReady ? (bffReady ? "ready" as const : "auth_bff_unavailable" as const) : "cors_preflight_rejected" as const) : "api_unavailable" as const,
    };
  } catch {
    return { ok: false, reason: "connectivity_check_failed" as const };
  }
}

export async function GET() {
  const result = await checkPortalRuntime();
  return Response.json(
    result.ok
      ? { status: "ok", api: "ready", cors: "exact_origin_credentialed", auth_bff: "ready" }
      : { status: "degraded", reason: result.reason },
    { status: result.ok ? 200 : 503, headers: noStore },
  );
}
