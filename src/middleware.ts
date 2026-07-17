import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { proxy, config as proxyConfig } from "./proxy";

// Nonce generation for CSP — per-request, cryptographically random
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

// CSP header with nonce-based script-src (style-src keeps unsafe-inline for Radix/Tailwind)
function buildCspHeader(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://js.stripe.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://fonts.gstatic.com https://www.google.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com https://worldtimeapi.org https://www.googleapis.com https://appleid.apple.com https://api.mbway.pt https://euromillions-api.vercel.app https://api.fugete.com",
    "frame-src 'self' https://js.stripe.com",
    "worker-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export async function middleware(request: NextRequest) {
  // Generate nonce for this request
  const nonce = generateNonce();

  // Run existing proxy logic (rate limiting, auth, CORS, etc.)
  const proxyResponse = await proxy(request);

  // If proxy returned a redirect/error, use it as-is (add nonce header anyway)
  const response = NextResponse.json?.(null) !== undefined
    ? proxyResponse
    : proxyResponse;

  // Clone response to modify headers (proxy responses may be immutable)
  const finalResponse = new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  });

  // Set CSP header with nonce
  finalResponse.headers.set("Content-Security-Policy", buildCspHeader(nonce));

  // Pass nonce to Server Components via header (read in layout.tsx)
  finalResponse.headers.set("x-nonce", nonce);

  return finalResponse;
}

// Merge matcher from proxy config
export const config = proxyConfig;
