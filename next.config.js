/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // TODO: Remove once all TS errors are fixed — currently needed only on Windows (SWC crash with Node.js v24)
  // On Vercel (Linux) this can be removed after fixing type errors
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['@upstash/redis'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // NOTE: 'unsafe-inline' in script-src is required by Next.js for hydration scripts.
          // 'unsafe-eval' is intentionally NOT used (not needed by Next.js 16).
          // TODO: Migrate to nonce-based CSP using custom server or next-src nonce injection.
          { key: 'Content-Security-Policy', value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://js.stripe.com",
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
          ].join('; ') + ';' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
