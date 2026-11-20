export const dynamic = "force-dynamic";
const service = "company-portal";
export async function GET() {
  const apiOrigin = (process.env.SALESX_API_URL ?? "").replace(/\/$/, "");
  if (!apiOrigin) {
    return Response.json({ status: "degraded", service, dependency: "salesx-api", reason: "api_not_configured" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const response = await fetch(apiOrigin + "/readyz", { method: "GET", cache: "no-store", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      return Response.json({ status: "degraded", service, dependency: "salesx-api", api_status: response.status }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    return Response.json({ status: "ok", service, dependencies: { salesxApi: "ready" } }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "degraded", service, dependency: "salesx-api", reason: "api_unreachable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
