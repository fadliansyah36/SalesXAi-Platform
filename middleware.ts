import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const hasSession = Boolean(
    request.cookies.get("salesx_access")?.value ||
    request.cookies.get("salesx_refresh")?.value,
  );
  if (hasSession) return NextResponse.next();
  const destination = new URL("/portal", request.url);
  destination.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(destination);
}

export const config = {
  matcher: ["/portal/access/:path*"],
};
