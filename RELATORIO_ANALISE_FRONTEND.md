# Relatório de Análise Exhaustiva do Frontend — Aldeias Games

> **Data:** 2026-07-16 | **Versão:** v3.11.1 | **Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, Prisma 6.19.3

---

## 1. RELATÓRIO EXECUTIVO

### Scores por Área (0-10)

| Área | Score | Justificação Rápida |
|------|-------|---------------------|
| **Arquitetura & Organização** | 4/10 | Dashboards >800 linhas, 770 linhas duplicadas nos jogos, setup-wizard 802 linhas, React Query importado mas não usado |
| **UX & Primeira Impressão** | 7/10 | Landing page funcional com stats reais, modais de login/register claros, mas sem error states no fetchData |
| **Performance & Bundle** | 4/10 | `next/image` quase não usado (1/12 imagens), recharts (~200KB) e jspdf (~100KB) eagerly loaded, 5 fonts Google |
| **Acessibilidade (WCAG)** | 5/10 | Focus-visible presente, reduced-motion excelente, mas sem skip-to-content, canvas sem fallback teclado |
| **Manutenibilidade & Escalabilidade** | 3/10 | `ignoreBuildErrors: true`, 60 erros TS implícitos, 93 `as any`, 16 `@ts-ignore`, 0 CI/CD |
| **Segurança** | 6/10 | JWT/refresh tokens bem implementados, mas JWT em localStorage derrota httpOnly, middleware desativado, synthetic user |
| **Testes & Qualidade** | 5/10 | 13 ficheiros Vitest + 7 Playwright, mas 0 componentes testados, 0 a11y testing, sem CI/CD |
| **Internacionalização** | 2/10 | 0 i18n, ~28 strings hardcoded em page.tsx só, ~500+ strings PT-PT espalhadas no codebase |
| **Design System** | 6/10 | 20 shadcn/ui, 30 design tokens, dark mode completo, `cn()` consistente, mas 20 componentes ui vs 40+ referenciados no prompt |
| **Observabilidade** | 6/10 | Sentry configurado com replay, analytics internos RGPD-compliant, logger estruturado, mas Sentry captura PII |
| **Dados & Estado** | 4/10 | localStorage ~130 chamadas, 0 React Query usado em dashboards, stale closure risks em 2/3 dashboards |
| **Mobile-First** | 7/10 | BottomNav responsivo, safe-area padding, touch targets adequados, mas grid layouts não adaptados |
| **RGPD & Privacidade** | 6/10 | CookieConsent funcional, consent server-side, dados-pessoais page, mas categorias incompletas |
| **Deploy & CI/CD** | 5/10 | Vercel auto-deploy, mas 0 GitHub Actions, 0 lint/typecheck no pipeline |

**Score Geral Ponderado: 4.9/10**

---

### Top 5 Riscos Críticos

| # | Risco | Impacto | Ficheiro(s) | Linha(s) |
|---|-------|---------|-------------|----------|
| **R1** | JWT armazenado em `localStorage` **e** httpOnly cookie — qualquer XSS rouba o token | Segurança (CRÍTICO) | `hooks/use-auth.ts` + 30 ficheiros | `use-auth.ts:57,101` |
| **R2** | `src/middleware.ts` **não existe** — zero proteção no edge (CORS, rate limiting global, security headers) | Segurança (CRÍTICO) | `src/middleware.ts` (ausente) | — |
| **R3** | `ignoreBuildErrors: true` esconde erros de tipo em produção | Manutenibilidade (ALTO) | `next.config.js:8` | 8 |
| **R4** | 770 linhas de código duplicado entre 4 páginas de jogo (fetchSaldo, processarPagamento, clientForm, notifications) | Manutenibilidade (ALTO) | 4 ficheiros em `app/jogos/` | Ver Anexo 1 |
| **R5** | Sem CI/CD — 0 GitHub Actions, lint/typecheck/test não correm automaticamente | Qualidade (ALTO) | `.github/` (ausente) | — |

---

### Top 5 Quick Wins (Esforço Baixo, Impacto Alto)

| # | Ação | Esforço | Impacto | Ficheiro(s) |
|---|------|---------|---------|-------------|
| **Q1** | Remover JWT de `localStorage` — usar apenas httpOnly cookie | XS | CRÍTICO (segurança) | `hooks/use-auth.ts` + ~30 refs |
| **Q2** | Adicionar skip-to-content link no layout header | XS | ALTO (WCAG 2.4.1) | `components/layout-header.tsx` |
| **Q3** | Lazy import de `recharts` e `jspdf` (dynamic import) | S | ALTO (~300KB menos no bundle) | `analytics-dashboard.tsx`, `export.ts` |
| **Q4** | Substituir `<img>` por `next/image` (11 ocorrências) | S | MÉDIO (WebP, lazy, CLS) | 6 ficheiros |
| **Q5** | Extrair `fetchSaldo` + `processarPagamento` em hooks partilhados | M | ALTO (elimina ~400 linhas duplicadas) | `hooks/use-game-shared.ts` (novo) |

