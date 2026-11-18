# TODO — Aldeias Games

> Lista de trabalho ativa. A lista histórica permanece em `todolist.md`; não marcar tarefas como concluídas sem evidência de validação.

## Prioridade crítica

- [x] **P0 — Regressão HMAC MBWay:** `processWebhookCallback` foi restaurada. No commit `e0d5734`, o typecheck e a suite Vitest passaram, incluindo os testes de assinatura/callback. Manter cobertura de assinatura válida, adulterada, truncada e credenciais vazias.
- [x] **P0 — Teste de gestão de membros após normalização de rota:** teste atualizado para importar `membros/[userId]`; o build Next.js gerou as rotas `[userId]` e `[userId]/role`, e a suite Vitest passou.
- [x] **P0 — Privacidade em `GET /api/apostas`:** resposta pública reduzida aos dados mínimos; ownership e isolamento por vendedor/aldeia implementados. Typecheck e Vitest passaram no commit `e0d5734`.
- [x] **P0 — Robustez do relógio oficial:** validação de HTTP, `unixtime` finito e data válida; testes para timestamp ausente e HTTP 503 incluídos na suite Vitest aprovada.
- [x] **P0 — Build com URL base inválida:** parsing defensivo de `NEXT_PUBLIC_BASE_URL`, fallback para `VERCEL_URL` e domínio canónico. Build Next.js passou no commit `e0d5734`.
- [x] **P0 — Preparação da base de dados E2E:** `.github/workflows/ci.yml` executa `prisma db push` e `prisma db seed` antes do Playwright; ambos os passos passaram no run `44160756845`.
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


## E2E — correção da configuração JWT do CI (17/11/2026)

- [ ] Validar o CI após os commits `bf39331` e `89c3448`.
- [x] Diagnóstico: os 8 testes E2E falhados dependiam de login; o endpoint devolvia HTTP 500 durante a geração do JWT.
- [x] Causa identificada no código: `src/lib/auth.ts` rejeita segredos que contenham os placeholders `secret`, `changeme`, etc.; o valor anterior `ci-test-secret-key-for-testing-only` continha literalmente `secret`.
- [x] Atualizado `.github/workflows/ci.yml` e `.github/workflows/dependency-remediation.yml` para usar um segredo de teste com comprimento e diversidade suficientes, sem substrings proibidas.
- [ ] Confirmar que login, refresh token e os restantes fluxos E2E passam com a configuração corrigida.


## Reavaliação CI após correção JWT (18/11/2026)

- [x] Consultado o run mais recente disponível da branch main: 44186738714 (commit 90b3d94).
- [x] A correção JWT removeu o bloqueio generalizado de login: Playwright passou de 55 aprovados/8 falhados para 64 aprovados/3 falhados (3 ignorados).
- [ ] P0 — E2E cofre/cashbox: e2e/cofre-cashbox-flow.spec.ts falha no fluxo de depósito/confirmação; inspecionar estado inicial do vendedor e permissões/estado do depósito antes de alterar expectativas.
- [ ] P0 — E2E compra raspadinha: e2e/login-compra-raspadinha.spec.ts encontra o botão Saldo Aldeias desativado; investigar saldo e elegibilidade da conta seed, não forçar clique nem contornar validação financeira.
- [ ] P1 — E2E verificação pública: e2e/verificacao-publica.spec.ts encontra o estado Válida, mas a asserção adicional /verificada com sucesso/i não corresponde à mensagem renderizada em src/app/verificar/page.tsx; alinhar o teste com o contrato real da API/UI após inspecionar a resposta concreta.
- [ ] P1 — ESLint: run 44186738714 continua com 214 erros e 1309 avisos; os erros incluem @ts-ignore e @ts-nocheck em vários módulos. Corrigir por grupos e não suprimir regras.
- [ ] P0 — Security Audit: run 44186738753 mantém 12 advisories de produção (4 moderados, 8 altos), incluindo picomatch (ReDoS) e zod <4.6.6 (esgotamento de memória); mapear dependências diretas/transitivas e atualizar de forma compatível.
- [ ] P1 — Deploy: run 44186739242 confirma build concluído e falha apenas no deploy por quota Vercel api-deployments-free-per-day; aguardar reset/quota ou rever plano, sem tratar como regressão de código.
- [ ] Revalidar typecheck, Vitest, Playwright e build após cada correção; nenhuma das três falhas E2E deve ser marcada como resolvida antes de nova execução verde.


## Estabilização do teste de estatísticas diárias — 18/11/2026

- [x] Diagnóstico da falha no run `44254577712`: as oito participações de teste eram distribuídas por uma janela móvel de sete horas a partir de `new Date()`; quando a suite corria perto das 07:00 UTC, os registos atravessavam a meia-noite UTC e a agregação correta devolvia dois dias.
- [x] Corrigido `src/__tests__/integration/real-db/jogos-estatisticas.test.ts` no commit `3c8cc5e`: a janela de dados passa a ser ancorada às 12:00 UTC do dia de execução, mantendo as oito participações no mesmo dia sem alterar a lógica de produção nem enfraquecer as asserções.
- [ ] Validar no CI do commit `3c8cc5e` que o teste passa e confirmar que não existem regressões.
- [ ] ESLint continua com 214 erros/1309 avisos no último run observado; remediar por módulos.
- [ ] Security Audit continua com 12 vulnerabilidades de produção (4 moderadas/8 altas); mapear dependências e atualizar com compatibilidade.
- [ ] Deploy Vercel: build passou, publicação bloqueada pela quota diária gratuita; aguardar reposição da quota antes de nova publicação.


## Correção de hook de acessibilidade — 18/11/2026

- [x] Corrigido `src/hooks/useAccessibility.ts` no commit `0a73470`: `useRef` e `useEffect` deixaram de ser chamados dentro de uma callback criada por `useCallback`; `useFocusTrap` passou a ser um hook autónomo, com dependências explícitas (`enabled` e `onEscape`).
- [ ] Confirmar ESLint e typecheck no CI do commit `0a73470`; não declarar resolvido antes da validação.


## Redução de erros ESLint — 18/11/2026

- [x] No commit `234c1ad`, substituídas declarações `let` por `const` em quatro rotas (`api/eventos/[id]`, `api/jogos`, `api/participacoes/[id]/prova`, `api/push/vapid-keys`), porque o ESLint confirmou que essas variáveis não eram reatribuídas.
- [ ] Validar no CI se os quatro erros `prefer-const` foram eliminados e verificar typecheck/testes.
- [ ] Continuar os restantes erros por grupos; não converter automaticamente variáveis mutáveis nem desativar regras.


## Endpoint público de verificação — 18/11/2026

- [x] Corrigido `src/proxy.ts` no commit `f656a3c`: `/api/verificar-publico` passa a estar explicitamente na lista de rotas públicas e recebe rate limit de 20 pedidos/minuto por IP.
- [ ] Validar no CI que a rota pública funciona sem sessão, que a limitação responde HTTP 429 após exceder o limite e que o build continua a passar.
- [ ] Rever a confiança no identificador IP do proxy e o comportamento de rate limiting quando a base de dados está indisponível.


## Segunda ronda de limpeza ESLint — 18/11/2026

- [x] No commit `963ccfc`, convertidas para `const` declarações assinaladas pelo ESLint como não reatribuídas em seis rotas API: entregas-saldo admin, comissões, exportação de relatório, RGPD, setup-status e entrega-saldo vendedor.
- [ ] Validar no CI a redução adicional de seis erros `prefer-const`, sem alterações à lógica funcional.
