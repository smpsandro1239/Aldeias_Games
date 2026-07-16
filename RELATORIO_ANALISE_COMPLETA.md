# RELATÓRIO DE ANÁLISE COMPLETA — ALDEIAS GAMES v3.11.1

**DATA:** 2026-07-16  
**VERSÃO ANALISADA:** 3.11.1  
**ANÁLISE ANTERIOR:** 2026-07-13 (big-pickle/opencode)  
**ANÁLISE DE JOGOS ADICIONADA:** 2026-07-16 (análise detalhada dos 4 jogos)

---

## SCORE GERAL: 4.2/10

| Área                              | Nota  | Tendência |
|-----------------------------------|-------|-----------|
| 1. Segurança e Prevenção de Fraude| 3/10  | →         |
| 2. Jogos                          | 5/10  | →         |
| 3. Autenticação e Perfis          | 3/10  | →         |
| 4. Design System e UI/UX          | 6/10  | →         |
| 5. Arquitetura e Código           | 5/10  | →         |
| 6. Performance e Escalabilidade   | 5/10  | →         |
| 7. Conformidade RGPD              | 2/10  | →         |
| 8. Testes                         | 1/10  | →         |
| 9. Documentação                   | 4/10  | →         |
| 10. Dependências e Configuração   | 4/10  | →         |

---

## MATRIZ DE RISCO (top 10 vulnerabilidades)

| ID  | Vulnerabilidade                                        | Severidade | Impacto | Esforço |
|-----|--------------------------------------------------------|------------|---------|---------|
| R1  | JWT secret hardcoded fallback no middleware             | CRÍTICO    | Alto    | Baixo   |
| R2  | Password reset usa `reset.id` em vez de `reset.userId` | CRÍTICO    | Alto    | Baixo   |
| R3  | Rate limiting em memória — perde estado ao reiniciar   | CRÍTICO    | Alto    | Médio   |
| R4  | JWT 30 dias sem refresh/rotation/invalidação           | ALTO       | Alto    | Médio   |
| R5  | `getFullUserFromRequest` cria utilizador sintético     | ALTO       | Alto    | Baixo   |
| R6  | CSP com `unsafe-inline` e `unsafe-eval`                | ALTO       | Médio   | Médio   |
| R7  | Endpoints duplicados de reset com expirações diferentes| ALTO       | Médio   | Baixo   |
| R8  | `ignoreBuildErrors: true` mascara erros reais          | ALTO       | Alto    | Baixo   |
| R9  | Sem testes unitários, integração ou E2E                | ALTO       | Alto    | Alto    |
| R10 | RGPD sem consentimento, cookies, ou mecanismo apagar   | ALTO       | Alto    | Alto    |

---

## RESUMO EXECUTIVO

A plataforma Aldeias Games apresenta riscos de segurança **CRÍTICOS** que devem ser corrigidos antes de qualquer produção. O JWT secret com fallback hardcoded no middleware (`src/middleware.ts:59-61`) permite que qualquer pessoa com acesso ao código gere tokens válidos. O endpoint de reset de password está completamente broken — usa `reset.id` em vez de `reset.userId` na linha 46-59 de `src/app/api/auth/reset-password/confirm/route.ts`, tornando o fluxo de recuperação de password inoperacional.

A ausência total de testes (0 ficheiros de teste encontrados) significa que não existe garantia de correção em qualquer fluxo. O rate limiting em memória (`src/lib/rate-limit.ts`) perde estado ao reiniciar o servidor, tornando-o ineficaz contra ataques persistentes. O RGPD não tem mecanismo de consentimento, cookie banner, ou direito ao esquecimento implementado.

Do ponto de vista dos **jogos**, a arquitetura é bem estruturada com separação clara frontend/backend, transações atómicas para concorrência, Provably Fair implementado corretamente na Raspadinha, e isolamento multi-tenant (aldeias) consistente. **Principal falha:** Validação de rentabilidade apenas no frontend para Poio da Vaca — permite criar jogos com prejuízo garantido. Correção simples: adicionar check no `POST /api/jogos` igual ao que existe para Raspadinha.

**Arquitetura extensível:** O pattern `GameHandler` (`raspadinha.ts`) permite adicionar novos tipos de jogo delegando validação/preparação/pós-criação — bem desenhado para evolução.

---

## ÁREA 1: Segurança e Prevenção de Fraude

### Estado Atual

O middleware implementa JWT auth, RBAC, e rate limiting em `src/middleware.ts`. Existem headers de segurança em `next.config.js` (X-Content-Type-Options, X-Frame-Options, XSS-Protection, Referrer-Policy, HSTS, Permissions-Policy). O CSP foi adicionado mas com configuração problemática.

### Problemas e Riscos

