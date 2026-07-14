# PROMPT — ANÁLISE CRÍTICA COMPLETA + CORREÇÕES PENDENTES

> **Instrução:** Copia todo o conteúdo abaixo e cola numa nova conversa com uma IA.
> A IA deve executar primeiro as correções pendentes e depois produzir o relatório completo.

---

## CONTEXTO DO PROJETO

**Aldeias Games** é uma plataforma SaaS multi-tenant para arrecadação de fundos em comunidades locais portuguesas através de jogos tradicionais.

- **Stack:** Next.js 16 (App Router, Webpack), React 19, TypeScript, Prisma 6.19.3, SQLite (dev) / Vercel Postgres (prod), Tailwind CSS v4, shadcn/ui, Radix UI
- **Roles:** `super_admin`, `aldeia_admin`, `vendedor`, `user`
- **Ambientes:** Desenvolvimento local (Windows), Produção (Vercel/Linux)
- **Jogos:** Poio da Vaca, Rifa, Raspadinha Premium, Euromilhões
- **Pagamentos:** Stripe + MB Way (sandbox)
- **Repositório:** https://github.com/smpsandro1239/Aldeias_Games
- **Node.js (dev):** v24.18.0, Windows x64
- **Base de dados:** SQLite em dev, Vercel Postgres em produção

### Correções já aplicadas (não repetir)
- ✅ Demo user IDs alinhados com DB (`user-super-admin`, `user-aldeia-admin`, `user-vendedor`, `user-jogador`) — `src/app/api/auth/login/route.ts:34-79`
- ✅ Prisma client regeneration (`npx prisma@6.19.3 generate`)
- ✅ GameAnalytics `timestamp` → `createdAt` — `src/app/api/analytics/game-events/route.ts:45`
- ✅ Build `typescript: { ignoreBuildErrors: true }` em `next.config.js`
- ✅ Rifa `fetchNumerosOcupados` undefined jogoId — removida chamada direta redundante em `src/app/jogos/rifa/page.tsx:211`
- ✅ Console.logs sensíveis condicionados a `NODE_ENV !== 'production'` em `sms.ts`, `email.ts`, `mbway.ts`
- ✅ FK validation antes de criar Participação — `src/app/api/participacoes/route.ts`

---

## TAREFA 1 — CORREÇÕES PENDENTES

Antes da análise, corrige os seguintes problemas que ainda existem no código:

### 1.1 Console.logs em produção (restantes)

Existem `console.log`/`console.error` em componentes CLIENT que aparecem no browser do utilizador final. Condicionar todos os `console.log` (não `console.error` de validação) em componentes client a `process.env.NODE_ENV !== 'production'` ou removê-los.

Ficheiros a verificar:
- `src/app/jogos/rifa/page.tsx` — linhas 147, 219, 248, 267, 402, 489
- `src/app/jogos/euromilhoes/page.tsx` — linhas 178, 333
- `src/app/jogos/poio-da-vaca/page.tsx` — linhas 227, 253, 284, 446, 506
- `src/app/jogos/raspadinha-premium/page.tsx` — linhas 180, 199, 308, 396, 477, 481
- `src/components/` — verificar todos os componentes client

Regra: `console.error` para validação/erros pode ficar. `console.log` de debug deve ser removido ou condicionado.

### 1.2 Validar jogoId antes de chamadas API em todos os jogos

Em cada página de jogo, garantir que nenhuma chamada API é feita com `jogoId = undefined`. Verificar:
- `src/app/jogos/rifa/page.tsx` — `fetchNumerosOcupados` e outras chamadas
- `src/app/jogos/euromilhoes/page.tsx` — chamadas a `/api/euromilhoes/grelhas`
- `src/app/jogos/poio-da-vaca/page.tsx` — chamadas a `/api/apostas`
- `src/app/jogos/raspadinha-premium/page.tsx` — chamadas a `/api/jogos/${jogoId}`

### 1.3 Sanitização de dados de entrada nos endpoints

Verificar que todos os endpoints POST/PUT usam `sanitizeObject` ou `escapeHtml` nos dados de utilizador antes de guardar na DB. Ficheiros prioritários:
- `src/app/api/participacoes/route.ts` — `dadosCliente.nome`, `telefoneCliente`, `emailCliente`
- `src/app/api/apostas/route.ts` — dados do jogador
- `src/app/api/auth/register/route.ts` — nome, email

### 1.4 Rate limiting por endpoint

O middleware atual tem rate limiting global. Verificar se endpoints sensíveis têm rate limiting próprio:
- `POST /api/auth/login` — deve ter rate limiting mais restritivo (ex: 5 tentativas/min)
- `POST /api/auth/register` — deve ter rate limiting
- `POST /api/participacoes` — deve ter rate limiting por utilizador
- `POST /api/pagamentos/*` — deve ter rate limiting

### 1.5 Headers de segurança HTTP

