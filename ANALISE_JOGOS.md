# Análise dos Jogos — Aldeias_Games

> **Data:** 2026-07-16  
> **Objetivo:** Avaliar a lógica, mecânicas, integridade e consistência dos 4 jogos disponíveis.

---

## Resumo dos 4 Jogos

| Jogo | Tipo | Preço Base | Mecânica Principal | Premiação |
|------|------|------------|-------------------|-----------|
| **Euromilhões** | Números 1-50 | Configurável | Escolha 1-50 números, sorteio por grelha | Prémio definido por grelha |
| **Poio da Vaca** | Grade X×Y | Configurável (por quadrado) | Escolha quadrados, vaca "defeca" no vencedor | Vaca / valor dinheiro |
| **Raspadinha Premium** | 3×3 grid (9 slots) | Configurável | Raspar para revelar, 3 iguais = prémio | Por % configurável (provably fair) |
| **Rifa** | Números sequenciais | Configurável | Escolha números, sorteio único | Prémio único (geralmente alto) |

---

## 1. Euromilhões (`/src/app/jogos/euromilhoes/page.tsx`)

### Lógica do Jogo
- **Grid fixo:** 50 números (1–50)
- **Seleção:** 1 a 50 números por participação (limite `MAX_NUMEROS = 50`)
- **Grelhas:** Cada jogo pode ter múltiplas grelhas (sequenciais), cada uma com:
  - `estado`: "aberta" / "fechada" / "sorteada"
  - `numerosOcupados`: JSON array dos números já vendidos
  - `sorteioData`, `bloqueioData`: datas calculadas (próxima sexta-feira + bloqueio antes)
  - `premioDescricao`, `premioValor`: prémio dessa grelha específica

### Fluxo de Participação
1. **Fetch:** Busca jogo ativo (`/api/jogos?ativos=true&tipo=euromilhoes`) ou por ID
2. **Grelha:** Busca grelhas do jogo (`/api/euromilhoes/grelhas?jogoId=...`), seleciona a "aberta" mais recente
3. **Ocupados:** Merge de `grelha.numerosOcupados` + endpoint público `/api/jogos/[id]/numeros-ocupados`
4. **Seleção UI:** Grid 5×10, toggle por clique, botões aleatórios (1,2,3,4,5)
5. **Validação:** Nome obrigatório + telefone/email + ≥1 número
6. **Pagamento:** `dinheiro` (apenas vendedor/admin), `saldo`, `stripe`, `mbway`, `transferencia`
7. **Criação:** `POST /api/participacoes` com `dadosParticipacao: { numeros: [...] }`, `grelhaId`
8. **Confirmação:** Atualiza `numerosOcupados` localmente + refresh grelha

### Backend (Grelhas)
```typescript
// src/app/api/euromilhoes/grelhas/route.ts
// Criação automática: próxima grelha = primeiro número livre (gap filling)
// sorteioData = próxima sexta-feira (getNextFriday)
// bloqueioData = antes do sorteio (getBloqueioData)
```

### Pontos Fortes
✅ **Isolamento por grelha** — cada grelha é independente, permite jogos recorrentes semanais  
✅ **Race condition protection** — verifica ocupados no frontend + backend (transaction)  
✅ **Fallback robusto** — se jogo ID falha, cai para primeiro ativo do tipo  
✅ **Multi-pagamento** — suporta 5 métodos com regras por role  

### Riscos / Observações
⚠️ **Hardcoded 50 números** — `TOTAL_NUMEROS = 50` fixo no frontend; se backend mudar, quebra  
⚠️ **Grelha "aberta" única** — assume apenas uma aberta por vez; concorrência pode criar duas  
⚠️ **Sorteio externo** — `modoSorteio` pode ser "app" ou "externo"; lógica de sorteio não está no código visto  

---

## 2. Poio da Vaca (`/src/app/jogos/poio-da-vaca/page.tsx`)

### Lógica do Jogo
- **Campo configurável:** Dimensões X×Y (padrão 10×10 = 100 quadrados)
- **Coordenadas:** X (esq→dir) × Y (baixo→cima) — rótulo `X{x}Y{y}`
- **Seleção:** Quadrados individuais, múltiplos por participação
- **Vencedor:** "Vaca solta no campo — primeiro coco determina coordenada vencedora" (sorteio físico/local)

### Rentabilidade (Cálculo no Frontend + Frontend!)
```typescript
// calcularRentabilidade(custoQuadrado, valorMercadoVaca, valorCompraVaca, totalQuadrados)
receitaTotal = custoQuadrado * totalQuadrados
custoPremio = valorCompraVaca > 0 ? valorCompraVaca : valorMercadoVaca
lucro = receitaTotal - custoPremio
rentabilidade = (lucro / receitaTotal) * 100
```
**Status:** Excelente (≥50%), Bom (≥30%), Aceitável (≥10%), Baixo (≥0%), Negativo (<0%)