---

### Recomendação Estratégica

**Refatoração incremental módulo a módulo.** O codebase é funcional e entrega valor. Um rewrite completo é desproporcionado. A abordagem recomendada é:

1. **Sprint 1-2:** Fundações de segurança (middleware, localStorage, CI/CD)
2. **Sprint 3-4:** Refatoração dos jogos (extrair lógica comum) e dashboards (componentizar)
3. **Sprint 5-6:** Performance (lazy loading, bundle optimization) e a11y

---

## 2. ANÁLISE DETALHADA POR ÁREA

---

### 2.1 ARQUITETURA & ORGANIZAÇÃO DE CÓDIGO

#### ✅ O que está bem

- **Estrutura `features/`** separa admin, vendedor e cliente — boa organização por role
- **`src/lib/`** contém 35 utilitários bem organizados (auth, db, validations, stripe, etc.)
- **Barrel exports** usados em `src/components/ui/` (20 componentes shadcn/ui)
- **`@/` path alias** usado consistentemente em todo o projeto
- **Lazy loading** em AdminDashboard para 3 tabs pesadas (Aldeias, Transações, Auditoria)

#### ⚠️ O que precisa melhorar

| Problema | Impacto | Localização |
|----------|---------|-------------|
| **AdminDashboard.tsx — 1.329 linhas, 37 useState, 24 useCallback** | Monolito inmanutenível. Qualquer mudança requer entender 15 tabs e 27 API calls | `features/admin/AdminDashboard.tsx:86-1329` |
| **Setup Wizard — 802 linhas, 6 passos sequenciais num ficheiro** | Difícil de testar, ramificar por role, ou estender | `components/setup-wizard.tsx:1-802` |
| **React Query importado mas NUNCA usado** | Dead code que confunde devs; dashboards usam fetch manual com stale closure risk | `features/admin/AdminDashboard.tsx:5` |
| **770 linhas duplicadas nos 4 jogos** | fetchSaldo, processarPagamento, clientForm, notificationPicker — tudo copy-paste | Ver Anexo 1 |
| **`src/middleware.ts` não existe** — apenas 3 backups | Sem proteção edge, sem CORS centralizado, sem rate limiting global | `src/middleware.ts.*` |
| **20 shadcn/ui vs 40+ referenciados** | Falta accordion, alert-dialog, checkbox, popover, radio-group, scroll-area (estes existem mas há duplicação) | `components/ui/` |

#### 🔧 Sugestão concreta

```typescript
// Extrair de AdminDashboard.tsx para features/admin/tabs/
// Cada tab vira um ficheiro independente:
features/admin/tabs/overview-tab.tsx     (~150 linhas)
features/admin/tabs/jogos-tab.tsx        (~200 linhas)
features/admin/tabs/eventos-tab.tsx      (~180 linhas)
features/admin/tabs/users-tab.tsx        (~200 linhas)
features/admin/tabs/analytics-tab.tsx    (~150 linhas)
// AdminDashboard.tsx fica ~100 linhas (shell + tabs)
```

📊 **Prioridade:** P1 | ⏱️ **Esforço:** XL (dashboards) + L (jogos)

---

### 2.2 LANDING PAGE & PRIMEIRA IMPRESSÃO

#### ✅ O que está bem

- **Hero** — "Traz a tua Aldeia para o Futuro" com CTA claro (`landing-page.tsx:392-416`)
- **Stats reais** — fetch de `/api/public/stats`, não hardcoded (`landing-page.tsx:365-377`)
- **4 cards de jogos** com ícones, nome e badge de tipo (`landing-page.tsx:450-478`)
- **Social proof** — secção de eventos e aldeias com dados reais
- **Dark mode completo** — tema escuro é o default, light mode toggle visível

#### ⚠️ O que precisa melhorar

| Problema | Impacto | Localização |
|----------|---------|-------------|
| **Sem error state no fetchData da landing** | Se as APIs falharem, o utilizador vê página vazia sem feedback | `page.tsx:101-134` |
| **~28 strings hardcoded em PT-PT** | Impossível internacionalizar, manutenção manual | `page.tsx:220-488` |
| **`window.location.href` em vez de `router.push`** | Full page reload perde estado SPA, ramo else é dead code | `page.tsx:161-165` |
| **28 modais inline no page.tsx** | Login (200+ linhas) e Register (70+ linhas) no ficheiro principal | `page.tsx:217-493` |
| **Dev buttons hardcoded com credenciais** | Credenciais de teste visíveis no source (guardadas por NODE_ENV) | `page.tsx:366-416` |
| **Sem headings no page.tsx** | Hierarquia de headings delegada a componentes filhos — pode haver violações | `page.tsx` |

