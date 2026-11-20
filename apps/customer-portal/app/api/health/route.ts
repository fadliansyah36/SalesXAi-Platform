export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
let sessionProbeAt = 0;
let sessionProbe: Promise<boolean> | null = null;

async function probeSession(port: string): Promise<boolean> {
  const now = Date.now();
  if (sessionProbe && now - sessionProbeAt < 60_000) return sessionProbe;
  sessionProbeAt = now;
  sessionProbe = fetch(`http://127.0.0.1:${port}/api/auth/session`, {
    method: "GET",
    headers: { "x-real-ip": "127.0.0.1" },
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  }).then((response) => response.ok || response.status === 401).catch(() => false);
  const ready = await sessionProbe;
  if (!ready) sessionProbe = null;
  return ready;
}

async function checkPortalRuntime() {
  const apiOrigin = (process.env.SALESX_API_URL ?? "").replace(/\/$/, "");
  const appOrigin = (process.env.APP_PUBLIC_URL ?? "").replace(/\/$/, "");
  const port = process.env.PORT ?? "3000";
  if (!apiOrigin || !appOrigin) return { ok: false, reason: "origin_not_configured" as const };

  try {
    const parsedOrigin = new URL(appOrigin);
    if (parsedOrigin.origin !== appOrigin || parsedOrigin.protocol !== "https:") {
      return { ok: false, reason: "invalid_portal_origin" as const };
    }

    const [api, preflight, csrf, sessionReady] = await Promise.all([
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
      probeSession(port),
    ]);

    const corsReady =
      preflight.ok &&
      preflight.headers.get("access-control-allow-origin") === appOrigin &&
      preflight.headers.get("access-control-allow-credentials") === "true";
    const bffReady = csrf.ok && sessionReady;
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