### Fluxo de Participação
1. **Fetch:** Jogo + Apostas (`/api/apostas?tipo=poio_da_vaca`) + Saldo carteira
2. **UI:** Grid responsivo mantendo aspect-ratio (CSS grid `repeat(X, 1fr)`)
3. **Seleção:** Click toggle, botões rápidos (+1, +3, +5, +10, +15, +20, +30)
4. **Validação:** Nome + (telefone/email se não vendedor) + ≥1 quadrado
5. **Pagamento:** Mesmo fluxo 5 métodos + regra `dinheiro` só vendedor/admin
6. **Criação:** `POST /api/apostas` com `numeros: [...]`, `jogador`, `vendedorId`, `pago`, `usarSaldo`
7. **Notificação:** WhatsApp/Email opcional com link `wa.me` ou `mailto:`

### Backend (Apostas)
```typescript
// src/app/api/apostas/route.ts
// Transaction atómica:
// 1. Verifica números ocupados (race condition)
// 2. Cria aposta com JSON.stringify(numeros)
// 3. Se usarSaldo: debita user + cashback 5%
// 4. Retorna 409 se números ocupados
```

### Pontos Fortes
✅ **Dimensões dinâmicas** — lidas do `jogo.dimensoesCampo` (JSON)  
✅ **Rentabilidade transparente** — admins veem análise completa (receita, custo real, lucro)  
✅ **Filtragem por role** — admin vê todas, vendedor vê suas vendas, user vê suas apostas  
✅ **Cashback 5% saldo** — incentiva uso de carteira digital  

### Riscos / Observações
⚠️ **Rentabilidade só no frontend** — cálculo crítico deveria ser validado no backend ao criar jogo  
⚠️ **Sorteio físico** — "vaca no campo" depende de processo externo não auditável pelo código  
⚠️ **Valores de vaca** — `valorMercadoVaca` (mostrado ao jogador) vs `valorCompraVaca` (custo real) — assimetria de informação  
⚠️ **`custoQuadrado` vs `preco`** — usa `custoQuadrado` se existir, senão `preco`; inconsistência potencial  

---

## 3. Raspadinha Premium (`/src/app/jogos/raspadinha-premium/page.tsx`)

### Lógica do Jogo (Provably Fair)
- **Grid:** 3×3 = 9 slots (fixo)
- **Prémios:** Configurados no jogo (`configuracao.premios[]` com `percentagem`)
- **Algoritmo:** `crypto.randomInt(0, 10000)` → roll 0–0.9999
- **Distribuição:** Acumula basis points (percentagem × 100) → primeiro que excede roll ganha
- **Grid construction:**
  - Se **ganha**: 3 slots do prémio vencedor + 6 filler (outros prémios, máx 2 iguais)
  - Se **perde**: distribuição aleatória, máx 2 por prémio
  - Shuffle Fisher-Yates no final

### Verificabilidade (Hash Commit-Reveal)
```typescript
// src/app/api/participacoes/_lib/raspadinha.ts
seedRaspe = crypto.randomBytes(32).toString('hex')      // seed do RNG
uniqueSalt = crypto.randomBytes(32).toString('hex')     // salt único
hashRaspe = sha256(`${seed}:${resultado}:${salt}:${timestamp}`)
```
- **Guardado na participação:** `seedRaspe`, `hashRaspe`, `resultadoRaspe`, `dadosParticipacao.grid`
- **Reveal:** Ao raspar ≥60% → auto-revela + verifica 3 iguais com valor > 0
- **Claim:** `POST /api/participacoes/[id]/claim-premio` credita valor na carteira

### Fluxo de Participação
1. **Fetch:** Jogo por ID + Saldo
2. **Fase "not_paid":** Botão "Participar por X€"
3. **Pagamento:** 5 métodos (mesma regra `dinheiro` só vendedor/admin)
4. **Criação:** `POST /api/participacoes` → handler `raspadinha` gera grid + hash
5. **Fase "paid":** 9 canvas rasparáveis (pointer events + canvas 2d `destination-out`)
6. **Raspar:** Track percentagem por slot via grid 6px cells
7. **Auto-reveal:** ≥60% → limpa canvas + verifica prémio
8. **Vitória:** 3 iguais com `valorDinheiroAlternative > 0` → confetti + `claimPremio`
9. **Todas reveladas:** Botão "Comprar Nova"

