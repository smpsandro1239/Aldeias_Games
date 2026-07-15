#!/bin/bash
# ============================================================
# Upstash Redis — Configuração na Vercel
# Aldeias Games v3.12.0
# ============================================================
#
# PREREQUISITOS:
#   - Conta Upstash (https://upstash.com)
#   - Projeto Vercel com Acesso CLI (vercel login)
#
# USO:
#   chmod +x scripts/setup-upstash-vercel.sh
#   ./scripts/setup-upstash-vercel.sh
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  Upstash Redis — Setup Vercel${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# ---- STEP 1: Verificar se Vercel CLI está instalado ----
echo -e "${YELLOW}[1/6] A verificar Vercel CLI...${NC}"
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Vercel CLI não encontrado. Instalar com:${NC}"
    echo "  npm i -g vercel"
    exit 1
fi
echo -e "${GREEN}  ✓ Vercel CLI encontrado: $(vercel --version)${NC}"

# ---- STEP 2: Verificar login ----
echo -e "${YELLOW}[2/6] A verificar autenticação Vercel...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${RED}Não autenticado. Executar:${NC}"
    echo "  vercel login"
    exit 1
fi
echo -e "${GREEN}  ✓ Autenticado como: $(vercel whoami)${NC}"

# ---- STEP 3: Pedir credenciais Upstash ----
echo -e "${YELLOW}[3/6] Credenciais Upstash Redis${NC}"
echo ""
echo -e "  Para obter estas credenciais:"
echo -e "  1. Aceder a ${CYAN}https://upstash.com${NC}"
echo -e "  2. Criar banco de dados Redis (Regional: Frankfurt ou mais próximo)"
echo -e "  3. Copiar REST URL e REST Token"
echo ""

if [ -z "${UPSTASH_REDIS_REST_URL:-}" ]; then
    echo -n "  UPSTASH_REDIS_REST_URL: "
    read -r UPSTASH_REDIS_REST_URL
fi

if [ -z "${UPSTASH_REDIS_REST_TOKEN:-}" ]; then
    echo -n "  UPSTASH_REDIS_REST_TOKEN: "
    read -r UPSTASH_REDIS_REST_TOKEN
fi

# Validar URL
if [[ ! "$UPSTASH_REDIS_REST_URL" =~ ^https:// ]]; then
    echo -e "${RED}  ✗ URL inválida. Deve começar com https://${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Credenciais recebidas${NC}"

# ---- STEP 4: Configurar variáveis de ambiente no Vercel ----
echo -e "${YELLOW}[4/6] A adicionar variáveis de ambiente no Vercel...${NC}"

vercel env add UPSTASH_REDIS_REST_URL production <<< "$UPSTASH_REDIS_REST_URL"
echo -e "${GREEN}  ✓ UPSTASH_REDIS_REST_URL adicionada${NC}"

vercel env add UPSTASH_REDIS_REST_TOKEN production <<< "$UPSTASH_REDIS_REST_TOKEN"
echo -e "${GREEN}  ✓ UPSTASH_REDIS_REST_TOKEN adicionada${NC}"

# ---- STEP 5: Verificar variáveis ----
echo -e "${YELLOW}[5/6] A verificar variáveis configuradas...${NC}"
vercel env ls 2>/dev/null | grep -E "UPSTASH" || echo "  (verificar manualmente no dashboard)"
echo -e "${GREEN}  ✓ Verificação concluída${NC}"

# ---- STEP 6: Instruções de deploy ----
echo -e "${YELLOW}[6/6] Próximos passos${NC}"
echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${GREEN}  ✓ Configuração Upstash Redis concluída!${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
echo -e "  Próximos passos:"
echo -e "  1. Fazer push para trigger deploy:"
echo -e "     ${CYAN}git push origin main${NC}"
echo ""
echo -e "  2. Verificar deploy no Vercel Dashboard"
echo ""
echo -e "  3. Testar rate limiting:"
echo -e "     ${CYAN}curl -I https://aldeiasgame.vercel.app/api/health${NC}"
echo -e "     (Procurar headers X-RateLimit-Limit e X-RateLimit-Remaining)"
echo ""
echo -e "  4. Testar com Upstash Console:"
echo -e "     ${CYAN}https://console.upstash.com/rateLimit${NC}"
echo ""
echo -e "  Configuração sem Redis (fallback in-memory):"
echo -e "  O rate limiting funciona em modo in-memory sem as variáveis."
echo -e "  Em serverless (Vercel), cada instância tem memória isolada,"
echo -e "  por isso o Redis é ESSENCIAL para proteção real em produção."
echo ""
