#!/usr/bin/env bash
# ============================================================
# 🧪 Guião de Testes — Euromilhões (fluxo completo)
# Uso:  Substituir BASE_URL por http://localhost:3000 (local)
#       ou https://aldeiasgames.vercel.app (produção)
# ============================================================
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
echo "🔗 Base: $BASE_URL"
echo ""

# ─────────────────────────────────────────────────
# 1. Autenticação — Super Admin
# ─────────────────────────────────────────────────
echo "=== 1. Login Super Admin ==="
TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aldeias.pt","password":"123456"}' | jq -r '.token')
echo "Token: ${TOKEN:0:20}…"
echo ""

# ─────────────────────────────────────────────────
# 2. Criar jogo Euromilhões
# ─────────────────────────────────────────────────
echo "=== 2. Criar Jogo Euromilhões ==="
JOGO_ID=$(curl -s -X POST "$BASE_URL/api/jogos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Euromilhões Teste Automático",
    "tipo": "euromilhoes",
    "aldeiaId": "aldeia-vale-azenha",
    "preco": 2,
    "stockInicial": 10000,
    "configuracao": {
      "premioDescricao": "1.000€ em dinheiro",
      "premioValor": 1000,
      "permitirStripe": true
    }
  }' | jq -r '.data.id')
echo "JOGO_ID: $JOGO_ID"

# Verificar
curl -s "$BASE_URL/api/jogos/$JOGO_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '{tipo: .data.tipo, nome: .data.nome}'
echo ""

# ─────────────────────────────────────────────────
# 3. Criar grelha
# ─────────────────────────────────────────────────
echo "=== 3. Criar Grelha ==="
GREALHA_ID=$(curl -s -X POST "$BASE_URL/api/euromilhoes/grelhas" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"jogoId\": \"$JOGO_ID\",
    \"premioDescricao\": \"1.000€ em dinheiro\",
    \"premioValor\": 1000
  }" | jq -r '.data.id')
echo "GREALHA_ID: $GREALHA_ID"
echo ""

# ─────────────────────────────────────────────────
# 4. Participação — Jogador com saldo
# ─────────────────────────────────────────────────
echo "=== 4. Login Jogador ==="
TOKEN_JOG=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"jogador@gmail.com","password":"123456"}' | jq -r '.token')
echo "Token jogador: ${TOKEN_JOG:0:20}…"

echo ""
echo "=== 4a. Saldo antes ==="
curl -s "$BASE_URL/api/wallet" \
  -H "Authorization: Bearer $TOKEN_JOG" | jq '{saldo}'

echo ""
echo "=== 4b. Participar (5 números) ==="
PART_ID=$(curl -s -X POST "$BASE_URL/api/participacoes" \
  -H "Authorization: Bearer $TOKEN_JOG" \
  -H "Content-Type: application/json" \
  -d "{
    \"jogoId\": \"$JOGO_ID\",
    \"grelhaId\": \"$GREALHA_ID\",
    \"numerosSelecionados\": [7, 13, 21, 34, 42],
    \"quantidade\": 1,
    \"metodoPagamento\": \"saldo\",
    \"dadosCliente\": { \"nome\": \"Jogador Teste\" }
  }" | jq -r '.data.id // .id')
echo "Participação ID: $PART_ID"

echo ""
echo "=== 4c. Saldo depois (deve ter -2€) ==="
curl -s "$BASE_URL/api/wallet" \
  -H "Authorization: Bearer $TOKEN_JOG" | jq '{saldo}'
echo ""

# ─────────────────────────────────────────────────
# 5. Participação — Via Vendedor (anónimo)
# ─────────────────────────────────────────────────
echo "=== 5. Login Vendedor ==="
TOKEN_VEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"vendedor@gmail.com","password":"123456"}' | jq -r '.token')
echo "Token vendedor: ${TOKEN_VEN:0:20}…"

echo ""
echo "=== 5a. Vendedor regista anónimo ==="
PART_VEN_ID=$(curl -s -X POST "$BASE_URL/api/participacoes" \
  -H "Authorization: Bearer $TOKEN_VEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"jogoId\": \"$JOGO_ID\",
    \"grelhaId\": \"$GREALHA_ID\",
    \"numerosSelecionados\": [3, 9, 15, 28, 44],
    \"quantidade\": 1,
    \"metodoPagamento\": \"dinheiro\",
    \"dadosCliente\": {
      \"nome\": \"Anónimo da Rua\",
      \"telefone\": \"912345678\"
    }
  }" | jq -r '.data.id // .id')
echo "Participação vendedor ID: $PART_VEN_ID"
echo ""

# ─────────────────────────────────────────────────
# 6. Fechar grelha (admin)
# ─────────────────────────────────────────────────
echo "=== 6. Fechar Grelha ==="
curl -s -X PUT "$BASE_URL/api/euromilhoes/grelhas/$GREALHA_ID/fechar" \
  -H "Authorization: Bearer $TOKEN" | jq '{success: .success, estado: .data.estado}'
echo ""

# ─────────────────────────────────────────────────
# 7. Sortear (admin)
# ─────────────────────────────────────────────────
echo "=== 7. Sortear ==="
SORTEIO=$(curl -s -X PUT "$BASE_URL/api/euromilhoes/grelhas/$GREALHA_ID/sortear" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")
echo "$SORTEIO" | jq '{estado: .data.estado, numeroSorteado: .sorteio.numeroSorteado, isVendido: .sorteio.isVendido, vencedorId: .sorteio.vencedorId}'
echo ""

# ─────────────────────────────────────────────────
# 8. Verificar prémio
# ─────────────────────────────────────────────────
echo "=== 8. Saldo do vencedor (se houve vencedor) ==="
if echo "$SORTEIO" | jq -e '.sorteio.vencedorId' > /dev/null 2>&1; then
  echo "Houve vencedor! Saldo atual:"
  curl -s "$BASE_URL/api/wallet" \
    -H "Authorization: Bearer $TOKEN_JOG" | jq '{saldo}'

  echo ""
  echo "=== 8a. Transação do prémio ==="
  curl -s "$BASE_URL/api/wallet" \
    -H "Authorization: Bearer $TOKEN_JOG" | jq '.transacoes[] | select(.tipo == "premio_dinheiro")'
else
  echo "Nenhum vencedor desta vez (número não vendido)."
fi
echo ""

# ─────────────────────────────────────────────────
# 9. Cashbox do vendedor
# ─────────────────────────────────────────────────
echo "=== 9. Cashbox Vendedor (deve estar inalterada — sortear não mexe na cashbox) ==="
curl -s "$BASE_URL/api/vendedor/cashbox" \
  -H "Authorization: Bearer $TOKEN_VEN" | jq '.data'
echo ""

# ─────────────────────────────────────────────────
# 10. Verificar resultados finais
# ─────────────────────────────────────────────────
echo "=== 10. Estado final da grelha ==="
curl -s "$BASE_URL/api/euromilhoes/grelhas?jogoId=$JOGO_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {id, estado, numeroSorteado, vencedorId}'
echo ""

echo "✅ Teste completo!"
