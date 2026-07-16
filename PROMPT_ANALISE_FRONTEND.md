# 🎯 PROMPT PARA ANÁLISE EXAUSTIVA DO FRONTEND — ALDEIAS GAMES

> **Instrução:** Copia e cola este prompt numa nova conversa com uma IA (Claude, GPT-4, etc.) para obter uma análise profissional, detalhada e acionável de todo o frontend da plataforma Aldeias Games.

---

## 🤖 PROMPT PARA A IA ANALISTA

```
# ANÁLISE PROFISSIONAL DE FRONTEND — ALDEIAS GAMES

## CONTEXTO
Sou o Product Owner da **Aldeias Games**, uma plataforma SaaS multi-tenant (Next.js 16, React 19, TypeScript, Tailwind v4, Prisma) para comunidades portuguesas fazerem angariação de fundos através de jogos tradicionais (Raspadinha, Poio da Vaca, Rifa, Euromilhões).

**Objetivo:** Quero uma **análise exaustiva, honesta e priorizada** de todo o frontend — da landing page ao último clique no dashboard — focada em:
1. **Organização & Arquitetura** (estrutura, padrões, reutilização, dívida técnica)
2. **Experiência do Utilizador & Impacto Visual** (UX/UI, fluxos, acessibilidade, conversão)
3. **Desempenho & Perceção de Velocidade** (Core Web Vitals, bundle, loading states, otimizações)
4. **Acessibilidade & Inclusão** (WCAG 2.1 AA, contraste, teclado, leitores de ecrã)
5. **Manutenibilidade & Escalabilidade** (facilidade de adicionar features, onboarding de devs, testes)

---

## 📁 ESTRUTURA DO PROJETO (resumo para a IA)

```
src/
├── app/                          # App Router (Next.js 16)
│   ├── page.tsx                  # Landing + Login/Register modals (495 linhas)
│   ├── layout.tsx                # Root layout (fonts, providers, Toaster, CookieConsent)
│   ├── globals.css               # Design tokens CSS (cores, spacing, typography)
│   ├── jogos/                    # 4 páginas de jogo (euromilhoes, poio-da-vaca, rifa, raspadinha-premium)
│   ├── admindashboard/           # Dashboard aldeia_admin (cofre, financeiro, euromilhoes)
│   ├── superadmindashboard/      # Dashboard super_admin (cofre global, financeiro, permissions)
│   ├── clientedashboard/         # Dashboard utilizador final
│   ├── vendedordashboard/        # Dashboard vendedor (POS, cashbox)
│   ├── api/                      # 109 rotas API (auth, jogos, participacoes, pagamentos, etc.)
│   └── ... (onboarding, pagamento, perfil, prémios, etc.)
├── components/
│   ├── ui/                       # 40+ componentes shadcn/ui (Button, Dialog, Input, etc.)
│   ├── games/                    # Componentes específicos de jogos (GameList, etc.)
│   ├── modals/                   # Modais partilhados
│   ├── payment/                  # PaymentSelector, etc.
│   ├── providers/                # ReactQuery, Offline, Theme, etc.
│   ├── landing-page.tsx          # Landing page completa (567 linhas)
│   ├── layout-header.tsx         # Header global com navegação por role
│   ├── notification-bell.tsx     # Sistema de notificações (polling 30s)
│   ├── user-menu-modal.tsx       # Menu do utilizador
│   ├── setup-wizard.tsx          # Wizard de configuração inicial (30k linhas!)
│   ├── gamification.tsx          # Badges, níveis, leaderboards
│   └── ... (109 componentes no total)
├── features/                     # Feature-based (admin, vendedor, cliente)
│   ├── admin/                    # AdminDashboard (49k), admin-cofre, financeiro, etc.
│   ├── vendedor/                 # VendedorDashboard (36k), pos-view, cashbox
│   └── cliente/                  # ClienteDashboard (38k)
├── hooks/                        # 12 custom hooks (useAuth, useJogos, usePagamento, etc.)
├── lib/                          # 35 utilitários (auth, db, validations, stripe, mbway, etc.)
├── types/                        # TypeScript types partilhados
└── middleware.ts                 # Auth, RBAC, rate limiting (1966 linhas)
```

**Dashboards principais** (ficheiros grandes = complexidade alta):
- `features/admin/AdminDashboard.tsx` — 49.992 bytes
- `features/vendedor/vendedor-dashboard.tsx` — 36.034 bytes  
- `features/cliente/cliente-dashboard.tsx` — 38.902 bytes
- `components/setup-wizard.tsx` — 30.595 bytes

---

## 🔍 ÁREAS DE ANÁLISE OBRIGATÓRIAS

### 1. ARQUITETURA & ORGANIZAÇÃO DE CÓDIGO
- **Estrutura de pastas:** App Router vs features vs components — há conflitos? Duplicação?
- **Padrões de componente:** Server vs Client Components bem separados? `use client` abusivo?
- **Estado global vs local:** React Query, localStorage, Context — onde vive cada coisa?
- **Reutilização real:** Quantos componentes são *true* shared vs copy-paste com variações?
- **Dashboards monolíticos:** 3 ficheiros >35k bytes — violam Single Responsibility?
- **Setup Wizard:** 30k linhas num só ficheiro — como dividir?
- **Barrel exports & path aliases:** `@/` usado consistentemente?
- **TypeScript:** `strict: false` no tsconfig — quantos `any` escapam?

### 2. LANDING PAGE & PRIMEIRA IMPRESSÃO (`page.tsx` + `landing-page.tsx`)
- **Hero:** Clareza da proposta de valor em <3s? "Aldeia para o Futuro" ressoa?
- **CTAs:** "Criar Conta Grátis" vs "Já tenho conta" — hierarquia visual correta?
- **Social proof:** Stats (aldeias, utilizadores, angariado) — são reais? Atualizam?
- **Jogos em destaque:** 4 cards — mostram preço, stock, tipo. Falta "como jogar"?
- **Eventos & Aldeias:** Secções condicionais — empty states bem tratados?
- **Acessibilidade:** `aria-label`, heading hierarchy (h1→h2→h3), focus visible?
- **Performance:** Imagens `loading="lazy"`? Fonts `display: swap`? Preconnect?
- **Mobile-first:** Breakpoints `md:`, `lg:` usados corretamente? Touch targets ≥44px?

### 3. AUTENTICAÇÃO & ONBOARDING (`page.tsx` modals + `setup-wizard.tsx`)
- **Login/Register modais:** Validação client-side + server-side consistente?
- **2FA (TOTP):** Fluxo completo? QR code, backup codes, recovery?
- **Social login:** Google + Apple — botões nativos ou redirect?
- **Dev mode shortcuts:** 4 botões hardcoded em produção? (linhas 366-416 `page.tsx`)
- **Setup Wizard:** 30k linhas — quantos passos? Ramificação por role? Persistência de progresso?
- **Error handling:** Toast `sonner` + inline errors — mensagens em PT-PT claras?
- **Redirect pós-login:** `ROLE_PATHS` mapeia 4 roles — edge cases (role desconhecido)?

### 4. DASHBOARDS POR ROLE (4 experiências distintas)
| Dashboard | Role | Ficheiro Principal | Páginas Filhas |
|-----------|------|-------------------|----------------|
| **Super Admin** | `super_admin` | `superadmindashboard/page.tsx` | cofre, financeiro, permissions |
| **Admin Aldeia** | `aldeia_admin` | `admindashboard/page.tsx` | cofre, financeiro, euromilhoes, pedidos |
| **Vendedor** | `vendedor` | `vendedordashboard/page.tsx` | POS, cashbox, pedidos inline |
| **Cliente** | `user` | `clientedashboard/page.tsx` | participações, perfil, carteira |

**Para CADA dashboard, analisa:**
- **Layout shell:** Sidebar + header + conteúdo — consistente? Responsivo (mobile drawer)?
- **Navegação:** Tabs, breadcrumbs, deep linking — estado partilhável via URL?
- **Data fetching:** React Query? SWR? `useEffect` manual? Loading/skeleton/error states?
- **Permissões:** `hasRole()` no cliente + middleware no servidor — alinhados?
- **Ações primárias:** Claras (CTA destacado)? Secundárias acessíveis mas não competem?
- **Empty states:** "Ainda não tens jogos" → CTA para criar/participar?
- **Real-time:** Notificações (polling 30s), WebSockets? Atualização otimista?

### 5. JOGOS — FLUXO DE PARTICIPAÇÃO (4 jogos, 4 páginas)
| Jogo | Ficheiro | Mecânica | Complexidade UI |
|------|----------|----------|-----------------|
| **Euromilhões** | `jogos/euromilhoes/page.tsx` (879 lin) | Grid 5×10, grelhas semanais, sorteio sexta | Alta |
| **Poio da Vaca** | `jogos/poio-da-vaca/page.tsx` (1004 lin) | Campo X×Y coordenadas, vaca "defeca" | Alta |
| **Raspadinha Premium** | `jogos/raspadinha-premium/page.tsx` (1285 lin) | Canvas 3×3 raspar, provably fair, audio | Muito Alta |
| **Rifa** | `jogos/rifa/page.tsx` (968 lin) | Números 1-N, blocos, QR code | Média |

**Critérios de análise por jogo:**
- **Onboarding:** Tutorial/primeira vez — explica mecânica sem texto excessivo?
- **Seleção:** Grid/inputs intuitivos? Limites visuais (máx 50, 20, etc.)?
- **Ocupados:** Estados (livre, selecionado, meu, ocupado) — cores + ícones + tooltip?
- **Aleatório:** "Escolher X números" — distribuí uniformemente? Evita colisões?
- **Formulário cliente:** Nome + (telefone/email) — validação PT-PT (9 dígitos, +351)?
- **Pagamento:** `PaymentSelector` — 5 métodos (dinheiro, saldo, MBWay, Stripe, transferência). Regras por role (`dinheiro` só vendedor/admin) — UI desativa/esconde corretamente?
- **Confirmação:** Modal com resumo (números, preço, hash verificação) — copiável?
- **Pós-participação:** "Participar Novamente" limpa estado corretamente? Navegação back?
- **Acessibilidade:** Canvas (raspadinha) — fallback para não-pointer? ARIA labels?
- **Provably Fair (Raspadinha):** `seedRaspe`, `hashRaspe`, `claimPremio` — fluxo compreensível?

### 6. SISTEMA FINANCEIRO (Cofre, Cashbox, Wallet)
- **Conceitos 3 bolsos:** `Vendedor.Cashbox` → `Vault (Cofre)` → `Player.Wallet` — UI explica?
- **Admin Cofre (`admindashboard/cofre/`):** Pedidos depósito, reconciliação, export CSV
- **Super Admin Cofre (`superadmindashboard/cofre/`):** Visão global aldeias, movements feed
- **Vendedor Cashbox (`vendedor-cashbox.tsx`):** Saldo, transações, criar pedido depósito
- **Wallet (`clientedashboard`):** Saldo, transações, cashback 5%, top-up (Stripe/MBWay)
- **Notificações financeiras:** `deposito_criado`, `deposito_confirmado`, `deposito_rejeitado` — toast + bell

### 7. COMPONENTES PARTILHADOS & DESIGN SYSTEM
- **shadcn/ui base:** 40+ componentes — customizados? Tokens CSS em `globals.css`?
- **Design tokens:** Cores (HSL), spacing, radius, typography — documentados? Dark mode real?
- **Componentes próprios:** `LayoutHeader`, `BottomNav`, `GameList`, `PaymentSelector`, `NotificationBell`, `UserMenuModal`, `VictoryCelebration`, `GameTutorial`, `Gamification`
- **Padrões de composição:** `className` + `cn()` (clsx/tailwind-merge) — consistente?
- **Acessibilidade base:** `AccessibleButton`, `AccessibleModal`, `A11yProvider` — usados?

### 8. HOOKS & LÓGICA DE NEGÓCIO NO CLIENTE
| Hook | Responsabilidade | Linhas | Dependências |
|------|------------------|--------|--------------|
| `useAuth` | Login, register, 2FA, user state | ~200 | `api-client`, `localStorage` |
| `useJogos` | Fetch jogos, participar | ~150 | `api-client` |
| `usePagamento` | Stripe, MBWay, saldo | ~200 | `api-client` |
| `useParticipacoes` | Listar, filtrar participações | ~150 | `api-client` |
| `useNotificacoes` | Polling 30s, mark read | ~100 | `api-client` |
| `useScratchSound` | AudioContext raspar | ~50 | — |
| `useOfflineDetection` | Navigator.onLine + eventos | ~50 | — |

- **Lógica duplicada:** `fetchJogo`, `fetchNumerosOcupados`, `processarPagamento` replicados em 4 páginas de jogo?
- **Race conditions:** `numerosOcupados` refreshed após participação? Optimistic updates?
- **Error boundaries:** Existem? Onde? Capturam erros de canvas/audio?

### 9. MIDDLEWARE & SEGURANÇA CLIENTE
- **`middleware.ts` (1966 lin):** Auth, RBAC, rate limiting, CSP headers, rewrites
- **JWT:** 30d expiry, `httpOnly` cookie? Refresh token rotation?
- **RBAC client-side:** `hasRole()`, `PermissionsMatrix` — espelha servidor?
- **Rate limiting:** Em memória (Map) — perde em restart. Redis planeado?
- **CSP:** `unsafe-inline`, `unsafe-eval` — necessário? Nonces implementados?

### 10. PERFORMANCE & BUNDLE
- **Bundle analyzer:** Rodou? Tamanho JS inicial (gzipped)?
- **Code splitting:** `React.lazy` + `Suspense` em dashboards/jogos pesados?
- **Images:** `next/image` usado? `loading="lazy"`? Formatos modernos (AVIF/WebP)?
- **Fonts:** 5 Google Fonts (Inter, Noto Serif, Plus Jakarta, Chakra Petch, Russo One) — `preload`? Subset?
- **Third-party:** `framer-motion`, `canvas-confetti`, `sonner`, `lucide-react`, `@radix-ui/*` — tree-shaking?
- **React Query:** Cache time, stale time, prefetch nas rotas críticas?
- **Service Worker / PWA:** `offline-provider` existe — `manifest.json`, SW registado?

### 11. ACESSIBILIDADE (WCAG 2.1 AA)
- **Contraste:** Tokens CSS `--foreground`/`--background` — testados em light/dark?
- **Teclado:** `Tab` order lógico? `focus-visible` visível em todos os interativos?
- **Leitores de ecrã:** `aria-label`, `aria-describedby`, `role="alert"` (toasts), `aria-live`?
- **Canvas (Raspadinha):** Fallback não-visual? Descrição do prémio em texto?
- **Formulários:** `Label` associado (`htmlFor` + `id`), `aria-invalid`, `aria-describedby` para erros?
- **Modais:** `Dialog` (Radix) — focus trap, `Escape` fecha, `Tab` cicla?
- **Skip link:** "Saltar para conteúdo principal" no `layout-header`?

### 12. INTERNACIONALIZAÇÃO & LOCALIZAÇÃO (PT-PT)
- **Datas:** `toLocaleDateString('pt-PT')` — consistente?
- **Moeda:** `toFixed(2) + '€'` ou `Intl.NumberFormat('pt-PT', {style:'currency',currency:'EUR'})`?
- **Telefone:** Validação +351 9XX XXX XXX — máscara input?
- **Textos hardcoded:** Quantos strings em PT-PT espalhados nos componentes? i18n planeado?

### 13. TESTES & QUALIDADE
- **Vitest:** Configurado (`vitest.config.ts`) — testes unitários? Quantos?
- **Playwright:** Configurado (`playwright.config.ts`) — E2E? Fluxos críticos cobertos?
- **Cypress:** Pasta `cypress/` existe — specs?
- **Lint/Format:** ESLint + Prettier configurados? `strict: false` no TS — porquê?
- **CI/CD:** GitHub Actions (`.github/`) — lint, typecheck, test, build?

### 14. OBSERVABILIDADE & ERROS
- **Sentry:** `sentry-init.tsx` — DSN configurado? Source maps upload?
- **Logs:** `logger.ts` — níveis, contexto, PII filtering?
- **Analytics:** `analytics-init.tsx` — eventos customizados? RGPD compliant?
- **Error Boundary:** Onde? Captura erros de canvas, audio, auth?

---

## 📋 ENTREGÁVEIS ESPERADOS

### 1. RELATÓRIO EXECUTIVO (1-2 páginas)
- Score geral (0-10) por área: Arquitetura, UX, Performance, A11y, Manutenibilidade
- **Top 5 riscos críticos** (security, UX breakers, dívida técnica bloqueante)
- **Top 5 quick wins** (esforço baixo, impacto alto)
- Recomendação: **Refactor incremental vs Rewrite módulo a módulo**

### 2. ANÁLISE DETALHADA POR ÁREA (formato tabela + narrativa)
Para cada uma das 14 áreas acima:
- ✅ **O que está bem** (exemplos concretos com ficheiro:linha)
- ⚠️ **O que precisa melhorar** (problema + impacto no utilizador/dev)
- 🔧 **Sugestão concreta** (código/padrão/ferramenta)
- 📊 **Prioridade:** P0 (crítico), P1 (alto), P2 (médio), P3 (baixo)
- ⏱️ **Esforço estimado:** XS/S/M/L/XL

### 3. PLANO DE AÇÃO PRIORIZADO (Roadmap)
| Sprint | Foco | Tarefas-chave | Owner | Critério de Aceite |
|--------|------|---------------|-------|-------------------|
| 1 | Segurança & Fundações | JWT secret, rate limit Redis, CSP nonces, TS strict | DevOps + Lead | Build passa `strict: true`, 0 `any` |
| 2 | Arquitetura Dashboards | Extrair `AdminDashboard` → features/admin/components/* | Frontend Lead | Cada ficheiro < 500 lin, 0 duplicação |
| 3 | Jogos — Refatoração Comum | `GameBase`, `NumberGrid`, `PaymentFlow` shared | 2 Devs | 4 jogos usam 80% código partilhado |
| 4 | Acessibilidade & UX | Audit WCAG, focus visible, skip links, canvas fallback | UX + Dev | Lighthouse A11y ≥ 95 |
| 5 | Performance | Code splitting, React Query tuning, bundle < 200KB gz | Frontend Lead | LCP < 2.5s, TBT < 200ms |
| 6 | Testes & CI | Vitest (unit), Playwright (E2E 5 fluxos), GitHub Actions | QA + Dev | Coverage ≥ 60%, 0 flaky |

### 4. ANEXOS TÉCNICOS
- **Mapa de duplicação:** Componentes/funções copiadas entre jogos/dashboards (ferramenta: `jscpd` ou manual)
- **Grafo de dependências:** `madge` ou `dependency-cruiser` — circular deps?
- **Bundle report:** `next-bundle-analyzer` output (top 20 modules)
- **Lighthouse CI:** Relatório completo (Performance, A11y, Best Practices, SEO, PWA)
- **Acessibilidade:** `axe-core` ou `eslint-plugin-jsx-a11y` report

---

## 🎯 CRITÉRIOS DE SUCESSO DA ANÁLISE
A análise será considerada **excelente** se:
1. **Cita ficheiros e linhas reais** (não generalidades) — ex: "`features/admin/AdminDashboard.tsx:1200-1350` duplica lógica de `financeiro-overview.tsx`"
2. **Prioriza pelo impacto no utilizador final** (conversão, confiança, acessibilidade) não só "clean code"
3. **Propõe soluções concretas** (snippets, padrões, libs) não "melhorar X"
4. **Identifica dívida técnica oculta** (ex: `setup-wizard.tsx` 30k linhas, dev buttons em produção)
5. **Equilibra refatoração vs entrega de features** — roadmap realista
6. **Fala PT-PT** (não PT-BR) — "utilizador", "ecrã", "ficheiro", "angariação"

---

## 🚀 COMO USAR ESTE PROMPT

1. **Copia todo o bloco acima** (do `# ANÁLISE PROFISSIONAL` até aqui)
2. **Cola numa nova conversa** com a IA da tua escolha (Claude 3.5 Sonnet, GPT-4o, etc.)
3. **Anexa o repositório** se a IA suportar (GitHub link, zip, ou `git clone` instructions)
4. **Diz à IA:** *"Analisa conforme o prompt. Entrega em Markdown estruturado. Prioriza acionabilidade."*
5. **Itera:** Pede aprofundamento nas áreas mais críticas (ex: "Faz deep-dive só nos 4 jogos")

---

## 💡 DICA PRO
Se a IA não tiver acesso ao código real, dá-lhe estes **ficheiros-chave** primeiro (ordem de importância):
1. `src/app/page.tsx` (landing + auth)
2. `src/components/landing-page.tsx`
3. `src/features/admin/AdminDashboard.tsx`
4. `src/features/vendedor/vendedor-dashboard.tsx`
5. `src/features/cliente/cliente-dashboard.tsx`
6. `src/app/jogos/euromilhoes/page.tsx`
7. `src/app/jogos/poio-da-vaca/page.tsx`
8. `src/app/jogos/raspadinha-premium/page.tsx`
9. `src/app/jogos/rifa/page.tsx`
10. `src/middleware.ts`
11. `src/app/globals.css` (design tokens)
12. `package.json` + `tsconfig.json` + `next.config.js`

---

**Boa análise!** 🎮🇵🇹  
*Qualquer dúvida sobre o código real, avisa — eu tenho o repo aberto aqui.*