#### 🔧 Sugestão concreta

```typescript
// Extrair login/register para componentes dedicados:
components/modals/login-modal.tsx    (~200 linhas)
components/modals/register-modal.tsx (~100 linhas)
// page.tsx fica ~150 linhas (splash + landing + modal triggers)

// Adicionar error boundary:
<ErrorFallback>
  <LandingPage />
</ErrorFallback>
```

📊 **Prioridade:** P2 | ⏱️ **Esforço:** M

---

### 2.3 AUTENTICAÇÃO & ONBOARDING

#### ✅ O que está bem

- **JWT + Refresh Token rotation** — 24h access, 7d refresh com revogação server-side (`auth.ts:12-13, 331-348`)
- **2FA/TOTP** obrigatório para super_admin e aldeia_admin (`login/route.ts:283`)
- **Account lockout** — 5 tentativas, 15 min bloqueio (`login/route.ts:18-21`)
- **Password complexity** — min 12 chars, maiúscula, minúscula, número, especial (`reset-password/confirm/route.ts:19`)
- **Demo users** protegidos — só em `NODE_ENV !== 'production'` + `ENABLE_DEMO_USERS=true` (`login/route.ts:130`)
- **Setup Wizard** — 6 passos guiados para configuração inicial (`setup-wizard.tsx`)

#### ⚠️ O que precisa melhorar

| Problema | Impacto | Localização |
|----------|---------|-------------|
| **JWT em localStorage** — derrota httpOnly cookie | XSS rouba token; qualquer script malicioso tem acesso | `hooks/use-auth.ts:57,101` + 30 ficheiros |
| **Synthetic user构造** — JWT válido de utilizador apagado dá acesso | Bypass de auth: `getFullUserFromRequest()` fabrica user do payload JWT | `src/lib/auth.ts:187-203` |
| **Setup Wizard — 802 linhas sem role branching** | Não adapta passos por role; super_admin e aldeia_admin veem o mesmo wizard | `setup-wizard.tsx:1-802` |
| **Login retorna JWT no body JSON** + cookie | Token exposto ao JavaScript desnecessariamente | `login/route.ts:360` |
| **Sem rate limiting em forgot-password/reset-password** | Brute-force possível nos endpoints de recuperação | `forgot-password/route.ts`, `reset-password/confirm/route.ts` |

#### 🔧 Sugestão concreta

```typescript
// 1. Remover localStorage token — usar apenas cookie:
// Em hooks/use-auth.ts, remover:
localStorage.setItem("token", data.token);
// Manter apenas o cookie httpOnly setado pelo server

// 2. Corrigir synthetic user:
// Em auth.ts, retornar null em vez de fabricar user:
if (!user) return null; // Não fabricar user de JWT stale

// 3. Adicionar rate limiting:
// Em forgot-password/route.ts e reset-password/confirm/route.ts:
const rateResult = await checkRateLimit(clientId, rateLimitConfigs.forgotPassword);
if (!rateResult.allowed) return createRateLimitResponse(rateResult.resetTime);
```

📊 **Prioridade:** P0 (localStorage) | ⏱️ **Esforço:** S

---

### 2.4 DASHBOARDS POR ROLE

#### Análise Comparativa

| Métrica | AdminDashboard | VendedorDashboard | ClienteDashboard |
|---------|---------------|-------------------|------------------|
| **Linhas totais** | 1.329 | 848 | 878 |
| **useState** | 37 | 10 | 28 |
| **useEffect** | 3 | 1 | 2 |
| **useCallback** | 24 | 0 | 0 |
| **API calls** | 18 (+9 em fetchData) | 7 | 6 |
| **Tabs** | 15 | 7 | 4 |
| **React Query** | Importado, **não usado** | Não | Não |
| **Loading state** | Skeleton UI completo | Spinner simples | Tela cheia animada |
| **Empty states** | Nenhum | Parcial (2) | Completo (4) |
| **Lazy loading** | 3 tabs (React.lazy) | Nenhum | Nenhum |
| **fetchData memoizado** | ✅ useCallback | ❌ Função solta | ❌ Função solta |

#### ✅ O que está bem

- **AdminDashboard** — lazy loading de tabs pesadas, skeleton loading completo, 24 useCallbacks
- **ClienteDashboard** — 4 empty states bem tratados, useMemo para filtragem, aldeia wizard guard
- **VendedorDashboard** — empty states na tab angariação e histórico, 7 tabs bem organizadas

#### ⚠️ O que precisa melhorar