| ID  | Problema                                              | Severidade   | Ficheiro:Line                          | Código/Evidência |
|-----|-------------------------------------------------------|--------------|----------------------------------------|------------------|
| P1  | JWT secret hardcoded fallback                         | 🔴 CRÍTICO   | `src/middleware.ts:59-61`               | `const secret = process.env.JWT_SECRET \|\| "aldeias-games-dev-secret-2024-super-secure"` |
| P2  | Rate limiting em memória — perde estado               | 🔴 CRÍTICO   | `src/lib/rate-limit.ts:1-68`            | Store em Map — perde ao restart |
| P3  | 30 dias JWT sem refresh/rotation                      | 🟠 ALTO      | `src/lib/auth.ts:10,90-98`              | `expiresIn: "30d"` |
| P4  | CSP com `unsafe-inline` e `unsafe-eval`              | 🟠 ALTO      | `next.config.js:42-63`                  | `script-src 'self' 'unsafe-inline' 'unsafe-eval'` |
| P5  | Sem verificação CSRF em endpoints state-changing      | 🟠 ALTO      | `src/app/api/participacoes/route.ts`    | POST sem token CSRF |
| P6  | Webhook Stripe sem verificação de assinatura          | 🟠 ALTO      | `src/app/api/pagamentos/stripe/webhook/route.ts` | `const event = await req.json()` sem verify |
| P7  | RBAC bypass — `getFullUserFromRequest` cria user fake | 🟠 ALTO      | `src/lib/auth.ts:188-204`               | `return { id: "anonymous", ... }` |
| P8  | Console.logs sensíveis em produção                    | 🟡 MÉDIO     | `src/lib/sms.ts`, `email.ts`, `mbway.ts` | Parcialmente condicionados |

### Pontos Fortes

- Headers de segurança HTTP bem configurados em `next.config.js:50-58`
- RBAC implementado via middleware com verificação `allowedRoles.includes(user.role)`
- Rate limiting por endpoint com configurações diferenciadas em `src/lib/rate-limit.ts:45-65`

### Recomendações

| ID  | Recomendação                                          | Prioridade | Esforço | Benefício | Solução |
|-----|-------------------------------------------------------|------------|---------|-----------|---------|
| R1  | JWT secret com throw em production                    | 1 (máx)   | Baixo   | Alto      | Remover fallback, throw se não definido |
| R2  | Rate limiting com Redis/DB persistente                | 1 (máx)   | Médio   | Alto      | Usar Vercel KV ou Upstash Redis |
| R3  | Refresh tokens com rotação                            | 1 (máx)   | Médio   | Alto      | Criar modelo RefreshToken, rotação a cada 7d |
| R4  | CSP sem unsafe-inline/eval                            | 2 (alto)   | Médio   | Alto      | Usar nonce ou hash para scripts inline |
| R5  | CSRF tokens em endpoints POST/PUT/DELETE              | 2 (alto)   | Médio   | Alto      | Implementar double-submit cookie |
| R6  | Verificação de assinatura Stripe webhook              | 2 (alto)   | Baixo   | Alto      | Usar `stripe.webhooks.constructEvent()` |

---

## ÁREA 2: Jogos — ANÁLISE DETALHADA DOS 4 JOGOS

### Resumo dos 4 Jogos

| Jogo | Tipo | Preço Base | Mecânica Principal | Premiação |
|------|------|------------|-------------------|-----------|
| **Euromilhões** | Números 1-50 | Configurável | Escolha 1-50 números, sorteio por grelha | Prémio definido por grelha |
| **Poio da Vaca** | Grade X×Y | Configurável (por quadrado) | Escolha quadrados, vaca "defeca" no vencedor | Vaca / valor dinheiro |
| **Raspadinha Premium** | 3×3 grid (9 slots) | Configurável | Raspar para revelar, 3 iguais = prémio | Por % configurável (provably fair) |
| **Rifa** | Números sequenciais | Configurável | Escolha números, sorteio único | Prémio único (geralmente alto) |

---

### 2.1 Euromilhões (`/src/app/jogos/euromilhoes/page.tsx`)

#### Lógica do Jogo
- **Grid fixo:** 50 números (1–50)
- **Seleção:** 1 a 50 números por participação (limite `MAX_NUMEROS = 50`)
- **Grelhas:** Cada jogo pode ter múltiplas grelhas (sequenciais), cada uma com:
  - `estado`: "aberta" / "fechada" / "sorteada"
  - `numerosOcupados`: JSON array dos números já vendidos
  - `sorteioData`, `bloqueioData`: datas calculadas (próxima sexta-feira + bloqueio antes)
  - `premioDescricao`, `premioValor`: prémio dessa grelha específica

#### Fluxo de Participação
1. **Fetch:** Busca jogo ativo (`/api/jogos?ativos=true&tipo=euromilhoes`) ou por ID
2. **Grelha:** Busca grelhas do jogo (`/api/euromilhoes/grelhas?jogoId=...`), seleciona a "aberta" mais recente
3. **Ocupados:** Merge de `grelha.numerosOcupados` + endpoint público `/api/jogos/[id]/numeros-ocupados`
4. **Seleção UI:** Grid 5×10, toggle por clique, botões aleatórios (1,2,3,4,5)
5. **Validação:** Nome obrigatório + telefone/email + ≥1 número
6. **Pagamento:** `dinheiro` (apenas vendedor/admin), `saldo`, `stripe`, `mbway`, `transferencia`
7. **Criação:** `POST /api/participacoes` com `dadosParticipacao: { numeros: [...] }`, `grelhaId`
8. **Confirmação:** Atualiza `numerosOcupados` localmente + refresh grelha

#### Backend (Grelhas)
```typescript
// src/app/api/euromilhoes/grelhas/route.ts
// Criação automática: próxima grelha = primeiro número livre (gap filling)
// sorteioData = próxima sexta-feira (getNextFriday)
// bloqueioData = antes do sorteio (getBloqueioData)
```

#### Pontos Fortes
✅ **Isolamento por grelha** — cada grelha é independente, permite jogos recorrentes semanais  
✅ **Race condition protection** — verifica ocupados no frontend + backend (transaction)  
✅ **Fallback robusto** — se jogo ID falha, cai para primeiro ativo do tipo  
✅ **Multi-pagamento** — suporta 5 métodos com regras por role  

