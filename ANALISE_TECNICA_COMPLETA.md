# 🔍 ANÁLISE TÉCNICA COMPLETA — Aldeias Games

> **Data**: Abril 2026 | **Versão**: 3.12.0 | **Estado**: Pré-produção

---

## 1. Visão Geral – O que o Sistema Faz Atualmente

O **Aldeias Games** é uma plataforma SaaS multi-tenant construída com **Next.js 16 (App Router)**, **Prisma ORM**, **TypeScript** e **PostgreSQL**, destinada a digitalizar jogos tradicionais portugueses de angariação de fundos (Poio da Vaca, Rifa/Tombola, Raspadinhas Digitais) para comunidades locais (aldeias, escolas, clubes, associações de pais).

### Funcionalidades principais implementadas:
- **4 tipos de jogos**: Poio da Vaca (grelha de coordenadas), Rifa, Tombola, Raspadinhas Digitais
- **Pagamentos**: Stripe (checkout sessions) e MBWay (API real com sandbox)
- **Carteira digital** com saldo, extrato e carregamentos
- **Cashback automático** de 5% em compras confirmadas
- **Sistema de sorteios** com auditoria SHA-256
- **Notificações** in-app, email (Nodemailer) e SMS (Twilio/AWS SNS)
- **2FA (TOTP)** para admins
- **PWA** instalável
- **Analytics** com gráficos (Recharts)
- **Sistema de planos SaaS** com limites (max eventos, jogos, vendedores)
- **Backups** (JSON-based)
- **Comissões** para vendedores

### Os 4 Roles e o que cada um faz:

| Role | Capabilidades |
|------|--------------|
| **Super Admin** (`super_admin`) | Gestão global de todas as organizações, eventos, jogos, utilizadores. Visualização de transações globais, logs de auditoria, analytics global, ajuste de saldos, testes de jogos em modo fictício. |
| **Aldeia Admin** (`aldeia_admin`) | Gestão de eventos, jogos, vendedores e prémios da **sua** organização. Execução de sorteios, conversão de prémios em saldo, verificação de hash de participações. Não acede a dados de outras aldeias. |
| **Vendedor** (`vendedor`) | POS Mobile para registo de vendas, acompanhamento de comissões pessoais, histórico de vendas, modo offline (localStorage). Não pode criar/editar eventos ou jogos. |
| **Cliente/Jogador** (`user`) | Carteira digital, participação em jogos (compra de rifas, raspadinhas, poio da vaca), histórico de participações, carregamento de saldo. Sem acesso a funcionalidades administrativas. |

---

## 2. Análise Arquitetural e de Código

### ✅ Pontos Fortes

1. **Feature-based architecture**: A divisão `src/features/{admin,cliente,vendedor}` é correta e escalável.
2. **Validação com Zod**: Todas as rotas API usam schemas Zod — excelente prática.
3. **Transações atómicas**: O `participacoes/route.ts` usa `prisma.$transaction` com locking condicional (`stockAtual: { gte: ... }`) para prevenir race conditions — muito bom.
4. **Hash de verificação SHA-256** em participações e sorteios para auditoria.
5. **Isolamento multi-tenant**: As queries filtram corretamente por `aldeiaId` para `aldeia_admin` e `vendedor`.
6. **Prisma singleton pattern**: O `globalForPrisma` previne múltiplas conexões em dev.
7. **Paginação** implementada consistentemente.

### ❌ Problemas, Code Smells e Más Práticas

#### 2.1. `src/app/page.tsx` — Monstro de 959 linhas
- **CRÍTICO**: A página principal mistura landing page, login, registo, dashboards de todos os 4 roles, e UI de visitante. Viola o princípio de responsabilidade única.
- Duplicação massiva de código de login/logout entre `page.tsx` e `use-auth.ts`.
- O `quickLogin` com passwords hardcoded (`"123456"`) **em produção** é uma vulnerabilidade grave.

#### 2.2. Inconsistência de autenticação
- **Duas abordagens coexistem**: `use-auth.ts` (client-side com localStorage) + `getFullUserFromRequest` (server-side via Bearer token). Não há cookies HTTP-only — os tokens JWT ficam expostos a XSS no `localStorage`.
- O `proxy.ts` autentica via Bearer token mas **não existe `src/middleware.ts`** — o ficheiro de middleware do Next.js está em falta. O `proxy.ts` é um ficheiro solto que não é automaticamente invocado pelo Next.js.

