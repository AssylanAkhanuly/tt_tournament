import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token");
  const { pathname } = request.nextUrl;

  // Protect dashboard — redirect to /login if no cookie.
  // NOTE: we do NOT redirect /login → /dashboard based on cookie presence alone,
  // because an expired cookie would create an infinite redirect loop
  // (/dashboard → 401 → /login → /dashboard → ...).
  if (pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