#### Riscos / Observações
⚠️ **Hardcoded 50 números** — `TOTAL_NUMEROS = 50` fixo no frontend; se backend mudar, quebra  
⚠️ **Grelha "aberta" única** — assume apenas uma aberta por vez; concorrência pode criar duas  
⚠️ **Sorteio externo** — `modoSorteio` pode ser "app" ou "externo"; lógica de sorteio não está no código visto  

---

### 2.2 Poio da Vaca (`/src/app/jogos/poio-da-vaca/page.tsx`)

#### Lógica do Jogo
- **Campo configurável:** Dimensões X×Y (padrão 10×10 = 100 quadrados)
- **Coordenadas:** X (esq→dir) × Y (baixo→cima) — rótulo `X{x}Y{y}`
- **Seleção:** Quadrados individuais, múltiplos por participação
- **Vencedor:** "Vaca solta no campo — primeiro coco determina coordenada vencedora" (sorteio físico/local)

#### Rentabilidade (Cálculo no Frontend + Frontend!)
```typescript
// calcularRentabilidade(custoQuadrado, valorMercadoVaca, valorCompraVaca, totalQuadrados)
receitaTotal = custoQuadrado * totalQuadrados
custoPremio = valorCompraVaca > 0 ? valorCompraVaca : valorMercadoVaca
lucro = receitaTotal - custoPremio
rentabilidade = (lucro / receitaTotal) * 100
```
**Status:** Excelente (≥50%), Bom (≥30%), Aceitável (≥10%), Baixo (≥0%), Negativo (<0%)

#### Fluxo de Participação
1. **Fetch:** Jogo + Apostas (`/api/apostas?tipo=poio_da_vaca`) + Saldo carteira
2. **UI:** Grid responsivo mantendo aspect-ratio (CSS grid `repeat(X, 1fr)`)
3. **Seleção:** Click toggle, botões rápidos (+1, +3, +5, +10, +15, +20, +30)
4. **Validação:** Nome + (telefone/email se não vendedor) + ≥1 quadrado
5. **Pagamento:** Mesmo fluxo 5 métodos + regra `dinheiro` só vendedor/admin
6. **Criação:** `POST /api/apostas` com `numeros: [...]`, `jogador`, `vendedorId`, `pago`, `usarSaldo`
7. **Notificação:** WhatsApp/Email opcional com link `wa.me` ou `mailto:`

#### Backend (Apostas)
```typescript
// src/app/api/apostas/route.ts
// Transaction atómica:
// 1. Verifica números ocupados (race condition)
// 2. Cria aposta com JSON.stringify(numeros)
// 3. Se usarSaldo: debita user + cashback 5%
// 4. Retorna 409 se números ocupados
```

#### Pontos Fortes
✅ **Dimensões dinâmicas** — lidas do `jogo.dimensoesCampo` (JSON)  
✅ **Rentabilidade transparente** — admins veem análise completa (receita, custo real, lucro)  
✅ **Filtragem por role** — admin vê todas, vendedor vê suas vendas, user vê suas apostas  
✅ **Cashback 5% saldo** — incentiva uso de carteira digital  

#### Riscos / Observações
⚠️ **Rentabilidade só no frontend** — cálculo crítico deveria ser validado no backend ao criar jogo  
⚠️ **Sorteio físico** — "vaca no campo" depende de processo externo não auditável pelo código  
⚠️ **Valores de vaca** — `valorMercadoVaca` (mostrado ao jogador) vs `valorCompraVaca` (custo real) — assimetria de informação  
⚠️ **`custoQuadrado` vs `preco`** — usa `custoQuadrado` se existir, senão `preco`; inconsistência potencial  

---

### 2.3 Raspadinha Premium (`/src/app/jogos/raspadinha-premium/page.tsx`)

#### Lógica do Jogo (Provably Fair)
- **Grid:** 3×3 = 9 slots (fixo)
- **Prémios:** Configurados no jogo (`configuracao.premios[]` com `percentagem`)
- **Algoritmo:** `crypto.randomInt(0, 10000)` → roll 0–0.9999
- **Distribuição:** Acumula basis points (percentagem × 100) → primeiro que excede roll ganha
- **Grid construction:**
  - Se **ganha**: 3 slots do prémio vencedor + 6 filler (outros prémios, máx 2 iguais)
  - Se **perde**: distribuição aleatória, máx 2 por prémio
  - Shuffle Fisher-Yates no final

#### Verificabilidade (Hash Commit-Reveal)
```typescript
// src/app/api/participacoes/_lib/raspadinha.ts
seedRaspe = crypto.randomBytes(32).toString('hex')      // seed do RNG
uniqueSalt = crypto.randomBytes(32).toString('hex')     // salt único
hashRaspe = sha256(`${seed}:${resultado}:${salt}:${timestamp}`)
```
- **Guardado na participação:** `seedRaspe`, `hashRaspe`, `resultadoRaspe`, `dadosParticipacao.grid`
- **Reveal:** Ao raspar ≥60% → auto-revela + verifica 3 iguais com valor > 0
- **Claim:** `POST /api/participacoes/[id]/claim-premio` credita valor na carteira