| Problema | Impacto | Localização |
|----------|---------|-------------|
| **AdminDashboard 37 useState** | Estado fragmentado, difícil de gerir | `AdminDashboard.tsx:86-245` |
| **VendedorDashboard/ClienteDashboard — fetchData não memoizado** | Stale closure risk, re-renders desnecessários | `vendedor-dashboard.tsx:165`, `cliente-dashboard.tsx:132` |
| **Skeletons importados mas não usados** | Dead code em ClienteDashboard | `cliente-dashboard.tsx:29` |
| **Mixed fetch patterns** — apiRequest + raw fetch no mesmo ficheiro | Inconsistência, difícil de auditar | `AdminDashboard.tsx` (12 apiRequest + 6 fetch) |
| **Sem empty states no AdminDashboard** | Tabelas vazias sem mensagem amigável | `AdminDashboard.tsx` |

#### 🔧 Sugestão concreta

```typescript
// Migrar fetchData para React Query em todos os dashboards:
const { data, isLoading, error } = useQuery({
  queryKey: ['dashboard-vendedor', token],
  queryFn: () => fetchDashboardData(token),
  staleTime: 30_000,
  retry: 1,
});
// Elimina: useState(load), useState(data), useState(error), useEffect, useCallback
// Ganho: cache automático, retry, loading/error states prontos
```

📊 **Prioridade:** P1 | ⏱️ **Esforço:** L

---

### 2.5 JOGOS — FLUXO DE PARTICIPAÇÃO

#### Duplicação entre os 4 Jogos

| Padrão Duplicado | Ficheiros | Linhas/Unidade | Total |
|------------------|-----------|----------------|-------|
| `fetchSaldo` (idêntico) | 3/4 | ~15 | ~45 |
| `processarPagamento` guard + MBWay/Stripe | 4/4 | ~50 | ~200 |
| Formulário cliente (nome, telefone, email) | 4/4 | ~35 | ~140 |
| Notification picker (WhatsApp/Email/Nenhum) | 3/4 | ~40 | ~120 |
| WhatsApp/email pós-participação | 3/4 | ~15 | ~45 |
| localStorage user pre-fill | 4/4 | ~15 | ~60 |
| `criarParticipacao` API call pattern | 4/4 | ~40 | ~160 |
| Admin role check | 4/4 | ~1 | ~4 |
| **Total estimado** | | | **~770 linhas** |

#### Análise por Jogo

| Jogo | Linhas | Canvas | A11y | Loading | "Jogar Novamente" |
|------|--------|--------|------|---------|-------------------|
| **Raspadinha Premium** | 1.285 | Canvas manual (sem lib) | ❌ Sem fallback teclado | Spinner custom | ✅ handleComprarNova |
| **Poio da Vaca** | 1.004 | HTML buttons | ✅ Nativo | Texto simples | ⚠️ Implícito |
| **Rifa** | 968 | HTML buttons | ✅ Nativo | Texto simples | ✅ Botão explícito |
| **Euromilhões** | 879 | HTML buttons | ✅ Nativo | Spinner | ✅ Botão explícito |

#### Componentes Não Utilizados em `src/components/games/`

| Componente | Linhas | Usado por algum jogo? |
|-----------|--------|----------------------|
| `ScratchCard.tsx` | 389 | ❌ Raspadinha implementa canvas manual |
| `error-boundary.tsx` | 67 | ❌ Nenhum jogo usa GameErrorBoundary |
| `game-list.tsx` | 163 | Apenas listing page |
| `poio-da-vaca-ticket.tsx` | — | ❌ Poio da Vaca não usa |
| `lottery-animation.tsx` | — | ❌ Nenhum jogo usa |
| `mascot-raffle-ticket.tsx` | — | ❌ Nenhum jogo usa |
| `ultimate-raffle-ticket.tsx` | — | ❌ Nenhum jogo usa |

**Crítico:** `ScratchCard.tsx` (389 linhas) e `GameErrorBoundary` (67 linhas) existem especificamente para reutilização mas **nenhum dos 4 jogos os importa**.

#### 🔧 Sugestão concreta

```typescript
// Criar hooks partilhados:
hooks/use-game-saldo.ts          // fetchSaldo (15 linhas, 1x)
hooks/use-game-payment.ts        // processarPagamento (50 linhas, 1x)
hooks/use-game-participation.ts  // criarParticipacao + notifications (80 linhas, 1x)

// Criar componentes partilhados:
components/games/client-form.tsx       // nome + telefone + email + notification picker
components/games/game-shell.tsx        // layout comum (header + grid + sidebar)
components/games/participation-result.tsx  // ecrã pós-participação
```

📊 **Prioridade:** P1 | ⏱️ **Esforço:** L

---

