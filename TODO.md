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


## Terceira ronda ESLint e validação — 18/11/2026

- [x] No CI `44256083812` (commit `36d02a5`), ESLint reduziu de 207 para 201 erros; os seis `prefer-const` das rotas alteradas desapareceram.
- [x] O mesmo job confirma TypeScript, Vitest e build Next.js concluídos com sucesso; a preparação SQLite e o seed E2E também passaram.
- [x] Removido `require('@/lib/db')` de `src/lib/aldeia-progress.ts`, substituindo-o por import estático de `prisma`; removido o `@ts-ignore` redundante sobre a importação Prisma. Commit `61844dc`.
- [ ] Validar o commit `61844dc` no CI, incluindo lint e testes de integração.
- [ ] O ESLint continua a reportar 201 erros e 1309 avisos. Persistem, entre outros, `@ts-nocheck`, `@ts-ignore`, imports `require`, `prefer-const` e regras Next.js; continuar por grupos e sem desativar regras.
- [ ] O Security Audit `44256083954` mantém 12 vulnerabilidades de produção (4 moderadas, 8 altas): `glob`, `minimatch`, `picomatch` e `zod`. As correções automáticas de Zod exigem major upgrade; não aplicar `--force` sem migração.
- [ ] O Playwright do CI `44256083812` estava ainda em execução na última consulta; não declarar os fluxos E2E aprovados até terminar.


## Quarta ronda ESLint — correções prefer-const — 18/11/2026

- [x] Corrigidas declarações não reatribuídas em `scripts/migrate-apostas-poio.ts`, `scripts/replace-design-tokens-extended.js`, `scripts/replace-design-tokens.js`, `src/__tests__/integration/game-lifecycle.test.ts`, `src/__tests__/integration/real-db/membros-gestao.test.ts`, `src/components/qr-code-generator.tsx` e `src/features/admin/hooks/use-admin-crud-handlers.tsx`.
- [x] Cada alteração limita-se a `let` → `const`, sem alterar valores ou fluxos.
- [ ] Validar a redução dos erros `prefer-const` no CI dos commits `66a70ff` a `039a6f9`; não foi possível executar ESLint localmente neste ambiente.
- [ ] Permanecem erros de lint não tratados: `@ts-nocheck` em testes/configuração/seeds, `@ts-ignore` em imports Prisma e rotas, `require()` em scripts/testes/rotas, além de duas regras Next.js e uma interface vazia.


## Quarta ronda ESLint — correções prefer-const — 18/11/2026

- [x] Corrigidas declarações não reatribuídas em `scripts/migrate-apostas-poio.ts`, `scripts/replace-design-tokens-extended.js`, `scripts/replace-design-tokens.js`, `src/__tests__/integration/game-lifecycle.test.ts`, `src/__tests__/integration/real-db/membros-gestao.test.ts`, `src/components/qr-code-generator.tsx` e `src/features/admin/hooks/use-admin-crud-handlers.tsx`.
- [x] As alterações limitam-se a `let` → `const`, sem alterar os valores ou fluxos.
- [ ] Validar a redução dos erros `prefer-const` no CI; não foi possível executar ESLint localmente neste ambiente.
- [ ] Permanecem erros de lint relacionados com `@ts-nocheck`, `@ts-ignore`, `require()`, regras Next.js e uma interface vazia.


## Quinta ronda ESLint — regras de tipos e Next.js — 18/11/2026

- [x] `src/hooks/use-eventos.ts`: `UpdateEventoData` passou de interface vazia que estendia `Partial<CreateEventoData>` para alias equivalente.
- [x] `src/app/not-found.tsx`: navegação interna para `/` passou a usar `next/link`.
- [x] `src/app/docs/page.tsx`: Swagger UI passou a ser carregado com `next/script` e `strategy="afterInteractive"`, em vez de elemento `<script>` síncrono.
- [ ] Validar estas três correções no CI; não foram executados testes locais.


## Sexta ronda ESLint — imports CommonJS nos módulos TypeScript — 18/11/2026

- [x] Substituídos `require('crypto')` por imports estáticos de `node:crypto` no OAuth Google e nos testes `game-lifecycle`, `game-logic` e `raspadinha`.
- [x] O teste de spy passou a observar `crypto.createHash` através do módulo importado.
- [ ] Validar lint, typecheck e Vitest no CI; não foram executados testes locais neste ambiente.


## Oitava ronda — controlo de concorrência do CI/CD — 18/11/2026

- [x] CI: cancelar execuções antigas da mesma branch quando chega um novo commit.
- [x] Security Audit: cancelar auditorias obsoletas da mesma branch.
- [x] Deploy: serializar deployments sem cancelar um deployment que já esteja a executar; ignorar alterações exclusivamente Markdown/documentação.
- [ ] Validar sintaxe e comportamento dos workflows no GitHub Actions após o push.


