// next.config.ts
import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

// Função para obter __dirname de forma segura em ESM
function getDirname() {
  const __filename = fileURLToPath(import.meta.url);
  return path.dirname(__filename);
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",

  // Usa a função para evitar executar import.meta.url no topo
  outputFileTracingRoot: getDirname(),

  images: {
    unoptimized: true,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ];
  },
};

export default nextConfig;