### 2.6 SISTEMA FINANCEIRO

#### ✅ O que está bem

- **3 bolsos claros** — Vendedor.Cashbox → Vault (Cofre) → Player.Wallet
- **Admin Cofre** — pedidos depósito, reconciliação, export CSV (`admin-cofre.tsx`)
- **Super Admin Cofre** — visão global multi-aldeia (`superadmin-cofre.tsx`)
- **Vendedor Cashbox** — saldo, transações, pedido depósito (`vendedor-cashbox.tsx`)
- **Notificações financeiras** — deposito_criado/confirmado/rejeitado via NotificationBell

#### ⚠️ O que precisa melhorar

| Problema | Impacto | Localização |
|----------|---------|-------------|
| **Dashboard financeiro** mistura UI com lógica de negócio | Difícil de testar e reutilizar | `financeiro-overview.tsx` |
| **Export CSV** — jspdf (~100KB) carregado sempre | Bundle desnecessário se só se usa PDF ocacionalmente | `src/lib/export.ts` |

📊 **Prioridade:** P2 | ⏱️ **Esforço:** M

---

### 2.7 COMPONENTES PARTILHADOS & DESIGN SYSTEM

#### ✅ O que está bem

- **20 shadcn/ui** componentes em `src/components/ui/`
- **30 design tokens** CSS (14 core + 14 MD3 + 2 custom)
- **Dark mode completo** — `:root` escuro, `.light` para claro
- **`cn()` utility** consistente (clsx + tailwind-merge)
- **Focus-visible styles** para buttons, inputs, selects, textareas
- **`prefers-reduced-motion`** suportado globalmente
- **Safe area padding** para iPhone notch

#### ⚠️ O que precisa melhorar

| Problema | Impacto | Localização |
|----------|---------|-------------|
| **Sem `aria-live` para rotas** | Leitores de ecrã não anunciam mudanças de página | `layout-header.tsx` |
| **Foco visível incompleto** — falta `a[href]`, `[tabindex]` | Links não mostram foco | `globals.css:319-324` |
| **Inconsistência PascalCase vs kebab-case** | `StatCard.tsx` vs `scroll-area.tsx` | `components/ui/` |

📊 **Prioridade:** P2 | ⏱️ **Esforço:** S

---

### 2.8 HOOKS & LÓGICA DE NEGÓCIO

#### Duplicação Identificada

```typescript
// 4x duplicado — identical em raspadinha:227, poio:389, rifa:316, euromilhoes:236
const user = JSON.parse(localStorage.getItem("user") || "{}");
const userRole = user.role;
const canUseDinheiro = ['vendedor', 'aldeia_admin', 'super_admin'].includes(userRole);
if (metodo === "dinheiro" && !canUseDinheiro) {
  toast.error("Apenas vendedores e administradores podem pagar em dinheiro");
  return;
}
```

#### Hooks Existentes vs Necessários

| Hook Existente | Usado? | Hooks que Faltam |
|---------------|--------|------------------|
| `useAuth` | ✅ Amplamente | `useFetchSaldo` (duplicado 4x) |
| `useJogos` | ✅ Listing | `useProcessarPagamento` (duplicado 4x) |
| `usePagamento` | ⚠️ Parcial | `useGameParticipation` (duplicado 4x) |
| `useParticipacoes` | ✅ Cliente | `useNotificationPicker` (duplicado 3x) |
| `useNotificacoes` | ✅ Bell | `useGamePreFill` (duplicado 4x) |
| `useScratchSound` | ✅ Raspadinha | |
| `useOfflineDetection` | ✅ POS | |

📊 **Prioridade:** P1 | ⏱️ **Esforço:** M

---

### 2.9 MIDDLEWARE & SEGURANÇA

#### ✅ O que está bem

- **JWT 24h** com refresh rotation (7d, DB-backed, revogável)
- **Cookies httpOnly + secure + sameSite** — padrão correto
- **CSRF** via Double Submit Cookie (HMAC-signed JWT)
- **Rate limiting** com Redis Upstash em produção, fallback in-memory
- **Account lockout** — 5 tentativas, 15 min
- **Headers de segurança** no `next.config.js` — CSP, HSTS, X-Frame-Options

#### ⚠️ O que precisa melhorar

| Problema | Impacto | Localização |
|----------|---------|-------------|
| **`src/middleware.ts` não existe** | Sem CORS edge, sem rate limiting global, sem security headers no middleware | Ausente |
| **JWT em localStorage** | Derrota httpOnly; XSS rouba token | `hooks/use-auth.ts` + 30 refs |
| **Synthetic user构造** | JWT stale de user apagado dá acesso | `auth.ts:187-203` |
| **Login retorna JWT no body JSON** | Token exposto ao JS | `login/route.ts:360` |
| **CSP com `unsafe-inline`** | XSS via inline scripts; nonces não implementados | `next.config.js:24` |
| **Bcrypt cost inconsistente** — 10 vs 12 | Pode causar confusão; devia ser uniforme | `auth.ts:73` vs `reset-password:54` |
| **api-client.ts — 29 linhas** sem retry, timeout, ou refresh | Falha de rede silenciosa | `src/lib/api-client.ts` |

