export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ status: "ok", service: "customer-portal" }, {
    headers: { "Cache-Control": "no-store" }
  });
}