### Pontos Fortes
✅ **Provably Fair real** — commit-reveal com hash SHA256, seed + salt + timestamp  
✅ **Client-side scratching** — canvas nativo, fluido, sem round-trips  
✅ **Auto-claim** — detecta vitória e chama API automaticamente  
✅ **Persistência** — `sessionStorage` mantém estado se recarregar  
✅ **Sound hook** — `useScratchSound` para feedback áudio  

### Riscos / Observações
⚠️ **Grid fixo 9 slots** — hardcoded; não configurável via `configuracao`  
⚠️ **Lógica de vitória** — "3 iguais com valor > 0" assume estrutura de prémios específica  
⚠️ **Canvas cleanup** — `initializedRef` evita re-inicialização mas pode vazar refs se navegar fora  
⚠️ **`participacaoConfirmada` fluxo** — mostra tela genérica "Raspadinha Registada" sem mostrar grid; user tem que clicar "Tentar Novamente" para jogar  

---

## 4. Rifa (`/src/app/jogos/rifa/page.tsx`)

### Lógica do Jogo
- **Números:** Intervalo configurável `numeroInicial` a `numeroFinal` (ex: 1–1000)
- **Blocos:** `numeroBlocos` divide o intervalo (UI por abas)
- **Limite:** Máx 20 números por participação
- **Sorteio:** Único, data/hora/local configurados
- **Prémio:** Único (geralmente alto: "Vale 500€ + Cabaz")

### Fluxo de Participação
1. **Fetch:** Jogo + configuração (parse JSON `configuracao`) + Ocupados + Saldo
2. **Blocos:** Calcula números por bloco → UI tabs "Bloco 1", "Bloco 2"...
3. **Seleção:** Grid 5/10 colunas, toggle, aleatório (1,2,3,5,10,20), limpar
4. **Estados visuais:** Disponível / Selecionado / Seus números (laranja) / Indisponível (vermelho)
5. **Validação:** Nome + ≥1 número
6. **Pagamento:** 5 métodos + Stripe (condicional `config.permitirStripe`)
7. **Criação:** `POST /api/participacoes` com `dadosParticipacao: { numeros: [...] }`
8. **Confirmação:** QR code placeholder + detalhes sorteio + botão "Participar Novamente"

### Backend (Configuração)
```typescript
// config parseada do jogo.configuracao (JSON string)
{
  numeroInicial: 1,
  numeroFinal: 1000,
  numeroBlocos: 1,
  dataSorteio: "2026-07-20",
  horaSorteio: "20:00",
  localSorteio: "Sede da Associação",
  permitirStripe: true,
  valorPremios: 500
}
```

### Rentabilidade (Admin Only)
```typescript
// Frontend calculation
totalNumeros = stockInicial
vendidos = stockInicial - stockAtual
valorPremios = config.valorPremios
totalAngariado = jogo.totalAngariado
lucroProjetado = totalAngariado - valorPremios
```

### Pontos Fortes
✅ **Intervalo flexível** — não fixo em 50 como Euromilhões  
✅ **Blocos** — UX para rifas grandes (1000+ números)  
✅ **Seus números (laranja)** — distingue "já comprei" de "outro comprou"  
✅ **Validação backend** — `createJogoSchema` valida intervalo ≥ stock, datas obrigatórias  

### Riscos / Observações
⚠️ **QR code fake** — `<QrCode />` placeholder, não gera QR real com hash de verificação  
⚠️ **Sorteio externo** — como Euromilhões, depende de `modoSorteio` "app" vs "externo"  
⚠️ **`stockAtual` vs números ocupados** — dois contadores; pode divergir se race condition  
⚠️ **Blocos UI only** — backend não valida bloco; user pode manipular `blocoSelecionado`  

---

## Comparação Transversal

### Arquitetura Comum
| Aspecto | Implementação |
|---------|--------------|
| **Auth** | `localStorage.getItem("token")` + `getFullUserFromRequest` (JWT) |
| **API Client** | `apiRequest` wrapper (headers, auth) |
| **Pagamentos** | `PaymentSelector` component → `processarPagamento(metodo)` |
| **Notificações** | WhatsApp (`wa.me`) + Email (`mailto:`) — client-side only |
| **Toasts** | `sonner` |
| **Modals** | `Dialog` (Radix) + `ParticipacaoConfirmacaoModal` |
| **Layout** | `LayoutHeader` + `BottomNav` |

### Regras de Pagamento `dinheiro` (Consistente nos 4)
```typescript
const canUseDinheiro = ['vendedor', 'aldeia_admin', 'super_admin'].includes(userRole);
if (metodo === "dinheiro" && !canUseDinheiro) {
  toast.error("Apenas vendedores e administradores podem pagar em dinheiro");
  return;
}
```