📊 **Prioridade:** P0 (middleware + localStorage) | ⏱️ **Esforço:** S-M

---

### 2.10 PERFORMANCE & BUNDLE

#### Dependências Pesadas

| Pacote | Peso (gz) | Usado em | Recomendação |
|--------|-----------|----------|-------------|
| `recharts` | **~200KB** | 2 ficheiros admin | `dynamic(() => import('recharts'))` |
| `jspdf` + `jspdf-autotable` | **~100KB** | 1 ficheiro (export.ts) | `dynamic(() => import('jspdf'))` |
| `framer-motion` | **~40KB** | 25 ficheiros | Manter mas considerar `m` (mini) |
| `@sentry/nextjs` | **~50KB** | 1 ficheiro | Aceitável para monitoring |
| `canvas-confetti` | **~8KB** | 6 ficheiros | Aceitável |

#### Imagens

| Tipo | Contagem | Ficheiros |
|------|----------|-----------|
| `next/image` (<Image>) | **1** | `premio-modal.tsx` |
| `<img>` raw | **11** | 6 ficheiros |

**`next/image` é essencialmente não utilizado.** Significa: sem WebP automático, sem lazy loading, sem responsive srcset, sem prevenção CLS.

#### Code Splitting

| Padrão | Contagem | Onde |
|--------|----------|------|
| `React.lazy()` | 3 | AdminDashboard (AldeiasTab, TransacoesTab, AuditoriaTab) |
| `<Suspense>` | 7 | 4 ficheiros |

**Mínimo.** Recharts, jspdf, framer-motion são importados eagerly em todas as páginas.

#### Fonts

| Font | display | Preloaded | Subsets |
|------|---------|-----------|---------|
| Inter | **MISSING** (auto) | ✅ | latin, latin-ext |
| Noto Serif | swap | ✅ | latin, latin-ext |
| Plus Jakarta Sans | swap | ✅ | latin, latin-ext |
| Chakra Petch | swap | ✅ | 300-700 |
| Russo One | swap | ✅ | cyrillic, latin, latin-ext |

**5 fonts é excessivo.** Inter falta `display: "swap"`.

#### 🔧 Sugestão concreta

```typescript
// 1. Lazy load recharts:
const AnalyticsChart = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});

// 2. Lazy load jspdf:
export async function generatePDF(data: ReportData) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  // ...
}

// 3. Substituir <img> por <Image>:
import Image from 'next/image';
<Image src={url} alt={alt} width={200} height={200} loading="lazy" />
```

📊 **Prioridade:** P1 | ⏱️ **Esforço:** M

---

### 2.11 ACESSIBILIDADE (WCAG 2.1 AA)

#### ✅ O que está bem

- **Focus-visible** para buttons, inputs, selects, textareas (`globals.css:319-324`)
- **`prefers-reduced-motion`** suportado globalmente (`globals.css:531-538`)
- **~150 aria-labels** em 31 ficheiros
- **7 aria-live regions** (toast, scratch card, modais)
- **Labels associados** com `htmlFor` + `id` nos formulários
- **Dialog (Radix)** — focus trap, Escape fecha, Tab cicla
- **ScratchCard** — `role="img"`, `aria-label`, `role="status"` + `aria-live="polite"` no resultado

#### ⚠️ O que precisa melhorar

| Problema | WCAG | Impacto | Localização |
|----------|------|---------|-------------|
| **Sem skip-to-content link** | 2.4.1 | Navegadores precisam de tab through todo header | `layout-header.tsx` |
| **Canvas raspadinha sem fallback teclado** | 1.1.1 | Utilizadores sem rato não conseguem raspar | `raspadinha-premium/page.tsx` (canvas manual) |
| **Foco visível incompleto** — falta `a[href]`, `[tabindex]` | 2.4.7 | Links e elementos custom sem indicador de foco | `globals.css:319-324` |
| **Sem `aria-live` para rotas** | 4.1.3 | Leitores de ecrã não anunciam mudanças de página | Ausente |
| **Sem heading hierarchy** no page.tsx | 1.3.1 | Pode haver skip de heading levels | `page.tsx` |
| **Focus em `<a href>` usados em vez de `<Link>`** | 2.4.4 | Navegação client-side quebrada | `page.tsx:255` |

📊 **Prioridade:** P1 | ⏱️ **Esforço:** S