## Continuação — correção de regressão TypeScript e CI — 18/11/2026

- [x] Reavaliado o commit `fdc9d6f7b9f401ee90e33bab10a6dc24177e37c0` e consultados os workflows CI, Security Audit e Deploy.
- [x] Identificada regressão em `src/lib/aldeia-progress.ts`: `Aldeia.moedaInterna` é `Float` no schema Prisma, mas o código usava `Prisma.Decimal` e `.toNumber()`. Remover a conversão incompatível e somar valores numéricos (`number`), preservando a regra de recompensa.
- [ ] Validar no CI o typecheck e os testes após a correção; não foram executados testes locais.
- [ ] O ESLint no run `44257802393` apresenta 180 erros e 1309 avisos (face a 201 erros na medição anterior). Permanecem `ban-ts-comment`, `@ts-nocheck` e outros erros; continuar por contexto.
- [ ] Security Audit `44257802349` continua a falhar; o audit completo reporta 29 vulnerabilidades (4 moderadas, 25 altas), sem remediação automática segura confirmada.
- [ ] Deploy `44257802457` falhou; consultar o log completo antes de classificar a causa. A quota Vercel anterior não deve ser assumida como causa deste run sem evidência.


## Continuação — teste de hash compatível com Node.js — 18/11/2026

- [x] O CI do commit `eee7131` confirmou que o typecheck passa após a correcção de `moedaInterna`.
- [x] Vitest: 528 passaram e 1 falhou em `src/__tests__/unit/game-logic.test.ts`; o teste tentava usar `vi.spyOn` sobre `node:crypto.createHash`, cuja propriedade não pode ser redefinida no runtime Node.js.
- [x] Substituído o teste intrusivo por uma verificação do contrato observável do identificador (`AG-` + 8 dígitos hexadecimais + timestamp base36), mantendo o comportamento de produção inalterado.
- [ ] Validar a suite Vitest completa no CI seguinte; não foram executados testes locais.
- [ ] Lint continua com 180 erros e 1309 avisos; não foram removidas supressões de tipos em massa.
- [ ] Security Audit mantém 12 vulnerabilidades de produção (4 moderadas, 8 altas).
- [ ] Deploy Vercel recusado por quota diária `api-deployments-free-per-day`; o build de artefactos chegou à fase de publicação.


## Diagnóstico e correção dos E2E de autenticação — 18/11/2026

- Run CI analisado: `44264364771`, commit `75e2dd2`. TypeScript, 529 testes Vitest e build passaram; Playwright terminou com 65 aprovados, 2 falhados e 3 ignorados.
- Causa comum identificada nos dois testes falhados: a aplicação corre com `NODE_ENV=production` no servidor `next start` do Playwright. Em produção, `src/lib/auth.ts` define o cookie de sessão como `__Host-auth-token`; os testes estavam a injectar `auth-token`, que só é reconhecido fora de produção. Assim, os pedidos do browser não tinham sessão autenticada.
- Consequências observadas: o dashboard do vendedor não conseguia carregar as APIs autenticadas; a carteira devolvia saldo indisponível e o método Saldo Aldeias ficava desativado, apesar de o seed atribuir saldo ao administrador.
- Corrigidos os dois testes para injectar o cookie `__Host-auth-token` com atributos exigidos pelo prefixo (`Secure`, `Path=/`, sem Domain), e para guardar também o utilizador devolvido pelo login no `localStorage`, conforme o contrato esperado pelo frontend.
- No fluxo do vendedor, as esperas genéricas por `networkidle` foram substituídas por esperas pelos separadores funcionais Caixa/Pendentes; a página pode manter pedidos de rede activos sem que isso signifique que a interface não esteja pronta.
- Removidos os dois `@ts-nocheck` destes testes; a tipagem Playwright passa a ser verificada normalmente.
- [ ] Validar os dois testes no próximo Playwright e confirmar que o pagamento é debitado e o depósito é confirmado sem contornar validações de saldo, permissões ou estado.
- [ ] Revalidar lint, typecheck, Vitest e build; a última medição continua a indicar 180 erros ESLint/1309 avisos e 12 advisories de produção (4 moderados, 8 altos).
- [ ] Deploy Vercel continua sem nova tentativa até a quota diária estar disponível.


## Prompt mestre e correcção de autenticação E2E — 18/11/2026