#### Fluxo de Participação
1. **Fetch:** Jogo por ID + Saldo
2. **Fase "not_paid":** Botão "Participar por X€"
3. **Pagamento:** 5 métodos (mesma regra `dinheiro` só vendedor/admin)
4. **Criação:** `POST /api/participacoes` → handler `raspadinha` gera grid + hash
5. **Fase "paid":** 9 canvas rasparáveis (pointer events + canvas 2d `destination-out`)
6. **Raspar:** Track percentagem por slot via grid 6px cells
7. **Auto-reveal:** ≥60% → limpa canvas + verifica prémio
8. **Vitória:** 3 iguais com `valorDinheiroAlternative > 0` → confetti + `claimPremio`
9. **Todas reveladas:** Botão "Comprar Nova"

#### Pontos Fortes
✅ **Provably Fair real** — commit-reveal com hash SHA256, seed + salt + timestamp  
✅ **Client-side scratching** — canvas nativo, fluido, sem round-trips  
✅ **Auto-claim** — detecta vitória e chama API automaticamente  
✅ **Persistência** — `sessionStorage` mantém estado se recarregar  
✅ **Sound hook** — `useScratchSound` para feedback áudio  

#### Riscos / Observações
⚠️ **Grid fixo 9 slots** — hardcoded; não configurável via `configuracao`  
⚠️ **Lógica de vitória** — "3 iguais com valor > 0" assume estrutura de prémios específica  
⚠️ **Canvas cleanup** — `initializedRef` evita re-inicialização mas pode vazar refs se navegar fora  
⚠️ **`participacaoConfirmada` fluxo** — mostra tela genérica "Raspadinha Registada" sem mostrar grid; user tem que clicar "Tentar Novamente" para jogar  

---

### 2.4 Rifa (`/src/app/jogos/rifa/page.tsx`)

#### Lógica do Jogo
- **Números:** Intervalo configurável `numeroInicial` a `numeroFinal` (ex: 1–1000)
- **Blocos:** `numeroBlocos` divide o intervalo (UI por abas)
- **Limite:** Máx 20 números por participação
- **Sorteio:** Único, data/hora/local configurados
- **Prémio:** Único (geralmente alto: "Vale 500€ + Cabaz")

#### Fluxo de Participação
1. **Fetch:** Jogo + configuração (parse JSON `configuracao`) + Ocupados + Saldo
2. **Blocos:** Calcula números por bloco → UI tabs "Bloco 1", "Bloco 2"...
3. **Seleção:** Grid 5/10 colunas, toggle, aleatório (1,2,3,5,10,20), limpar
4. **Estados visuais:** Disponível / Selecionado / Seus números (laranja) / Indisponível (vermelho)
5. **Validação:** Nome + ≥1 número
6. **Pagamento:** 5 métodos + Stripe (condicional `config.permitirStripe`)
7. **Criação:** `POST /api/participacoes` com `dadosParticipacao: { numeros: [...] }`
8. **Confirmação:** QR code placeholder + detalhes sorteio + botão "Participar Novamente"

#### Backend (Configuração)
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

#### Rentabilidade (Admin Only)
```typescript
// Frontend calculation
totalNumeros = stockInicial
vendidos = stockInicial - stockAtual
valorPremios = config.valorPremios
totalAngariado = jogo.totalAngariado
lucroProjetado = totalAngariado - valorPremios
```

#### Pontos Fortes
✅ **Intervalo flexível** — não fixo em 50 como Euromilhões  
✅ **Blocos** — UX para rifas grandes (1000+ números)  
✅ **Seus números (laranja)** — distingue "já comprei" de "outro comprou"  
✅ **Validação backend** — `createJogoSchema` valida intervalo ≥ stock, datas obrigatórias  

#### Riscos / Observações
⚠️ **QR code fake** — `<QrCode />` placeholder, não gera QR real com hash de verificação  
⚠️ **Sorteio externo** — como Euromilhões, depende de `modoSorteio` "app" vs "externo"  
⚠️ **`stockAtual` vs números ocupados** — dois contadores; pode divergir se race condition  
⚠️ **Blocos UI only** — backend não valida bloco; user pode manipular `blocoSelecionado`  

---

### 2.5 Comparação Transversal

#### Arquitetura Comum
| Aspecto | Implementação |
|---------|--------------|
| **Auth** | `localStorage.getItem("token")` + `getFullUserFromRequest` (JWT) |
| **API Client** | `apiRequest` wrapper (headers, auth) |
| **Pagamentos** | `PaymentSelector` component → `processarPagamento(metodo)` |
| **Notificações** | WhatsApp (`wa.me`) + Email (`mailto:`) — client-side only |
| **Toasts** | `sonner` |
| **Modals** | `Dialog` (Radix) + `ParticipacaoConfirmacaoModal` |
| **Layout** | `LayoutHeader` + `BottomNav` |

#### Regras de Pagamento `dinheiro` (Consistente nos 4)
```typescript
const canUseDinheiro = ['vendedor', 'aldeia_admin', 'super_admin'].includes(userRole);
if (metodo === "dinheiro" && !canUseDinheiro) {
  toast.error("Apenas vendedores e administradores podem pagar em dinheiro");
  return;
}
```

#### Validações de Stock
| Jogo | Backend Check |
|------|---------------|
| Euromilhões | Via `grelha.numerosOcupados` + transaction em participacoes |
| Poio da Vaca | `/api/apostas` transaction verifica `numerosOcupados` |
| Raspadinha | `jogo.stockAtual` decrementado atomicamente em `/api/participacoes` |
| Rifa | `jogo.stockAtual` + `/api/jogos/[id]/numeros-ocupados` |

---

### 2.6 Análise de Integridade & Segurança

