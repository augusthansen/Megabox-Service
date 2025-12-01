import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production"
);

const COOKIE_NAME = "megabox-session";

// Routes that require authentication
const protectedRoutes = ["/admin"];

// Routes that should redirect to admin if already logged in
const authRoutes = ["/login"];

// Public routes that don't need any checks
const publicRoutes = ["/api/login", "/api/auth/session"];

// Rate limiting configuration
// Note: In edge runtime, we use a simple sliding window approach
// For production with multiple instances, use Redis or similar
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // requests per window
const AUTH_RATE_LIMIT_MAX = 5; // stricter for auth routes

// In-memory rate limit store (resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(request: NextRequest): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
             request.headers.get("x-real-ip") ||
             "127.0.0.1";
  return `${ip}:${request.nextUrl.pathname}`;
}

function checkRateLimit(request: NextRequest, maxRequests: number): boolean {
  const key = getRateLimitKey(request);
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  // Clean up expired entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetTime < now) rateLimitMap.delete(k);
    }
  }

  if (!entry || entry.resetTime < now) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply stricter rate limiting for auth-related API routes
  if (pathname === "/api/login") {
    if (!checkRateLimit(request, AUTH_RATE_LIMIT_MAX)) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many login attempts. Please try again later." } },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  // Apply general rate limiting for all API routes
  if (pathname.startsWith("/api/")) {
    if (!checkRateLimit(request, RATE_LIMIT_MAX)) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  // Skip auth checks for public API routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Get the session token
  const token = request.cookies.get(COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch {
      // Token is invalid or expired
      isAuthenticated = false;
    }
  }

  // Check if accessing protected routes
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if accessing auth routes (login)
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect to login if not authenticated and accessing protected route
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to admin if authenticated and accessing auth routes
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