---

### 2.12 INTERNACIONALIZAÇÃO & LOCALIZAÇÃO

#### ✅ O que está bem

- **Moeda** — `formatCurrency()` usa `Intl.NumberFormat('pt-PT', {style:'currency',currency:'EUR'})`
- **Datas** — `formatDate()` usa `toLocaleDateString('pt-PT')`
- **Números** — `formatNumber()` usa `toLocaleString('pt-PT')`

#### ⚠️ O que precisa melhorar

| Problema | Impacto | Localização |
|----------|---------|-------------|
| **0 i18n** — todas as strings são hardcoded PT-PT | Impossível mudar idioma | Todo o codebase |
| **~28 strings em page.tsx** | Apenas a landing page | `page.tsx:220-488` |
| **~500+ strings PT-PT nos 4 jogos** | Cada jogo tem strings próprias | `app/jogos/*/page.tsx` |
| **Validação PT-PT de telefone** — `+351 9XX XXX XXX` | Não máscara input | Formulários de jogo |

📊 **Prioridade:** P3 | ⏱️ **Esforço:** XL (se implementar i18n completo)

---

### 2.13 TESTES & QUALIDADE

#### Cobertura Atual

| Tipo | Ficheiros | Detalhes |
|------|-----------|----------|
| **Vitest (unit)** | 13 | auth, middleware, utils, validations, game-logic, game-handlers, rate-limit, i18n, financial-validations, game-lifecycle, business-logic |
| **Playwright (E2E)** | 7 | public-pages, navigation, login-flow, game-lifecycle, fluxo-completo, csrf, api-endpoints |
| **Component tests (.test.tsx)** | **0** | Zero testes de componentes React |
| **Cypress** | 0 | Pasta não existe |
| **CI/CD** | 0 | Sem `.github/workflows/` |

#### ✅ O que está bem

- **20 ficheiros de teste** — boa cobertura de lógica de negócio
- **Playwright** configurado com trace, screenshot on failure, retries
- **Vitest** com jsdom, v8 coverage, setup files

#### ⚠️ O que precisa melhorar

| Problema | Impacto | Localização |
|----------|---------|-------------|
| **0 component tests** | Componentes não testados | `.test.tsx` ausentes |
| **0 a11y testing** | Sem axe-core, sem jest-dom a11y matchers | Ausente |
| **0 visual regression testing** | Regressões visuais não detetadas | Playwright sem screenshots comparativos |
| **Playwright single-threaded** | `workers: 1`, `fullyParallel: false` — lento | `playwright.config.ts` |
| **Sem CI/CD** | Lint/typecheck/test não correm no push | `.github/` ausente |
| **`strict: true` mas `ignoreBuildErrors: true`** | TS strict é ilusório | `tsconfig.json:10` + `next.config.js:8` |

📊 **Prioridade:** P1 | ⏱️ **Esforço:** L

---

### 2.14 OBSERVABILIDADE & ERROS

#### ✅ O que está bem

- **Sentry** — com replay, browser tracing, sample rates configurados (`sentry-init.tsx`)
- **Analytics internos** — primeiro-partido, sem PII, RGPD-compliant (`game-analytics.ts`)
- **Logger estruturado** — `src/lib/logger.ts` com níveis e contexto
- **Access logging** — `LogAcesso` table com IP e user agent

#### ⚠️ O que precisa melhorar

| Problema | Impacto | Localização |
|----------|---------|-------------|
| **Sentry replay `maskAllText: false`** | Captura texto visível = possível PII | `sentry-init.tsx:16` |
| **Sem Error Boundaries** nos jogos | Erros de canvas/audio crasham a página inteira | `src/components/games/error-boundary.tsx` existe mas não é usado |
| **console.log/console.error** em produção | Logs não estruturados misturados com logger | Múltiplos ficheiros |

📊 **Prioridade:** P2 | ⏱️ **Esforço:** S

---

## 3. PLANO DE AÇÃO PRIORIZADO (ROADMAP)