#### ✅ Pontos Positivos
1. **Transações atómicas** — Prisma `$transaction` em apostas/participações
2. **Race condition protection** — Verifica ocupados dentro da transação
3. **Isolamento por aldeia** — `aldeiaId` em todas as queries (admin/vendedor)
4. **Role-based access** — `hasRole()` em APIs e UI
5. **Provably Fair (Raspadinha)** — Commit-reveal criptográfico real
6. **Auditoria** — `logJogoWrite`, `AuditLog` em operações sensíveis
7. **Cashback incentivado** — 5% para pagamentos com saldo

#### ⚠️ Riscos Identificados

| Risco | Jogos Afetados | Severidade |
|-------|---------------|------------|
| Rentabilidade só no frontend | Poio da Vaca | **Alta** — admin pode criar jogo com prejuízo |
| Sorteio externo não auditável | Euromilhões, Rifa | **Média** — depende de `modoSorteio` |
| QR code fake na confirmação | Rifa | **Baixa** — UX only |
| Hardcoded limites (50, 9, 20) | Todos | **Baixa** — manutenção |
| Notificações client-side only | Todos | **Média** — falha se popup bloqueado |
| `custoQuadrado` vs `preco` inconsistente | Poio da Vaca | **Média** — pode cobrar errado |
| Grelha "aberta" única assumida | Euromilhões | **Média** — concorrência |

#### 🔴 Crítico: Rentabilidade Poio da Vaca
O cálculo de rentabilidade é **apenas no frontend** (`page.tsx` linhas 85-102). Ao criar o jogo (`POST /api/jogos`), o backend calcula `rentabilidade` mas **não bloqueia** se for negativo — apenas avisa para raspadinha (linha 321-326 `route.ts`). Para Poio da Vaca, **não há validação de lucro mínimo no backend**.

```typescript
// src/app/api/jogos/route.ts linha 321-326
if (rentabilidade.lucroMinimoPercent < 50 && data.tipo === 'raspadinha') {
  return NextResponse.json({ error: 'Jogo não cumpre requisito mínimo de 50% de lucro...' }, { status: 400 });
}
// Poio da Vaca: NÃO TEM ESTA VALIDAÇÃO
```

---

### 2.7 Recomendações Específicas para Jogos

#### Prioridade Alta
1. **Mover validação de rentabilidade para backend** — aplicar a todos os tipos (especialmente Poio da Vaca)
2. **Unificar `preco` / `custoQuadrado`** — decidir campo canônico; migrar dados
3. **Implementar sorteio verificável** — para Euromilhões/Rifa com `modoSorteio: "app"`, usar commit-reveal tipo Raspadinha

#### Prioridade Média
4. **QR code real na Rifa** — gerar `hashParticipacao` no QR para verificação no dia
5. **Notificações server-side** — queue de emails/WhatsApp (atual é só `window.open`)
6. **Configurável grid Raspadinha** — slots count via `configuracao`
7. **Testes de integração** — fluxo completo pagamento → participação → ocupados → sorteio

#### Prioridade Baixa
8. **Extrair constantes hardcoded** — `MAX_NUMEROS`, `TOTAL_NUMEROS`, `randomOptions` para config
9. **Documentar `modoSorteio`** — fluxos "app" vs "externo" em `DESIGN_SYSTEM.md`
10. **Cleanup canvas refs** — `useEffect` return com cleanup em Raspadinha

---

### 2.8 Conclusão dos Jogos

O **raciocínio dos jogos está bem estruturado** com:
- Separação clara frontend/backend
- Transações atómicas para concorrência
- Provably Fair implementado corretamente na Raspadinha
- Isolamento multi-tenant (aldeias) consistente

**Principal falha:** Validação de rentabilidade apenas no frontend para Poio da Vaca — permite criar jogos com prejuízo garantido. Correção simples: adicionar check no `POST /api/jogos` igual ao que existe para Raspadinha.

**Arquitetura extensível:** O pattern `GameHandler` (`raspadinha.ts`) permite adicionar novos tipos de jogo delegando validação/preparação/pós-criação — bem desenhado para evolução.

---

## ÁREA 3: Autenticação e Perfis

### Estado Atual

Login com email/password via `src/app/api/auth/login/route.ts`. Registo em `src/app/api/auth/register/route.ts`. Recuperação de password com 2 endpoints duplicados. JWT com expiração de 30 dias.

### Problemas e Riscos

| ID  | Problema                                              | Severidade   | Ficheiro:Line                          | Código/Evidência |
|-----|-------------------------------------------------------|--------------|----------------------------------------|------------------|
| P1  | Password reset usa `reset.id` em vez de `reset.userId`| 🔴 CRÍTICO   | `src/app/api/auth/reset-password/confirm/route.ts:46-59` | `user: { connect: { id: reset.id } }` |
| P2  | Endpoints duplicados com expirações diferentes        | 🟠 ALTO      | `reset-password/route.ts` vs `reset-password/confirm/route.ts` | 1h vs 24h |
| P3  | Sem 2FA/MFA                                           | 🟡 MÉDIO     | N/A                                    | Não implementado |
| P4  | Sem email verification após registo                   | 🟡 MÉDIO     | `src/app/api/auth/register/route.ts`   | Registo direto sem verificação |
| P5  | Sem account lockout após tentativas falhadas          | 🟡 MÉDIO     | `src/app/api/auth/login/route.ts`      | Apenas rate limiting |

### Pontos Fortes

