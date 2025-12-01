import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Rate Limiting Utility
 *
 * Simple in-memory rate limiter for API routes.
 * For production with multiple instances, consider using Redis.
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// Note: This resets on server restart and doesn't work across instances
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get client identifier from request
 */
function getClientId(request: NextRequest): string {
  // Try to get real IP from headers (for proxied requests)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to a constant for local development
  return "127.0.0.1";
}

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 100 }
): { allowed: boolean; remaining: number; resetTime: number } {
  cleanupExpiredEntries();

  const clientId = getClientId(request);
  const key = `${clientId}:${request.nextUrl.pathname}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  // No existing entry or window has expired
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Window still active
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limit response with proper headers
 */
export function rateLimitResponse(resetTime: number): NextResponse {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

  return NextResponse.json(
    {
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again later.",
      },
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(resetTime),
      },
    }
  );
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  resetTime: number
): NextResponse {
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(resetTime));
  return response;
}

// Preset configurations for different route types
export const RateLimitPresets = {
  // Standard API routes
  api: { windowMs: 60 * 1000, maxRequests: 100 },

  // Auth routes (stricter)
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },

  // HubSpot sync (expensive operations)
  sync: { windowMs: 60 * 1000, maxRequests: 5 },

  // Sensitive operations
  sensitive: { windowMs: 60 * 1000, maxRequests: 10 },
} as const;

/**
 * Higher-order function to wrap API handlers with rate limiting
 */
export function withRateLimit(
  config: RateLimitConfig = RateLimitPresets.api
) {
  return function <T extends (...args: [NextRequest, ...unknown[]]) => Promise<NextResponse>>(
    handler: T
  ): T {
    return (async (request: NextRequest, ...args: unknown[]) => {
      const { allowed, remaining, resetTime } = checkRateLimit(request, config);

      if (!allowed) {
        return rateLimitResponse(resetTime);
      }

      const response = await handler(request, ...args);
      return addRateLimitHeaders(response, remaining, resetTime);
    }) as T;
  };
}
