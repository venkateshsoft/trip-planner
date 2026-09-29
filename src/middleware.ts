import { NextResponse, type NextRequest } from "next/server";
import {
  apiRateLimiter,
  aiRateLimiter,
  distributedRateLimiter,
} from "@/server/security/rate-limit";
import { isAuthorized, unauthorizedResponse } from "@/server/auth";

function requestId(request: NextRequest) {
  const supplied = request.headers.get("x-request-id")?.slice(0, 80);
  return supplied && /^[A-Za-z0-9._-]+$/.test(supplied)
    ? supplied
    : crypto.randomUUID();
}

function clientKey(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function middleware(request: NextRequest) {
  const id = requestId(request);
  const headers = new Headers(request.headers);
  headers.set("x-request-id", id);
  const responseHeaders: Record<string, string> = {
    "x-request-id": id,
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    "content-security-policy":
      "default-src 'self'; img-src 'self' data: https:; connect-src 'self' https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  };
  const isApi = request.nextUrl.pathname.startsWith("/api/");
  const isHealth = request.nextUrl.pathname === "/api/health";
  const isReady = request.nextUrl.pathname === "/api/ready";
  const isLogin = request.nextUrl.pathname === "/api/auth/login";
  if (isApi && !isHealth && !isReady && !isLogin && !isAuthorized(request)) {
    const response = unauthorizedResponse();
    Object.entries(responseHeaders).forEach(([key, value]) =>
      response.headers.set(key, value),
    );
    response.headers.set("x-request-id", id);
    return response;
  }
  if (isApi && !isHealth) {
    const isAI = request.nextUrl.pathname.startsWith("/api/ai/");
    const localLimiter = isAI ? aiRateLimiter : apiRateLimiter;
    const distributedLimiter = distributedRateLimiter(isAI ? "ai" : "api");
    if (process.env.NODE_ENV === "production" && !distributedLimiter) {
      return NextResponse.json(
        { error: "Distributed rate limiting is not configured" },
        { status: 503, headers: responseHeaders },
      );
    }
    let result;
    try {
      result = await (distributedLimiter ?? localLimiter).check(
        `${request.nextUrl.pathname}:${clientKey(request)}`,
      );
    } catch {
      return NextResponse.json(
        { error: "Rate-limit service unavailable" },
        { status: 503, headers: responseHeaders },
      );
    }
    if (!result.allowed) {
      const response = NextResponse.json(
        { error: "Rate limit exceeded", requestId: id },
        {
          status: 429,
          headers: {
            ...responseHeaders,
            "retry-after": String(result.retryAfterSeconds),
          },
        },
      );
      return response;
    }
    responseHeaders["x-ratelimit-remaining"] = String(result.remaining);
  }
  console.info(
    JSON.stringify({
      event: "http.request",
      requestId: id,
      method: request.method,
      path: request.nextUrl.pathname,
    }),
  );
  const response = NextResponse.next({ request: { headers } });
  Object.entries(responseHeaders).forEach(([key, value]) =>
    response.headers.set(key, value),
  );
  if (process.env.NODE_ENV === "production")
    response.headers.set(
      "strict-transport-security",
      "max-age=31536000; includeSubDomains",
    );
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