- Password hashing com bcrypt (rounds 10) em `src/lib/auth.ts`
- Validação de email e password no registo

### Recomendações

| ID  | Recomendação                                          | Prioridade | Esforço | Benefício | Solução |
|-----|-------------------------------------------------------|------------|---------|-----------|---------|
| R1  | Corrigir `reset.userId` no reset de password          | 1 (máx)   | Baixo   | Alto      | Alterar `reset.id` → `reset.userId` |
| R2  | Unificar endpoints de reset de password               | 1 (máx)   | Baixo   | Médio     | Manter apenas `reset-password/confirm` |
| R3  | Implementar email verification                        | 2 (alto)   | Médio   | Alto      | Token de verificação + email |
| R4  | Implementar 2FA para admin                            | 3 (médio)  | Alto    | Médio     | TOTP com speakeasy |

---

## ÁREA 4: Design System e UI/UX

### Estado Atual

UI construída com shadcn/ui, Tailwind CSS v4, Radix UI. Dark mode suportado. Layout responsivo com sidebar. Menus diferenciados por role.

### Problemas e Riscos

| ID  | Problema                                              | Severidade   | Ficheiro:Line                          | Código/Evidência |
|-----|-------------------------------------------------------|--------------|----------------------------------------|------------------|
| P1  | ~109 componentes client sem lazy loading              | 🟡 MÉDIO     | `src/components/`                      | Todos carregados no bundle inicial |
| P2  | Sem breadcrumb em páginas profundas                   | 🟡 MÉDIO     | `src/app/admindashboard/`              | Navegação depende de sidebar |
| P3  | Feedback de loading inconsistente                     | 🟡 MÉDIO     | Vários ficheiros                       | Alguns usam skeleton, outros spinner |

### Pontos Fortes

- shadcn/ui fornece componentes acessíveis (ARIA built-in)
- Dark mode funciona bem com CSS variables
- Layout responsivo com sidebar colapsável

### Recomendações

| ID  | Recomendação                                          | Prioridade | Esforço | Benefício | Solução |
|-----|-------------------------------------------------------|------------|---------|-----------|---------|
| R1  | Lazy loading de componentes pesados                  | 2 (alto)   | Médio   | Alto      | `React.lazy()` + `Suspense` |
| R2  | Adicionar breadcrumbs em páginas admin               | 3 (médio)  | Baixo   | Médio     | Componente Breadcrumb reutilizável |

---

## ÁREA 5: Arquitetura e Código

### Estado Atual

382 ficheiros em `src/`, 109 rotas API, 109 componentes, 30 modelos Prisma. App Router organizado por features.

### Problemas e Riscos

| ID  | Problema                                              | Severidade   | Ficheiro:Line                          | Código/Evidência |
|-----|-------------------------------------------------------|--------------|----------------------------------------|------------------|
| P1  | 80-90% duplicação entre jogos                         | 🟠 ALTO      | `src/app/jogos/`                       | 4 ficheiros com ~400-600 linhas idênticas |
| P2  | `@types/*` em `dependencies` em vez de `devDependencies` | 🟡 MÉDIO  | `package.json`                         | Aumenta bundle size |
| P3  | `ignoreBuildErrors: true` mascara erros               | 🟠 ALTO      | `next.config.js`                       | `typescript: { ignoreBuildErrors: true }` |
| P4  | .env aninhado obsoleto                                | 🟡 MÉDIO     | `Aldeias_Games/.env`                   | Pode causar confusão |

### Pontos Fortes

- Separação clara: `src/app/api/` (rotas), `src/components/` (UI), `src/lib/` (lógica)
- Prisma schema bem estruturado com 30 modelos

### Recomendações

| ID  | Recomendação                                          | Prioridade | Esforço | Benefício | Solução |
|-----|-------------------------------------------------------|------------|---------|-----------|---------|
| R1  | Extrair componentes comuns dos jogos                  | 2 (alto)   | Alto    | Alto      | Criar diretório `src/components/games/` |
| R2  | Remover `ignoreBuildErrors` e corrigir erros          | 2 (alto)   | Alto    | Alto      | Corrigir tipos um por um |
| R3  | Mover `@types/*` para `devDependencies`               | 3 (médio)  | Baixo   | Médio     | `npm install --save-dev @types/*` |

---

## ÁREA 6: Performance e Escalabilidade

### Estado Atual

120 páginas geradas no build. Bundle size razoável. Prisma queries sem N+1 detectado.

### Problemas e Riscos

| ID  | Problema                                              | Severidade   | Ficheiro:Line                          | Código/Evidência |
|-----|-------------------------------------------------------|--------------|----------------------------------------|------------------|
| P1  | 109 componentes client sem code splitting             | 🟡 MÉDIO     | `src/components/`                      | Bundle inicial grande |
| P2  | Sem ISR ou stale-while-revalidate                     | 🟡 MÉDIO     | `src/app/`                             | Todas as páginas SSR |
| P3  | Polling de notificações a cada 30s                    | 🟡 MÉDIO     | `src/components/notification-bell.tsx` | Requisições desnecessárias |

### Pontos Fortes

- Build webpack funciona em Windows
- Prisma com select mínimo nas queries

### Recomendações

| ID  | Recomendação                                          | Prioridade | Esforço | Benefício | Solução |
|-----|-------------------------------------------------------|------------|---------|-----------|---------|
| R1  | Implementar ISR para páginas públicas                | 3 (médio)  | Baixo   | Alto      | `export const revalidate = 3600` |
| R2  | Usar WebSocket para notificações                     | 3 (médio)  | Alto    | Médio     | Server-Sent Events ou WebSocket |

