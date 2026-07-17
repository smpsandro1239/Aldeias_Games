/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // SWC crash on Windows with Node.js v24 — keep until Vercel (Linux) build is verified without it
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
          // CSP is now handled by src/middleware.ts with per-request nonces
        ],
      },
    ];
  },
};

module.exports = nextConfig;