| Sprint | Foco | Tarefas-Chave | Owner | Critério de Aceite |
|--------|------|---------------|-------|-------------------|
| **1** | **Segurança & Fundações** | 1. Restaurar `src/middleware.ts` com rate limiting global<br>2. Remover JWT de `localStorage` (usar só httpOnly cookie)<br>3. Corrigir synthetic user构造 em `auth.ts`<br>4. Adicionar rate limiting a forgot/reset-password | DevOps + Security | Middleware ativo, 0 tokens em localStorage, tsc clean |
| **2** | **CI/CD & Qualidade** | 1. Criar `.github/workflows/ci.yml` (lint + typecheck + test + build)<br>2. Remover `ignoreBuildErrors` — corrigir erros TS restantes<br>3. Configurar Playwright `workers: 4`<br>4. Adicionar axe-core nos testes E2E | DevOps + QA | Pipeline verde no PR, build sem ignoreBuildErrors |
| **3** | **Jogos — Refatoração Comum** | 1. Criar `hooks/use-game-saldo.ts`, `use-game-payment.ts`, `use-game-participation.ts`<br>2. Criar `components/games/client-form.tsx`, `notification-picker.tsx`<br>3. Migrar os 4 jogos para hooks/partilhados<br>4. Integrar `ScratchCard.tsx` e `GameErrorBoundary` na raspadinha | 2 Frontend devs | 4 jogos usam hooks partilhados, ~770 linhas eliminadas |
| **4** | **Dashboards — Componentização** | 1. Extrair tabs do AdminDashboard para ficheiros独立<br>2. Migrar dashboards para React Query<br>3. Adicionar empty states ao AdminDashboard<br>4. Corrigir stale closure risk em Vendedor/Cliente | Frontend Lead | Cada ficheiro <500 linhas, React Query em todos |
| **5** | **Performance & Bundle** | 1. Lazy load `recharts` e `jspdf`<br>2. Substituir `<img>` por `next/image` (11 ocorrências)<br>3. Reduzir fonts para 3 (remover Chakra Petch, Russo One)<br>4. Adicionar `display: "swap"` ao Inter<br>5. Bundle <200KB gz inicial | Frontend Lead | Lighthouse Performance ≥90, LCP <2.5s |
| **6** | **Acessibilidade & UX** | 1. Adicionar skip-to-content link<br>2. Canvas raspadinha — fallback teclado (usar ScratchCard.tsx existente)<br>3. Foco visível para `a[href]` e `[tabindex]`<br>4. Adicionar `aria-live` para rotas<br>5. Error states no fetchData da landing | UX + Frontend | Lighthouse A11y ≥95, axe-core 0 violations |

---

## 4. ANEXOS TÉCNICOS

### Anexo 1 — Mapa de Duplicação nos Jogos

```
┌─────────────────────────────────────────────────────────────────┐
│                     CÓDIGO DUPLICADO (770 linhas)              │
├─────────────────────┬──────────┬──────────┬──────────┬─────────┤
│ Padrão              │ Raspadinha│ Poio     │ Rifa     │ Eurom.  │
├─────────────────────┼──────────┼──────────┼──────────┼─────────┤
│ fetchSaldo          │ L187     │ L214     │ L252     │ —       │
│ processarPagamento  │ L223     │ L386     │ L313     │ L236    │
│ clientForm          │ L1114    │ L873     │ L848     │ L731    │
│ notificationPicker  │ L1144    │ L916     │ L879     │ —       │
│ criarParticipacao   │ L313     │ L451     │ L405     │ L257    │
│ WhatsApp/Email      │ L373     │ L485     │ L468     │ —       │
│ localStorage prefill│ L147     │ L194     │ L112     │ L265    │
│ Admin role check    │ L228     │ L390     │ L317     │ —       │
└─────────────────────┴──────────┴──────────┴──────────┴─────────┘
```

### Anexo 2 — Erros TypeScript

| Categoria | Contagem | Resolução |
|-----------|----------|-----------|
| TS7016 — `@prisma/client` sem tipos | ~43 | `npx prisma generate` |
| TS7006 — parâmetros implícitos `any` | ~17 | Adicionar tipos |
| TS2353/TS2339 — propriedades em falta | 2 | Corrigir tipos |
| **Total erros reais** | **~60** | |
| `as any` explícitos | 93 | Refatorar gradualmente |
| `@ts-ignore` / `@ts-nocheck` | 16 | Resolver causa raiz |

### Anexo 3 — Dependências Potencialmente Mortas

| Pacote | Evidence |
|--------|----------|
| `twilio` | 0 imports em `src/` |
| `@aws-sdk/client-sns` | 0 imports em `src/` |
| `nodemailer` | 0 imports em `src/` |
| `embla-carousel-react` | 0 imports diretos |
| `axios` | Apenas 1 uso (`mbway.ts`) — poderia ser fetch |

### Anexo 4 — Dependências Pesadas no Bundle

```
recharts .............. ~200KB gz  (2 ficheiros)
@sentry/nextjs ........ ~50KB gz   (1 ficheiro)
jspdf + autotable ..... ~100KB gz  (1 ficheiro)
framer-motion ......... ~40KB gz   (25 ficheiros)
canvas-confetti ....... ~8KB gz    (6 ficheiros)
```

---

> **Nota:** Este relatório foi gerado em 2026-07-16 com base na análise estática do código-fonte. Os scores refletem o estado atual do codebase e devem ser reavaliados após cada sprint do roadmap.