---

## ÁREA 7: Conformidade RGPD

### Estado Atual

Sem implementação RGPD. Sem cookie banner, sem consentimento, sem mecanismo de exclusão.

### Problemas e Riscos

| ID  | Problema                                              | Severidade   | Ficheiro:Line                          | Código/Evidência |
|-----|-------------------------------------------------------|--------------|----------------------------------------|------------------|
| P1  | Sem cookie banner ou consentimento                    | 🔴 CRÍTICO   | N/A                                    | Não existe |
| P2  | Sem direito ao esquecimento                           | 🔴 CRÍTICO   | N/A                                    | Não existe endpoint DELETE para dados pessoais |
| P3  | Sem política de privacidade                           | 🟠 ALTO      | N/A                                    | Não existe página |
| P4  | Sem minimização de dados                              | 🟡 MÉDIO     | `prisma/schema.prisma`                 | Campos extras em modelos |

### Pontos Fortes

- Nenhum identificado nesta área

### Recomendações

| ID  | Recomendação                                          | Prioridade | Esforço | Benefício | Solução |
|-----|-------------------------------------------------------|------------|---------|-----------|---------|
| R1  | Implementar cookie banner com consentimento          | 1 (máx)   | Médio   | Alto      | Usar react-cookie-consent |
| R2  | Criar endpoint DELETE para dados pessoais             | 1 (máx)   | Médio   | Alto      | Anonimizar dados em vez de deletar |
| R3  | Criar página de política de privacidade              | 2 (alto)   | Baixo   | Alto      | Template estático |

---

## ÁREA 8: Testes

### Estado Atual

Nenhum ficheiro de teste encontrado. Sem testes unitários, integração, ou E2E.

### Problemas e Riscos

| ID  | Problema                                              | Severidade   | Ficheiro:Line                          | Código/Evidência |
|-----|-------------------------------------------------------|--------------|----------------------------------------|------------------|
| P1  | 0 testes unitários                                    | 🔴 CRÍTICO   | N/A                                    | Nenhum ficheiro `.test.ts` ou `.spec.ts` |
| P2  | 0 testes de integração API                            | 🔴 CRÍTICO   | N/A                                    | Nenhum ficheiro de teste de endpoints |
| P3  | 0 testes E2E                                          | 🔴 CRÍTICO   | N/A                                    | Sem Playwright/Cypress |
| P4  | Sem framework de testes configurado                   | 🔴 CRÍTICO   | `package.json`                         | Sem Jest/Vitest no scripts |

### Pontos Fortes

- Nenhum identificado nesta área

### Recomendações

| ID  | Recomendação                                          | Prioridade | Esforço | Benefício | Solução |
|-----|-------------------------------------------------------|------------|---------|-----------|---------|
| R1  | Configurar Vitest + testes unitários                 | 1 (máx)   | Médio   | Alto      | `npm install vitest --save-dev` |
| R2  | Testes de integração para endpoints críticos          | 1 (máx)   | Alto    | Alto      | Testar login, registo, pagamentos |
| R3  | Testes E2E para fluxos de jogo                       | 2 (alto)   | Alto    | Alto      | Playwright para cada jogo |

---

## ÁREA 9: Documentação

### Estado Atual

README.md existe. AGENTS.md existe com workflow de deploy. Sem OpenAPI/Swagger. Sem CHANGELOG.

### Problemas e Riscos

| ID  | Problema                                              | Severidade   | Ficheiro:Line                          | Código/Evidência |
|-----|-------------------------------------------------------|--------------|----------------------------------------|------------------|
| P1  | Sem documentação de API (OpenAPI)                     | 🟡 MÉDIO     | N/A                                    | 109 endpoints sem docs |
| P2  | Sem CHANGELOG                                         | 🟡 MÉDIO     | N/A                                    | Histórico de versões perdido |
| P3  | README sem seção de arquitetura                       | 🟡 MÉDIO     | `README.md`                            | Setup básico apenas |

### Pontos Fortes

- AGENTS.md detalhado com workflow de deploy e troubleshooting

### Recomendações

| ID  | Recomendação                                          | Prioridade | Esforço | Benefício | Solução |
|-----|-------------------------------------------------------|------------|---------|-----------|---------|
| R1  | Criar OpenAPI spec para endpoints principais          | 3 (médio)  | Alto    | Médio     | Usar swagger-jsdoc |
| R2  | Criar CHANGELOG.md                                    | 3 (médio)  | Baixo   | Baixo     | Formato Keep a Changelog |

---

## ÁREA 10: Dependências e Configuração

### Estado Atual

Next.js 16.2.7, React 19, Prisma 6.19.3, TypeScript (sem strict mode), sem ESLint, sem Prettier.

### Problemas e Riscos

| ID  | Problema                                              | Severidade   | Ficheiro:Line                          | Código/Evidência |
|-----|-------------------------------------------------------|--------------|----------------------------------------|------------------|
| P1  | Sem ESLint configurado                                | 🟠 ALTO      | `package.json`                         | Sem script `lint` |
| P2  | Sem Prettier                                          | 🟡 MÉDIO     | N/A                                    | Sem formatação consistente |
| P3  | TypeScript sem `strict: true`                         | 🟠 ALTO      | `tsconfig.json`                        | `strict: false` |
| P4  | `@types/*` em `dependencies`                          | 🟡 MÉDIO     | `package.json`                         | Aumenta bundle |
| P5  | Sem `.prettierrc` ou `.eslintrc`                      | 🟡 MÉDIO     | N/A                                    | Sem config |

