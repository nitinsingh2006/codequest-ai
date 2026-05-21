import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "0",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Apply security headers to all responses
  const response = (() => {
    // Static/internal routes — pass through
    if (pathname.startsWith("/_next")) return NextResponse.next();

    // API routes — add security headers only
    if (pathname.startsWith("/api")) {
      const res = NextResponse.next();
      Object.entries(SECURITY_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const isAuthPage = pathname === "/login" || pathname === "/register";
    const isPublicPage = pathname === "/";

    // Redirect logged-in users away from auth pages
    if (isLoggedIn && isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }

    // Redirect unauthenticated users to login
    if (!isLoggedIn && !isAuthPage && !isPublicPage) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    return NextResponse.next();
  })();

  // Apply security headers to all non-redirect responses
  if (!response.headers.has("Location")) {
    Object.entries(SECURITY_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  }

  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
