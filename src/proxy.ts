import { NextRequest, NextResponse } from "next/server";
import { validateSession, hasUsers, COOKIE_NAME } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/login",
  "/setup",
  "/api/auth/",
  "/_next/",
  "/favicon.ico",
  "/icon.svg",
  "/icons/",
  "/manifest.json",
  "/sw.js",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (!hasUsers()) {
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  const sessionCookie = request.cookies.get(COOKIE_NAME);
  const user = sessionCookie?.value
    ? validateSession(sessionCookie.value)
    : null;

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|icons/|manifest.json|sw.js).*)",
  ],
};
