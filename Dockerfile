# ============================================
# Build Stage
# ============================================
FROM oven/bun:1 AS builder

WORKDIR /app

# Copiar ficheiros de configuração
COPY package.json bun.lock* ./
COPY prisma ./prisma/

# Instalar dependências
RUN bun install --frozen-lockfile

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN bunx prisma generate

# Build da aplicação
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# ============================================
# Production Stage
# ============================================
FROM oven/bun:1-slim AS runner

WORKDIR /app

# Criar utilizador não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar ficheiros necessários
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Criar pasta uploads
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

# Mudar para utilizador não-root
USER nextjs

# Expor porta
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1))"

# Variáveis de ambiente
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando de inicialização
CMD ["bun", "server.js"]
