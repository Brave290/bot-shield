import { NextResponse } from "next/server";

export function middleware(request: Request) {
  const pathname = new URL(request.url).pathname;
  const isPublicApi = pathname === "/api/challenge" || pathname === "/api/verify" || pathname === "/api/demo-keys" || pathname === "/api/my-ip";
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": isPublicApi ? "*" : (origin || ""),
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
    if (!isPublicApi && origin) response.headers.set("Vary", "Origin");
    return response;
  }
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (new URL(request.url).protocol === "https:") response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  if (isPublicApi) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