### Pontos Fortes

- Prisma versão pinada em 6.19.3 (evita problemas de versão)
- Build command consistente em `vercel.json`

### Recomendações

| ID  | Recomendação                                          | Prioridade | Esforço | Benefício | Solução |
|-----|-------------------------------------------------------|------------|---------|-----------|---------|
| R1  | Configurar ESLint com regras básicas                  | 2 (alto)   | Baixo   | Alto      | `npm install eslint --save-dev` |
| R2  | Ativar `strict: true` no TypeScript                  | 2 (alto)   | Alto    | Alto      | Corrigir erros resultantes |
| R3  | Configurar Prettier                                   | 3 (médio)  | Baixo   | Médio     | `.prettierrc` com config básica |

---

## RESPOSTAS ÀS PERGUNTAS ESPECÍFICAS

1. **Vulnerabilidades de segurança para não autorizados?** SIM — JWT secret hardcoded permite forjar tokens. RBAC bypass via `getFullUserFromRequest` cria utilizador sintético.

2. **Fluxo de jogos à prova de fraude?** PARCIALMENTE — Rate limiting ajuda, mas race conditions no stock de números e sem commit-reveal na raspadinha são riscos.

3. **UX consistente para todos os roles?** SIM — shadcn/ui e menus diferenciados por role funcionam bem.

4. **Design system coerente?** SIM — shadcn/ui + Tailwind + Radix UI fornece base sólida.

5. **Preparada para crescer?** PARCIALMENTE — Arquitetura é boa, mas duplicação de código e sem testes limitam escalabilidade.

6. **Transparência dos sorteios verificável?** NÃO — Sem hash/commit de resultados, sem audit trail público.

7. **Dados protegidos e RGPD compliant?** NÃO — Sem cookie banner, sem consentimento, sem direito ao esquecimento.

8. **Código manutenível?** PARCIALMENTE — Boa estrutura, mas duplicação e sem testes dificultam.

9. **Testes cobrem fluxos críticos?** NÃO — 0 testes implementados.

10. **Dependências atualizadas e necessárias?** SIM — Versões atualizadas, mas `@types/*` em dependencies é desnecessário.

---

## CONCLUSÃO E PLANO DE AÇÃO

| #  | Ação                                                  | Prioridade | Esforço | Dependência | Prazo |
|----|-------------------------------------------------------|------------|---------|-------------|-------|
| 1  | Corrigir JWT secret hardcoded (throw em production)   | P1         | 1h      | Nenhuma     | Dia 1 |
| 2  | Corrigir password reset `reset.userId`                | P1         | 1h      | Nenhuma     | Dia 1 |
| 3  | Implementar rate limiting persistente (Redis)         | P1         | 4h      | Nenhuma     | Dia 1 |
| 4  | Remover `ignoreBuildErrors` e corrigir erros TS       | P1         | 8h      | Nenhuma     | Dia 1-2 |
| 5  | Configurar ESLint + Prettier                          | P1         | 2h      | Nenhuma     | Dia 2 |
| 6  | Ativar `strict: true` no TypeScript                   | P2         | 4h      | #4          | Dia 2 |
| 7  | Configurar Vitest + testes unitários básicos          | P2         | 8h      | #5          | Dia 2-3 |
| 8  | Extrair componentes comuns dos jogos                  | P2         | 12h     | Nenhuma     | Dia 3-5 |
| 9  | Implementar cookie banner RGPD                        | P2         | 4h      | Nenhuma     | Dia 5 |
| 10 | Criar endpoint DELETE para dados pessoais             | P2         | 4h      | #9          | Dia 5-6 |
| 11 | Implementar refresh tokens JWT                        | P2         | 6h      | #1          | Dia 6-7 |
| 12 | Adicionar CSRF tokens em endpoints                    | P2         | 4h      | Nenhuma     | Dia 7 |
| 13 | Corrigir CSP (remover unsafe-inline/eval)             | P2         | 6h      | Nenhuma     | Dia 7-8 |
| 14 | **Mover validação de rentabilidade para backend (Poio da Vaca)** | P2 | 2h | Nenhuma | Dia 2 |
| 15 | **Unificar `preco` / `custoQuadrado`**                | P2         | 4h      | #14         | Dia 3 |
| 16 | **Implementar sorteio verificável (commit-reveal)**   | P3         | 8h      | #8          | Dia 10-11 |
| 17 | Testes de integração para endpoints críticos          | P3         | 12h     | #7          | Dia 8-10 |
| 18 | Implementar 2FA para admin                            | P3         | 12h     | #11         | Dia 11-13 |
| 19 | Testes E2E com Playwright                             | P3         | 16h     | #17         | Dia 13-15 |
| 20 | Documentação OpenAPI para endpoints                   | P3         | 8h      | Nenhuma     | Dia 15-16 |
| 21 | **QR code real na Rifa com hash de verificação**      | P3         | 4h      | #8          | Dia 10 |
| 22 | **Notificações server-side (queue)**                  | P3         | 8h      | #8          | Dia 11-12 |

---

**FIM DO RELATÓRIO COMPLETO**

---

*Este relatório consolida a análise crítica original (2026-07-13) com a análise detalhada dos 4 jogos (2026-07-16). As linhas marcadas com ** correspondem a recomendações novas/adicionadas baseadas na análise de jogos.*