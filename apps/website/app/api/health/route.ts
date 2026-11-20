export const dynamic = "force-dynamic";

export async function GET() {
  const apiOrigin = (process.env.SALESX_API_URL ?? "").replace(/\/$/, "");
  if (!apiOrigin) {
    return Response.json({ status: "degraded", api: "not_configured" }, {
      status: 503,
      headers: { "Cache-Control": "no-store" }
    });
  }

  try {
    const response = await fetch(apiOrigin + "/readyz", {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) {
      return Response.json({ status: "degraded", api: "not_ready", api_status: response.status }, {
        status: 503,
        headers: { "Cache-Control": "no-store" }
      });
    }
    return Response.json({ status: "ok", api: "ready" }, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch {
    return Response.json({ status: "degraded", api: "unreachable" }, {
      status: 503,
      headers: { "Cache-Control": "no-store" }
    });
  }
}