### Validações de Stock
| Jogo | Backend Check |
|------|---------------|
| Euromilhões | Via `grelha.numerosOcupados` + transaction em participacoes |
| Poio da Vaca | `/api/apostas` transaction verifica `numerosOcupados` |
| Raspadinha | `jogo.stockAtual` decrementado atomicamente em `/api/participacoes` |
| Rifa | `jogo.stockAtual` + `/api/jogos/[id]/numeros-ocupados` |

---

## Análise de Integridade & Segurança

### ✅ Pontos Positivos
1. **Transações atómicas** — Prisma `$transaction` em apostas/participações
2. **Race condition protection** — Verifica ocupados dentro da transação
3. **Isolamento por aldeia** — `aldeiaId` em todas as queries (admin/vendedor)
4. **Role-based access** — `hasRole()` em APIs e UI
5. **Provably Fair (Raspadinha)** — Commit-reveal criptográfico real
6. **Auditoria** — `logJogoWrite`, `AuditLog` em operações sensíveis
7. **Cashback incentivado** — 5% para pagamentos com saldo

### ⚠️ Riscos Identificados
| Risco | Jogos Afetados | Severidade |
|-------|---------------|------------|
| Rentabilidade só no frontend | Poio da Vaca | **Alta** — admin pode criar jogo com prejuízo |
| Sorteio externo não auditável | Euromilhões, Rifa | **Média** — depende de `modoSorteio` |
| QR code fake na confirmação | Rifa | **Baixa** — UX only |
| Hardcoded limites (50, 9, 20) | Todos | **Baixa** — manutenção |
| Notificações client-side only | Todos | **Média** — falha se popup bloqueado |
| `custoQuadrado` vs `preco` inconsistente | Poio da Vaca | **Média** — pode cobrar errado |
| Grelha "aberta" única assumida | Euromilhões | **Média** — concorrência |

### 🔴 Crítico: Rentabilidade Poio da Vaca
O cálculo de rentabilidade é **apenas no frontend** (`page.tsx` linhas 85-102). Ao criar o jogo (`POST /api/jogos`), o backend calcula `rentabilidade` mas **não bloqueia** se for negativo — apenas avisa para raspadinha (linha 321-326 `route.ts`). Para Poio da Vaca, **não há validação de lucro mínimo no backend**.

```typescript
// src/app/api/jogos/route.ts linha 321-326
if (rentabilidade.lucroMinimoPercent < 50 && data.tipo === 'raspadinha') {
  return NextResponse.json({ error: 'Jogo não cumpre requisito mínimo de 50% de lucro...' }, { status: 400 });
}
// Poio da Vaca: NÃO TEM ESTA VALIDAÇÃO
```

---

## Recomendações

### Prioridade Alta
1. **Mover validação de rentabilidade para backend** — aplicar a todos os tipos (especialmente Poio da Vaca)
2. **Unificar `preco` / `custoQuadrado`** — decidir campo canônico; migrar dados
3. **Implementar sorteio verificável** — para Euromilhões/Rifa com `modoSorteio: "app"`, usar commit-reveal tipo Raspadinha

### Prioridade Média
4. **QR code real na Rifa** — gerar `hashParticipacao` no QR para verificação no dia
5. **Notificações server-side** — queue de emails/WhatsApp (atual é só `window.open`)
6. **Configurável grid Raspadinha** — slots count via `configuracao`
7. **Testes de integração** — fluxo completo pagamento → participação → ocupados → sorteio

### Prioridade Baixa
8. **Extrair constantes hardcoded** — `MAX_NUMEROS`, `TOTAL_NUMEROS`, `randomOptions` para config
9. **Documentar `modoSorteio`** — fluxos "app" vs "externo" em `DESIGN_SYSTEM.md`
10. **Cleanup canvas refs** — `useEffect` return com cleanup em Raspadinha

---

## Conclusão

O **raciocínio dos jogos está bem estruturado** com:
- Separação clara frontend/backend
- Transações atómicas para concorrência
- Provably Fair implementado corretamente na Raspadinha
- Isolamento multi-tenant (aldeias) consistente

**Principal falha:** Validação de rentabilidade apenas no frontend para Poio da Vaca — permite criar jogos com prejuízo garantido. Correção simples: adicionar check no `POST /api/jogos` igual ao que existe para Raspadinha.

**Arquitetura extensível:** O pattern `GameHandler` (`raspadinha.ts`) permite adicionar novos tipos de jogo delegando validação/preparação/pos-criação — bem desenhado para evolução.