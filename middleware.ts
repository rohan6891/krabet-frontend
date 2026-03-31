import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "krabets_auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const hasAuthCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value === "1";

  if (hasAuthCookie) {
    return NextResponse.next();
  }

  const authUrl = new URL("/auth", request.url);
  return NextResponse.redirect(authUrl);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