#### 2.3. `src/app/api/jogos/revelar-raspadinha/route.ts` — Código morto/perigoso
- Cria uma **nova instância do PrismaClient** (`new PrismaClient()`) em vez de usar o singleton — memory leak garantido.
- **Sem autenticação** — qualquer um pode chamar este endpoint.
- Usa `Math.random()` para determinar vitória — **não é determinístico nem auditável**.
- A função `generateVerificationHash` usa um hash caseiro (djb2) em vez de SHA-256.
- Este endpoint **contradiz** a lógica de raspadinha já implementada em `participacoes/route.ts`.

#### 2.4. `src/app/api/backup/route.ts` — Perigoso
- Exporta **todas as passwords hash** dos utilizadores no JSON de backup.
- O restore é apenas preview — não há implementação real de restore.
- Em Vercel (serverless), o sistema de ficheiros é **ephemeral** — os backups desaparecem após cada deploy.

#### 2.5. `src/app/api/wallet/carregar/route.ts`
- Qualquer vendedor/admin pode carregar o **seu próprio saldo** sem verificação de pagamento real — basta enviar um POST com `valor` e `metodoCarregamento: "dinheiro"`. Isto permite inflação artificial de saldo.
- Usa `(prisma.transacao as any)` — cast `as any` indica que o schema não suporta os campos usados.
- Notificações criadas com `userId: admin.email` — o campo `userId` espera um ID de utilizador (String), não um email.

#### 2.6. TypeScript
- Uso excessivo de `as any` em múltiplos ficheiros.
- O campo `configuracao` do modelo `Jogo` é `String` (JSON serializado) em vez de `Json` — perde-se type safety.
- Não há tipos gerados pelo Prisma sendo usados corretamente — muitos `Record<string, unknown>` e `any`.

#### 2.7. Estado do cliente
- **Zustand** está nas dependencies mas **não é usado em lado nenhum**. Todo o estado é gerido via `useState`/`localStorage` no `use-auth.ts`.
- **React Query** também não é usado — os hooks (`use-jogos.ts`, `use-eventos.ts`) fazem fetch manual sem cache.

#### 2.8. Multi-tenancy
- O isolamento é feito a nível de query (WHERE `aldeiaId`) — funciona, mas não há row-level security no PostgreSQL.
- O `aldeiaId` é opcional no modelo `User`, o que significa que utilizadores podem existir sem organização — potencial fuga de dados se uma query esquecer o filtro.

---

## 3. Análise de Experiência do Utilizador (UX/UI)

### Pontos positivos:
- Landing page visualmente apelativa com design editorial
- Dark mode com theme provider
- Bottom navigation para mobile
- Quick actions por role
- Victory celebration com confetti
- Tutorial de jogos implementado
- Seletor de organização pesquisável para Super Admin
- Testar jogo em modo fictício

### Pontos de Fricção:

| Problema | Severidade |
|----------|-----------|
| **Tudo na `page.tsx`** — o utilizador vê a landing page e dashboards misturados | Alta |
| **Quick login buttons com passwords visíveis** na UI de produção | Crítica |
| **Sem skeleton screens** — loading states são genéricos | Média |
| **Sem empty states** informativos quando não há dados | Média |
| **Tabelas não responsivas** em mobile | Alta |
| **Sem keyboard navigation** nem ARIA labels | Média |
| **Sem onboarding** para novos utilizadores de cada role | Alta |
| **Landing page mistura** conteúdo logged-in e logged-out | Alta |
| **Sem notificações push** em tempo real para ganhos | Alta |

---

## 4. Análise de Segurança (SEÇÃO MAIS IMPORTANTE)

### 4.1. Autenticação — ⚠️ VULNERÁVEL

| Vulnerabilidade | Severidade | Descrição |
|-----------------|-----------|-----------|
| **JWT no localStorage** | 🔴 CRÍTICA | Tokens armazenados em `localStorage` são acessíveis a qualquer script XSS. Devem ser cookies `httpOnly`, `secure`, `sameSite=strict`. |
| **Quick login com passwords hardcoded** | 🔴 CRÍTICA | `page.tsx` tem botões que fazem login com `"123456"`. Se chegar a produção, qualquer pessoa pode fazer login como admin. |
| **Sem middleware.ts** | 🔴 CRÍTICA | O `proxy.ts` existe mas **não é invocado pelo Next.js**. O Next.js App Router requer `src/middleware.ts`. Sem middleware, **todas as rotas de página são públicas**. |
| **Token JWT com expiração de 7 dias** | 🟡 Média | 7 dias é demasiado longo para tokens de acesso. Deveria ser 15min-1h com refresh tokens. |
| **Sem proteção contra brute force real** | 🟡 Média | O rate limit é em memória — reinicia com cada restart do servidor. |
| **Sem account lockout** | 🟡 Média | Após N falhas de login, a conta não é bloqueada. |

