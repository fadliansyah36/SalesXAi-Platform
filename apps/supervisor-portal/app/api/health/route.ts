export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ status: "ok", service: "supervisor-portal" }, {
    headers: { "Cache-Control": "no-store" }
  });
}