Verificar se os seguintes headers estão configurados em `next.config.js` ou `middleware.ts`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (restringir câmara, microfone, geolocalização)

---

## TAREFA 2 — ANÁLISE CRÍTICA COMPLETA (10 ÁREAS)

Depois de aplicadas as correções, executa uma análise exaustiva da aplicação nas 10 áreas abaixo.

### Modo de execução
- **thorough** — analisa TODOS os ficheiros relevantes, cita código específico com `ficheiro:linha`
- Anti-leniência: sem elogios vazios. Se algo está bem, diz porquê com evidência. Se está mal, mostra o código e a correção.
- Autocontido: o relatório deve ser compreensível por um terceiro sem acesso ao código.

### Áreas a analisar

#### 1. Segurança e prevenção de fraude (PRIORIDADE MÁXIMA)
- JWT: algoritmo, expiração, refresh token, invalidação
- CSRF: proteção em endpoints state-changing
- Rate limiting: por IP, por utilizador, por endpoint
- Secrets: hardcoded keys, .env exposto, Vercel logs
- RBAC: verificação em todos os endpoints, bypasses possíveis
- CORS: configuração
- Validação de entrada: Zod, sanitização, SQL injection, XSS
- Webhooks: verificação de assinatura (Stripe, MBWay)
- Pagamentos: double-spend, race conditions, reembolsos

#### 2. Jogos (Poio, Rifa, Raspadinha, Euromilhões)
- Fluxo completo: criação → participação → pagamento → sorteio → resultado
- Ownership: quem pode criar, participar, verificar
- Auditoria: logs de sorteio, verificabilidade por terceiros
- Prevenção de fraudes: race conditions no stock, números duplicados
- Consistência de dados: transações atômicas
- Commit-reveal: implementação correta na raspadinha

#### 3. Autenticação, registo e perfis
- Registo: validação, email verification, perfis iniciais
- Login: rate limiting, lockout, sessões
- Demo users: segurança, isolamento
- 2FA/MFA: implementação
- OAuth: Google, Apple
- Recuperação de password
- Gestão de sessão: refresh, logout, invalidação

#### 4. Design System, UI/UX e navegação
- Consistência visual: shadcn/ui, Tailwind, Material Design tokens
- Dark/light mode
- Responsividade: mobile-first
- Menus por role: visibilidade correta
- Acessibilidade: ARIA, keyboard navigation, contrast
- Feedback: loading states, error messages, toasts
- Navegação: breadcrumbs, back button, deep links

#### 5. Arquitetura e código
- Estrutura de pastas: App Router organização
- Separação de responsabilidades: components, lib, api
- Tratamento de erros: try/catch, error boundaries
- Dependências: desnecessárias, duplicadas
- Duplicação: código repetido entre jogos
- Boas práticas: hooks custom, utilitários, patterns

#### 6. Performance e escalabilidade
- Tempo de carregamento: bundle size, code splitting
- Queries Prisma: N+1, indexes, select mínimo
- Caching: stale-while-revalidate, ISR
- Rate limiting: efetividade
- Gestão de estado: server vs client, waterfalls
- Imagens: next/image, formatos, lazy loading

#### 7. Conformidade RGPD e transparência
- Consentimento: cookie banner, opt-in
- Direito ao esquecimento: implementação
- Proteção de dados: minimização, anonimização
- Logs de auditoria: completude, retenção
- Transparência dos sorteios: verificabilidade, hash
- Termos e política de privacidade: existência, conteúdo

#### 8. Testes e cobertura
- Unitários: existência, cobertura
- Integração: endpoints API
- E2E: fluxos críticos
- Cobertura de rotas API
- Componentes: testes de UI
- Middleware: testes de auth/RBAC
- Pagamentos: testes de fluxo

#### 9. Documentação e manutenibilidade
- README: setup, deploy, arquitetura
- AGENTS.md: completude
- Comentários: qualidade, necessidade
- Documentação de API: OpenAPI/Swagger
- TODOs: quantidade, urgência
- CHANGELOG: existência

#### 10. Dependências e configuração
- Dependências desnecessárias
- @types: completude
- TypeScript: strict mode, configuração
- ESLint: regras, configuração
- Prettier: existência
- CSP (Content Security Policy)
- next/image: uso correto
- Vercel: configuração, build, functions

---

## FORMATO DO RELATÓRIO

O relatório final DEVE ter esta estrutura exata:

```
═══════════════════════════════════════════════════════
RELATÓRIO DE ANÁLISE CRÍTICA — ALDEIAS GAMES v3.11.1
═══════════════════════════════════════════════════════

DATA: YYYY-MM-DD
VERSÃO ANALISADA: 3.11.1
ANALISTA: [Nome da IA]

SCORE GERAL: X/10

┌─────────────────────────────────────┬───────┬──────────────────┐
│ Área                                │ Nota  │ Tendência         │
├─────────────────────────────────────┼───────┼──────────────────┤
│ 1. Segurança                        │ X/10  │ ↑↓→              │
│ 2. Jogos                            │ X/10  │ ↑↓→              │
│ 3. Autenticação e Perfis            │ X/10  │ ↑↓→              │
│ 4. Design System e UI/UX            │ X/10  │ ↑↓→              │
│ 5. Arquitetura e Código             │ X/10  │ ↑↓→              │
│ 6. Performance e Escalabilidade     │ X/10  │ ↑↓→              │
│ 7. Conformidade RGPD                │ X/10  │ ↑↓→              │
│ 8. Testes                           │ X/10  │ ↑↓→              │
│ 9. Documentação                     │ X/10  │ ↑↓→              │
│ 10. Dependências e Configuração     │ X/10  │ ↑↓→              │
└─────────────────────────────────────┴───────┴──────────────────┘

MATRIZ DE RISCO (top 10 vulnerabilidades):
┌────┬──────────────────────────────┬──────────┬──────────┬──────────┐
│ ID │ Vulnerabilidade              │ Severidade│ Impacto  │ Esforço  │
├────┼──────────────────────────────┼──────────┼──────────┼──────────┤
│ R1 │ ...                          │ CRÍTICO  │ Alto     │ Baixo    │
│ R2 │ ...                          │ ALTO     │ Médio    │ Médio    │
└────┴──────────────────────────────┴──────────┴──────────┴──────────┘

RESUMO EXECUTIVO
(2-3 parágrafos com conclusões principais e riscos mais graves)

ESTIMATIVA DE DÍVIDA TÉCNICA: X% do código
TEMPO ESTIMADO PARA RESOLVER: X dias/pessoa

─── ÁREA 1: [Nome] ──────────────────────────────────

Estado Atual
(descrição factual com citações de código)

Problemas e Riscos
┌────┬──────────────────────────────┬──────────┬──────────────────┬──────────────────┐
│ ID │ Problema                     │ Severidade│ Ficheiro:Line    │ Código/Evidência │
├────┼──────────────────────────────┼──────────┼──────────────────┼──────────────────┤
│ P1 │ ...                          │ 🔴 CRÍTICO│ path:line       │ `código`         │
└────┴──────────────────────────────┴──────────┴──────────────────┴──────────────────┘

Pontos Fortes
(que devem ser mantidos e porquê, com evidência)

Recomendações
┌────┬──────────────────────────────┬──────────┬──────────┬──────────┬──────────────┐
│ ID │ Recomendação                 │ Prioridade│ Esforço  │ Benefício│ Solução      │
├────┼──────────────────────────────┼──────────┼──────────┼──────────┼──────────────┤
│ R1 │ ...                          │ 1 (max)  │ Baixo    │ Alto     │ código       │
└────┴──────────────────────────────┴──────────┴──────────┴──────────┴──────────────┘

─── ÁREA 2: [Nome] ──────────────────────────────────
(... repetir para todas as 10 áreas ...)

CONCLUSÃO E PLANO DE AÇÃO
┌────┬──────────────────────────────┬──────────┬──────────┬──────────┬──────────┐
│ #  │ Ação                        │ Prioridade│ Esforço  │ Dependência│ Prazo    │
├────┼──────────────────────────────┼──────────┼──────────┼──────────┼──────────┤
│ 1  │ ...                          │ P1       │ 2h       │ Nenhuma  │ Dia 1    │
│ 2  │ ...                          │ P1       │ 4h       │ #1       │ Dia 1-2  │
└────┴──────────────────────────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## PERGUNTAS ESPECÍFICAS A RESPONDER

1. Existem vulnerabilidades de segurança que permitam a um utilizador não autorizado aceder a dados ou executar ações?
2. O fluxo de criação de jogos e sorteios é à prova de fraude?
3. A experiência do utilizador é consistente e intuitiva para todos os roles?
4. O design system é coerente e facilita a manutenção?
5. A aplicação está preparada para crescer (escalabilidade)?
6. A transparência dos sorteios é verificável por um terceiro?
7. Os dados pessoais dos utilizadores estão protegidos e em conformidade com o RGPD?
8. O código é manutenível por um novo desenvolvedor?
9. Os testes cobrem os fluxos críticos de negócio?
10. As dependências estão atualizadas e são todas necessárias?

---

## INSTRUÇÕES FINAIS

1. **Modo:** thorough — analisa TODOS os ficheiros, cita código específico
2. **Anti-leniência:** sem elogios vazios. Cada afirmação deve ter evidência.
3. **Evidências:** cada problema/recomendação com `ficheiro:linha`
4. **Autocontido:** relatório compreensível sem acesso ao código
5. **Língua:** Português de Portugal (PT-PT)
6. **Prioridade:** Corrigir Tarefa 1 primeiro, depois Tarefa 2
7. **Saída:** relatório completo no formato acima + ficheiros corrigidos

**Inicia agora a execução.**