### 4.2. Autorização (RBAC) — ⚠️ PARCIALMENTE FUNCIONAL

| Problema | Severidade | Descrição |
|----------|-----------|-----------|
| **RBAC apenas nas API routes** | 🔴 CRÍTICA | Sem `middleware.ts`, as páginas não têm proteção. Qualquer utilizador autenticado pode aceder a qualquer dashboard via URL direto. |
| **`proxy.ts` não é usado** | 🔴 CRÍTICA | O ficheiro existe mas não está registado como middleware do Next.js. |
| **Proteção de rota inconsistente** | 🟡 Alta | Algumas rotas verificam `getFullUserFromRequest`, outras não. |

### 4.3. Rate Limiting — ⚠️ INSUFICIENTE PARA PRODUÇÃO

| Problema | Severidade |
|----------|-----------|
| **Rate limit em memória** (`Map`) | Alta — não funciona em serverless/multi-instância |
| **Login: 100 req/15min** — demasiado permissivo | Alta — permite brute force distribuído |
| **Sem rate limit por utilizador** (apenas por IP) | Média |
| **Sem headers `Retry-After`** na resposta 429 | Baixa |

### 4.4. Pagamentos (Stripe + MBWay) — ⚠️ RISCOS SIGNIFICATIVOS

| Problema | Severidade | Descrição |
|----------|-----------|-----------|
| **Stripe webhook sem idempotência** | 🔴 CRÍTICA | O webhook não verifica se o evento já foi processado (`event.id`). Webhooks duplicados criam participações e cashback duplicados. |
| **MBWay webhook sem verificação obrigatória de signature** | 🔴 CRÍTICA | A validação de signature é condicional — se a variável não estiver definida, o webhook aceita qualquer payload. |
| **Saldo inflacionável** | 🔴 CRÍTICA | O `wallet/carregar/route.ts` permite a qualquer vendedor/admin adicionar saldo sem verificação de pagamento real. |
| **Cashback duplicado** | 🟡 Alta | O cashback é aplicado em 3 lugares diferentes sem verificação de duplicação. |
| **Sem reconciliação financeira** | 🟡 Alta | Não há processo de reconciliação entre pagamentos recebidos e saldo atribuído. |

### 4.5. Vulnerabilidades de Segurança Web

| Vulnerabilidade | Severidade | Descrição |
|-----------------|-----------|-----------|
| **XSS via localStorage** | 🔴 CRÍTICA | Tokens e dados do utilizador em localStorage são acessíveis a scripts maliciosos. |
| **Path Traversal no backup** | 🟡 Alta | O `backup/route.ts` usa `filename` diretamente no path sem sanitização. |
| **Armazenamento de IBAN em plaintext** | 🟡 Alta | O modelo `Aldeia` armazena `iban` sem encriptação. |
| **Dados sensíveis em logs** | 🟡 Média | `console.log` com dados de pagamento pode vazar informação. |
| **SQL Injection** | ✅ Baixo | Prisma parametriza queries automaticamente. |

### 4.6. Conformidade RGPD / Legislação Portuguesa

| Requisito | Estado |
|-----------|--------|
| **Consentimento explícito** | ❌ Não implementado |
| **Direito ao esquecimento** | ❌ Não implementado |
| **Portabilidade de dados** | ❌ Parcial |
| **DPO / Responsável de dados** | ❌ Não identificado |
| **Política de privacidade** | ✅ Existe página `/privacidade` |
| **Termos de serviço** | ✅ Existe página `/termos` |
| **Jogos de sorte/azar — licenciamento** | ⚠️ Não abordado |
| **Menores de idade** | ❌ Sem verificação de idade |
| **Retenção de dados** | ❌ Sem política de expiração |

### 4.7. Auditoria de Sorteios (SHA-256)

| Aspeto | Avaliação |
|--------|-----------|
| **Seed aleatória** | ✅ `crypto.randomBytes(32)` — criptograficamente segura |
| **Hash SHA-256** | ✅ Implementado corretamente |
| **Verificação pública** | ✅ Modal `verificar-hash-modal.tsx` existe |
| **Determinismo** | ⚠️ O sorteio usa `Math.random()` — o hash é gerado **depois** do resultado |
| **Commit-reveal** | ❌ Não implementado — o hash deveria ser gerado **antes** do sorteio |

### 4.8. Recomendações Prioritárias de Segurança