- [x] Criado `PROMPT_CONCLUSAO_AUTONOMA.md` com protocolo de arranque, regras de segurança, prioridades P0/P1/P2, ciclos de execução, critérios de aceitação para produção e formato de relatório.
- [x] Adicionado ao `AGENTS.md` o requisito de leitura do prompt mestre antes de cada continuação.
- [x] CI run `44268750503`: typecheck, Vitest, build, preparação SQLite e seed passaram; Playwright: 65 passaram, 2 falharam, 3 ignorados.
- [x] Causa das duas falhas E2E identificada: fixture `request` isolado + injecção manual via `addCookies`; a rota de login já emite cookie httpOnly de produção.
- [x] Testes alterados para usar `page.context().request` e verificar explicitamente o cookie `__Host-auth-token`; validação CI ainda pendente.
- [x] Workflow de deployment passa a ignorar alterações exclusivas em `e2e/**` e `playwright.config.ts`, evitando deployments de produção por alterações apenas de testes.
- [ ] Validar novamente os dois fluxos E2E sem contornar autenticação, saldo, permissões ou estados financeiros.
- [ ] Resolver os 178 erros ESLint e 1309 avisos por grupos pequenos, sem desactivar regras.
- [ ] Resolver as 12 vulnerabilidades de produção (4 moderadas, 8 altas), incluindo migrações compatíveis de dependências.
- [ ] Repetir deployment apenas quando a quota Vercel estiver disponível e os gates de CI/segurança estiverem aprovados.


## Infraestrutura CI e compilação de produção — 18/11/2026

- [x] Typecheck passou e Vitest passou (529 testes) no CI `44297294757`.
- [x] Diagnóstico da instalação Playwright: runner `ubuntu-latest` resolveu para Ubuntu 26.04, não suportado pelo Playwright 1.60.0; runners de lint e CI fixados em `ubuntu-24.04`.
- [x] Diagnóstico do build Vercel: `playwright.config.ts` era incluído no typecheck de produção, mas `@playwright/test` é dependência dev. Configuração Playwright excluída do tsconfig da aplicação.
- [ ] Validar novo CI: Chromium, build, seed e E2E após fixar Ubuntu 24.04.
- [ ] Validar build Vercel após excluir o config de testes do tsconfig.
- [ ] ESLint mantém 159 erros e 1309 avisos; tratar primeiro supressões/imports e depois erros React Compiler/hooks por grupos.
- [ ] Security Audit mantém 12 vulnerabilidades de produção (4 moderadas, 8 altas).
- [ ] Deploy de produção depende de build aprovado e quota Vercel disponível.


## React Compiler — primeiro grupo de correcções (18/11/2026)

- [x] CI `44298140640`: typecheck, Vitest (529), build, SQLite, seed e Playwright passaram; E2E: 67 aprovados, 3 ignorados.
- [x] Runners CI em Ubuntu 24.04 e exclusão de `playwright.config.ts` do tsconfig da aplicação validados.
- [x] Build Vercel passou; deploy bloqueado exclusivamente pela quota diária de deployments.
- [ ] ESLint: 159 erros/1309 avisos no último run.
- [ ] Preparadas correcções para evitar setState síncrono em effects e referências a funções antes da declaração nas páginas Entregas e Pedidos; o reset da paginação passou para os eventos de filtro/pesquisa.
- [ ] Na página Euromilhões, removido estado de montagem redundante e substituído efeito de pré-selecção por valor derivado. Aguardam CI.
- [ ] Security Audit continua com 12 vulnerabilidades de produção.


## Correcção da página Euromilhões e estado CI — 18/11/2026

- [x] Corrigido o marcador textual acidental na página `src/app/admindashboard/euromilhoes/page.tsx`, que causou erro de sintaxe TypeScript no CI `44299258443`.
- [x] Substituído o estado `ready` baseado em effect por `useSyncExternalStore` com snapshot de servidor falso/cliente verdadeiro, preservando a renderização client-only sem setState num effect.
- [x] CI anterior `44298140640`: typecheck, 529 Vitest, build, seed e E2E passaram (67 aprovados, 3 ignorados).
- [ ] Revalidar typecheck, lint, Vitest, build e E2E após a correcção.
- [ ] ESLint no run `44299258443`: 153 erros e 1305 avisos.
- [ ] Security Audit: 12 vulnerabilidades de produção.


## ESLint — remoção de supressões e imports CommonJS (18/11/2026)

- [x] CI `44299680572`: job principal passou; Vitest 529/529 e Playwright 67 aprovados, 3 ignorados. Typecheck e build passaram.
- [x] ESLint medido em 153 erros e 1306 avisos. Primeiro grupo explícito: quatro `@ts-nocheck`, cinco `@ts-ignore` e três scripts com `require()`.
- [x] Removidas as quatro directivas `@ts-nocheck`; substituídas supressões `@ts-ignore` por `@ts-expect-error` localizadas; scripts Node convertidos para imports ESM nativos.
- [ ] Confirmar no CI que as supressões esperadas correspondem a erros reais e que os scripts continuam executáveis no Node 24.
- [ ] Continuar a tratar os restantes erros ESLint sem desactivar regras.
- [ ] Resolver as 12 vulnerabilidades reportadas no audit de produção: glob/minimatch (moderadas), picomatch (alta) e zod (alta), com actualizações compatíveis e lockfile regenerado.
- [ ] Deployment Vercel bloqueado por quota `api-deployments-free-per-day`; build de artefactos passou.


