# TODO — Aldeias Games

> Lista de trabalho ativa. A lista histórica permanece em `todolist.md`; não marcar tarefas como concluídas sem evidência de validação.

## Prioridade crítica

- [x] **P0 — Regressão HMAC MBWay:** `processWebhookCallback` foi restaurada. No commit `e0d5734`, o typecheck e a suite Vitest passaram, incluindo os testes de assinatura/callback. Manter cobertura de assinatura válida, adulterada, truncada e credenciais vazias.
- [x] **P0 — Teste de gestão de membros após normalização de rota:** teste atualizado para importar `membros/[userId]`; o build Next.js gerou as rotas `[userId]` e `[userId]/role`, e a suite Vitest passou.
- [x] **P0 — Privacidade em `GET /api/apostas`:** resposta pública reduzida aos dados mínimos; ownership e isolamento por vendedor/aldeia implementados. Typecheck e Vitest passaram no commit `e0d5734`.
- [x] **P0 — Robustez do relógio oficial:** validação de HTTP, `unixtime` finito e data válida; testes para timestamp ausente e HTTP 503 incluídos na suite Vitest aprovada.
- [x] **P0 — Build com URL base inválida:** parsing defensivo de `NEXT_PUBLIC_BASE_URL`, fallback para `VERCEL_URL` e domínio canónico. Build Next.js passou no commit `e0d5734`.
- [ ] **P0 — Preparação da base de dados E2E:** a execução Playwright do commit `e0d5734` falhou porque o CI arrancou `next start` sem criar o schema nem semear a SQLite. Logs confirmam Prisma P2021 (`main.aldeias`, `main.jogos`, `main.rate_limits` inexistentes). O workflow `.github/workflows/ci.yml` foi corrigido no commit `c366264` para executar `prisma db push` e `prisma db seed` antes do Playwright; aguarda nova execução.
- [ ] **P0 — Dependências de produção:** `npm audit --omit=dev --audit-level=high` continua a falhar. O audit completo de `c5c9d9c` reportou 29 vulnerabilidades (4 moderadas, 25 altas); o audit de produção reporta 12 (4 moderadas, 8 altas). `npm audit fix` não encontrou atualizações seguras aplicáveis; as correções sugeridas exigem majors como Prisma 7, Vitest 3 e Zod 4. Planear atualizações por dependência e validar compatibilidade; não usar `--force` em bloco.
- [ ] **P0 — CI de segurança:** manter o workflow de auditoria independente e obter `npm audit --omit=dev --audit-level=high` sem vulnerabilidades altas/críticas. O workflow `dependency-remediation.yml` foi ajustado no commit `c5c9d9c` para aceitar `workflow_dispatch` e não ocultar falhas do `npm audit fix`; validar a execução antes de aceitar atualizações.
- [ ] **P0 — Webhooks/pagamentos:** continuar revisão de idempotência, ownership, estado e montante em todos os fluxos Stripe/MB WAY; as correções MB WAY existentes passaram typecheck/Vitest, mas falta validação E2E integrada.

## Prioridade alta

- [ ] **P1 — Dívida técnica ESLint:** o job ESLint continua a falhar. O log de `e0d5734` aponta erros de regras como `ban-ts-comment` (incluindo `@ts-ignore`/`@ts-nocheck`) e avisos de variáveis/imports não usados, `no-console` e `no-explicit-any`. Foram corrigidos dois grupos de Hooks no commit `a52243b` (chamada condicional de `usePathname` e helper puro `useNumeroState` renomeado para `getNumeroState`, além de interfaces vazias); aguarda nova medição CI. Continuar por módulos, sem desativar regras globalmente.
- [ ] **P1 — Segurança de autenticação e autorização:** completar auditoria endpoint a endpoint (RBAC, CSRF, rate limiting, isolamento multi-tenant e PII).
- [ ] **P1 — Integridade financeira:** rever concorrência e idempotência em todos os fluxos de carteira, caixa, cofre, pagamentos e webhooks.
- [ ] **P1 — Compatibilidade de dependências:** rever PRs Dependabot individualmente; não integrar atualizações major sem typecheck, testes e build.
- [ ] **P1 — Logs client-side:** concluir a revisão de `console.log` em páginas de jogos e componentes client; remover ou condicionar logs de depuração em produção.

## Prioridade média

- [x] **P2 — Recorrência mensal:** cálculo partilhado entre criação, cron e pré-visualização; correção do overflow de dias 30/31. Typecheck e suite Vitest passaram no commit `e0d5734`.
- [ ] **P2 — Qualidade do frontend:** auditoria de acessibilidade, estados de erro/loading e consistência dos componentes.
- [ ] **P2 — Backups:** validar backup externo e procedimento de restauro com evidência operacional.
- [ ] **P2 — Relatório de análise crítica:** concluir auditoria das 10 áreas do `ANALISE_CRITICA_PROMPT.md`, com evidências `ficheiro:linha`, matriz de risco e plano de ação. Não atribuir score sem percorrer os ficheiros relevantes.

## Bloqueios externos

- **Vercel:** no commit `e0d5734`, o build de produção foi concluído, mas o deployment foi recusado por quota diária (`api-deployments-free-per-day`; retry indicado em 24 horas). Não classificar como falha de código.

## Regras de conclusão

Uma tarefa só passa a concluída depois de executar os testes relevantes e verificar o resultado do CI. Falhas de infraestrutura ou serviços externos devem ser registadas como bloqueios, não como defeitos de código.