1. **IMEDIATO**: Criar `src/middleware.ts` com autenticação e proteção de rotas por role
2. **IMEDIATO**: Remover quick login buttons com passwords hardcoded
3. **IMEDIATO**: Migrar JWT de localStorage para cookies `httpOnly`
4. **IMEDIATO**: Implementar idempotência no Stripe webhook
5. **IMEDIATO**: Tornar obrigatória a verificação de signature no MBWay webhook
6. **URGENTE**: Eliminar ou proteger o endpoint `revelar-raspadinha`
7. **URGENTE**: Implementar rate limiting com Redis/Upstash
8. **URGENTE**: Sanitizar filename no backup route (path traversal)
9. **URGENTE**: Adicionar verificação de pagamento real no carregamento de saldo
10. **IMPORTANTE**: Implementar commit-reveal para sorteios

---

## 5. O que Deve Ser Melhorado (Melhorias / Refactoring)

### Prioridade 1 — Crítica
1. **Criar `src/middleware.ts`** — Sem isto, não há proteção de rotas de página
2. **Migrar auth para cookies httpOnly** — Eliminar localStorage para tokens
3. **Remover quick login de produção** — Ou proteger com feature flag
4. **Implementar idempotência nos webhooks** — Stripe e MBWay
5. **Eliminar `revelar-raspadinha/route.ts`** — Código contraditório e inseguro

### Prioridade 2 — Alta
6. **Refatorar `page.tsx`** — Separar em: `LandingPage`, `AuthModals`, `DashboardRouter`
7. **Implementar Redis/Upstash para rate limiting** — O Map em memória não funciona em produção
8. **Adicionar testes unitários e E2E** — Playwright está nas deps mas sem testes
9. **Corrigir TypeScript** — Eliminar `as any`, usar tipos do Prisma corretamente
10. **Implementar commit-reveal para sorteios** — Hash antes, resultado depois

### Prioridade 3 — Média
11. **Adicionar skeleton screens e empty states**
12. **Implementar React Query** para cache de dados
13. **Usar Zustand** (já está instalado) para estado global
14. **Sanitizar inputs de utilizador** antes de renderizar
15. **Adicionar Content Security Policy (CSP)** headers
16. **Implementar health check** endpoint mais completo
17. **Adicionar logging estruturado** (JSON) em vez de `console.log`

### Prioridade 4 — Baixa
18. **Otimizar bundle** — 5 fonts Google, muitas dependências
19. **Implementar image optimization** — `unoptimized: true` no next.config
20. **Adicionar sourcemaps** apenas em dev

---

## 6. O que Deve Ser Acrescentado (Novas Funcionalidades)

### Impacto Alto
| Feature | Justificação |
|---------|-------------|
| **Sistema de convites por link/QR code** | Vendedores e admins precisam de partilhar jogos facilmente |
| **Notificações push (Web Push API)** | Jogadores precisam de saber quando ganham em tempo real |
| **Dashboard financeiro com reconciliação** | Admins precisam de ver pagamentos reais vs saldo atribuído |
| **Exportação de relatórios (CSV/PDF)** | Para prestação de contas e conformidade legal |
| **Sistema de convites para vendedores** | Admins convidam vendedores por email com link de registo |
| **Prova de jogo (commit-reveal)** | Hash gerado antes do sorteio, revelado depois — transparência real |

### Impacto Médio
| Feature | Justificação |
|---------|-------------|
| **Programa de referral** | Crescimento orgânico da plataforma |
| **Gamificação (badges, níveis)** | Aumenta engagement dos jogadores |
| **Modo kiosk para eventos presenciais** | Tablet com QR code para participantes jogarem no local |
| **Integração com Multibreferência** | Pagamento via referências MB (muito usado em Portugal) |
| **Dashboard de saúde da plataforma** (Super Admin) | Métricas reais de receita, churn, atividade |
| **Sistema de tickets de suporte** | Para aldeias reportarem problemas |

### Impacto Baixo (mas valorizam o produto)
| Feature | Justificação |
|---------|-------------|
| **Tradução para inglês** | Para comunidades portuguesas no estrangeiro |
| **API pública documentada** | Para integrações futuras |
| **Webhooks para aldeias** | Notificações externas de eventos |
| **Dark/Light mode toggle** visível | Acessibilidade |

---

## 7. O que Deve Ser Removido ou Simplificado

