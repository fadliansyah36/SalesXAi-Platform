export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ status: "ok", service: "company-portal" }, {
    headers: { "Cache-Control": "no-store" }
  });
}
