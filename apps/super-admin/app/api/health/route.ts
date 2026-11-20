export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ status: "ok", service: "super-admin" }, {
    headers: { "Cache-Control": "no-store" }
  });
}
