import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "ful_hms_session";

/**
 * Cheap gate only: it checks that a session cookie exists so unauthenticated
 * traffic never reaches a portal route. The signature is verified server-side
 * in lib/auth.ts, which is where authorisation decisions are actually made.
 */
export default function proxy(request: NextRequest) {
  if (request.cookies.get(SESSION_COOKIE)) return NextResponse.next();

  const url = new URL("/login", request.url);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*", "/tracker/:path*", "/appointments/:path*", "/staff/:path*"],
};