## Ajuste das supressões de tipos — 18/11/2026

- [x] CI `44301485563`: identificou que três `@ts-expect-error` em imports Prisma/Sentry eram desnecessárias (TS2578); foram removidas.
- [x] ESLint desceu de 153 para 138 erros; o primeiro grupo de `@ts-nocheck`/CommonJS foi resolvido.
- [ ] Revalidar typecheck e build após remover as três directivas não utilizadas.
- [ ] Continuar os erros React Compiler/hooks (principalmente setState síncrono em effects e referências antes da declaração), sem desactivar regras.


## React Query — remoção de efeitos de carregamento (18/11/2026)

- [x] CI `44302130079`: typecheck, Vitest 529/529, build, SQLite, seed e Playwright 67/67 passaram (3 ignorados).
- [x] Deployment Vercel `44302130095`: build de artefactos passou; publicação recusada por quota diária, bloqueio externo.
- [x] Migrada a leitura de entregas administrativas para `useQuery`, com cache por utilizador e refetch após operações; removido o efeito que disparava actualizações de estado.
- [x] Migrada a leitura de pedidos de carregamento para `useQuery`, com cache por utilizador/estado e refetch após confirmação.
- [ ] Validar o novo grupo React Query no CI e confirmar redução dos erros ESLint.
- [ ] Continuar correcções React Compiler/hooks por componentes, sem desactivar regras.


## React Query — tratamento de falhas de leitura (18/11/2026)

- [x] Identificado que as queries de Entregas e Pedidos convertiam erros HTTP/rede em arrays vazios, fazendo a interface apresentar falsamente "Nenhum ... encontrado".
- [x] Removido o tratamento que engolia a excepção; o TanStack Query passa a receber o erro e a activar o estado de erro.
- [x] Adicionado estado de erro acessível com `role="alert"` e acção explícita "Tentar novamente" nas duas páginas.
- [ ] Validar typecheck, ESLint, Vitest e build no CI após os commits `c43ec9c` e `1148dd6`.
- [ ] Rever paginação: os endpoints devolvem respostas paginadas, enquanto as páginas actuais ainda fazem paginação local; confirmar que não se ocultam registos para conjuntos superiores ao limite da API.


## P0 — Integridade financeira das entregas de saldo

- [x] Identificado o risco de dupla confirmação: estado da entrega era actualizado fora da transacção que movimentava os saldos.
- [x] Extraída a operação para `src/lib/entrega-saldo.ts`; o claim condicional `updateMany({ where: { id, estado: estadoOrigem } })`, o débito/crédito das carteiras, os dois lançamentos e a leitura final decorrem na mesma transacção.
- [x] O débito do vendedor usa guarda atómica `saldo >= valor`; se não existir saldo suficiente, a excepção provoca rollback do estado e de todos os movimentos.
- [x] Confirmação, rejeição e conclusão usam transições condicionais; pedidos repetidos recebem HTTP 409.
- [x] Adicionado retry limitado para conflitos/deadlocks Prisma e SQLite (`P2034`, `SQLITE_BUSY`, database locked).
- [x] Criado `src/__tests__/integration/real-db/entregas-saldo.test.ts` com testes para concorrência, rollback por saldo insuficiente e rejeição repetida.
- [ ] Validar typecheck, lint, Vitest e build no CI do commit final; não marcar a correcção como validada até o teste real-DB passar.


## Continuação — integridade das entregas e CI (18/11/2026)

- [x] Consultado o CI real do commit `66c5ade`: TypeScript, Vitest, build e Playwright passaram; ESLint falhou com 136 erros e 1312 avisos.
- [x] Confirmada a causa do ESLint: regras React Hooks/Compiler (actualizações de estado síncronas em efeitos, referências antes da declaração, chamadas impuras durante render e memoização não preservada), distribuídas por páginas e componentes existentes. Não desactivar regras globalmente.
- [ ] Corrigir os erros ESLint por módulos, preservando o comportamento dos fluxos.
- [ ] Remediar as 4 vulnerabilidades altas de produção identificadas no CI; o Zod requer migração major para v4 e validação de compatibilidade.
- [x] Adicionar registo AuditLog transacional nas transições confirmar/rejeitar/concluir de entregas de saldo, com actor, aldeia, ação, estado e valor; garantir rollback da auditoria se a operação financeira falhar.
- [x] Restringir PATCH a `aldeia_admin` e `super_admin`, validar observações e reduzir a leitura prévia da entrega aos campos necessários.
- [ ] Validar no CI os novos testes de auditoria e as transições de entrega após o commit desta alteração.