| O quê | Porquê |
|-------|--------|
| **`src/app/api/jogos/revelar-raspadinha/route.ts`** | Código contraditório, sem auth, usa `Math.random()`, cria PrismaClient duplicado |
| **Quick login buttons na `page.tsx`** | Segurança crítica — passwords hardcoded na UI |
| **`src/app/api/backup/route.ts`** (restore) | Não funciona em Vercel (filesystem ephemeral), exporta passwords |
| **Zustand nas dependencies se não é usado** | Ou usar ou remover do package.json |
| **React Query nas dependencies se não é usado** | Idem |
| **`generateCode()` com `Math.random()`** | Usar `crypto.randomBytes` para códigos |
| **Duplicação de lógica de auth** entre `page.tsx` e `use-auth.ts` | Unificar num só sítio |
| **Campos excessivos no modelo `Jogo`** | 15+ campos financeiros que poderiam ser calculados on-the-fly |
| **`console.log` e `console.error` em produção** | Substituir por logger estruturado |
| **`OPENROUTER_API_KEY`, `GITHUB_TOKEN`, `NEON_API_KEY` no `.env.example`** | Não são usados no código atual — ruído |

---

## 8. Recomendações Finais Priorizadas

| Prioridade | Item | Tipo | Esforço | Impacto |
|------------|------|------|---------|---------|
| P0 | Criar `src/middleware.ts` com auth + RBAC | Segurança | 2h | Crítico |
| P0 | Remover quick login com passwords hardcoded | Segurança | 15min | Crítico |
| P0 | Migrar JWT para cookies httpOnly | Segurança | 4h | Crítico |
| P0 | Idempotência no Stripe webhook | Segurança | 1h | Crítico |
| P0 | Signature obrigatória no MBWay webhook | Segurança | 30min | Crítico |
| P1 | Eliminar `revelar-raspadinha/route.ts` | Segurança/Remover | 15min | Alto |
| P1 | Rate limiting com Redis/Upstash | Segurança | 3h | Alto |
| P1 | Path traversal no backup route | Segurança | 30min | Alto |
| P1 | Proteção contra saldo inflacionável | Segurança | 2h | Alto |
| P1 | Refatorar `page.tsx` (959 linhas) | Melhoria | 8h | Alto |
| P1 | Commit-reveal para sorteios | Segurança | 4h | Alto |
| P2 | Eliminar `as any` e corrigir TypeScript | Melhoria | 6h | Médio |
| P2 | Implementar React Query | Melhoria | 4h | Médio |
| P2 | Skeleton screens + empty states | UX | 4h | Médio |
| P2 | CSP headers | Segurança | 1h | Médio |
| P2 | Logging estruturado (JSON) | Melhoria | 2h | Médio |
| P3 | Notificações push (Web Push) | Adicionar | 8h | Médio |
| P3 | Dashboard financeiro com reconciliação | Adicionar | 6h | Médio |
| P3 | Exportação de relatórios CSV/PDF | Adicionar | 4h | Médio |
| P3 | Conformidade RGPD (consentimento, direito ao esquecimento) | Segurança | 8h | Alto |
| P3 | Remover deps não usadas | Remover | 30min | Baixo |
| P3 | Otimizar bundle (fonts, images) | Performance | 2h | Médio |

### Roadmap Sugerido Antes do Lançamento

**Semana 1 — Segurança Crítica**
- [ ] Criar middleware.ts com proteção de rotas
- [ ] Remover quick login de produção
- [ ] Migrar para cookies httpOnly
- [ ] Idempotência nos webhooks
- [ ] Eliminar revelar-raspadinha
- [ ] Path traversal fix
- [ ] Proteção contra saldo inflacionável

**Semana 2 — Refactoring e Qualidade**
- [ ] Refatorar page.tsx
- [ ] Corrigir TypeScript (eliminar `as any`)
- [ ] Redis/Upstash rate limiting
- [ ] Commit-reveal para sorteios
- [ ] Logging estruturado

**Semana 3 — UX e Funcionalidades**
- [ ] Skeleton screens + empty states
- [ ] React Query para cache
- [ ] Notificações push
- [ ] Dashboard financeiro

**Semana 4 — RGPD e Produção**
- [ ] Consentimento explícito
- [ ] Direito ao esquecimento
- [ ] Exportação de dados
- [ ] CSP headers
- [ ] Testes E2E com Playwright
- [ ] Load testing
- [ ] Documentação de deploy

---

## Veredito Final

O projeto tem uma **base sólida** com boa estrutura de features, validação Zod, e transações atómicas. No entanto, **não está pronto para produção** na sua forma atual. As vulnerabilidades de segurança (falta de middleware, tokens em localStorage, quick login com passwords hardcoded, webhooks sem idempotência) são **bloqueantes** para qualquer lançamento.

Com **2-4 semanas de trabalho focado** nas prioridades P0 e P1, a plataforma pode tornar-se segura, profissional e competitiva.
