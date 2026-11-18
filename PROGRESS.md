# PROGRESS — Aldeias Games

## Estado atual da branch

- Repositório: `smpsandro1239/Aldeias_Games`
- Branch: `main`
- Último commit desta atualização documental: `32e5e55`
- Correção do workflow E2E: `c366264`
- Commit de código validado parcialmente: `e0d5734600ebbcf5f4955c4b6cbec623a95afd5d`
- Data: 17/11/2026

## Validação CI do commit e0d5734

| Verificação | Resultado | Evidência |
|---|---|---|
| Prisma Client | Passou | Geração v6.19.3 |
| TypeScript | Passou | Job CI |
| Vitest | Passou | Suite completa |
| Build Next.js | Passou | Build Webpack; 142 páginas/rotas geradas |
| Playwright E2E | Falhou | 48 passaram, 15 falharam, 7 ignorados |
| ESLint | Falhou | Erros de lint existentes, incluindo `ban-ts-comment` |
| Security Audit | Falhou | 12 vulnerabilidades de produção: 4 moderadas, 8 altas |
| Deploy Vercel | Bloqueado por quota | Build concluído; deployment recusado por `api-deployments-free-per-day` |

### Causa confirmada da falha E2E

- O workflow executava o build e arrancava `next start`, mas não preparava a base de dados SQLite usada pelo Playwright.
- Os logs do servidor mostram Prisma P2021: as tabelas `main.aldeias`, `main.eventos`, `main.jogos` e `main.rate_limits` não existiam.
- O login devolvia HTTP 500 porque o rate limiter e as consultas de utilizador dependiam de tabelas ausentes.
- Não se trata de uma falha das credenciais dos testes nem de uma regressão no login: a base de dados do E2E não estava inicializada.

## Alteração aplicada nesta continuação

### Preparação da base de dados antes do Playwright

- [x] Atualizado `.github/workflows/ci.yml` no commit `c366264`.
- [x] Adicionado passo `prisma db push --accept-data-loss` com `DATABASE_URL=file:./dev.db` para criar o schema SQLite descartável de CI.
- [x] Adicionado passo `prisma db seed` para executar o seed completo configurado em `package.json`, criando os utilizadores e os dados determinísticos exigidos pelos testes E2E.
- [ ] Aguardar e inspecionar o novo CI após o commit `c366264`; só então confirmar se os testes E2E passam.

## Alterações de código já validadas no CI de e0d5734

### MB WAY — assinatura e callback

- [x] Restaurada a exportação `processWebhookCallback`, removida inadvertidamente numa refatoração anterior.
- [x] HMAC usa `createHmac` e `timingSafeEqual`, com validação de comprimento antes da comparação.
- [x] Testes cobrem assinatura válida, adulterada, truncada e segredo/assinatura vazios.
- [x] Typecheck e Vitest passaram no commit `e0d5734`.

### Gestão de membros e rotas Next.js

- [x] Segmento dinâmico normalizado para `[userId]`, evitando nomes dinâmicos incompatíveis no mesmo ramo.
- [x] Teste de integração atualizado para importar a nova rota e passar `userId`.
- [x] Build Next.js gerou as rotas `/api/aldeias/[id]/membros/[userId]` e `/role`; Typecheck e Vitest passaram.

### Privacidade da API de apostas

- [x] GET público reduzido aos dados mínimos para ocupação do tabuleiro, sem nome, telefone, email ou relações completas.
- [x] Filtros de ownership aplicados a utilizadores/vendedores e isolamento por aldeia para administradores.
- [x] POST normaliza e limita dados pessoais, valida email/telefone e números.
- [x] Typecheck e Vitest passaram.

### Hora oficial, recorrência e build

- [x] `syncTime()` valida resposta HTTP, `unixtime` finito e data válida; preserva offset/fallback sem propagar `Invalid Date`.
- [x] Testes para timestamp ausente e HTTP 503 passaram em Vitest.
- [x] Recorrência mensal centralizada entre criação, cron e pré-visualização; testes de overflow de dias 30/31 passaram.
- [x] `metadataBase` passou a tratar URL inválida com fallback defensivo; build Next.js passou.

## Bloqueios ativos

### ESLint

- O job continua a falhar.
- O log contém erros de `@typescript-eslint/ban-ts-comment`, nomeadamente `@ts-ignore`/`@ts-nocheck), além de avisos de `no-console`, `no-explicit-any` e variáveis/imports não usados.
- Corrigir por módulos e reexecutar; não desativar regras globalmente.

### Dependências

- `npm audit --omit=dev --audit-level=high` falha com 12 vulnerabilidades (4 moderadas, 8 altas) no commit `e0d5734`.
- O relatório inclui vulnerabilidades em `glob`, `minimatch`, `picomatch` e `zod`; o npm indica que a correção do Zod requer v4 (major).
- Não aplicar `npm audit fix --force` sem migração de compatibilidade e validação.

### Deploy Vercel

- O build foi concluído com sucesso no job de deployment.
- A publicação foi recusada pelo limite diário gratuito, com indicação de tentar novamente após 24 horas.
- É um bloqueio de quota/infraestrutura, não uma falha de compilação.

## Próximos passos

1. Consultar o CI do commit `c366264` e confirmar que os passos de schema/seed correm antes do Playwright.
2. Se E2E ainda falhar, analisar a primeira falha funcional depois da inicialização da BD; não ajustar expectativas para mascarar erros.
3. Corrigir o ESLint em grupos pequenos, começando pelos erros de regras e imports efetivamente não utilizados.
4. Remediar dependências sem alterações major sempre que possível; planear migração Zod 4 isoladamente.
5. Continuar auditoria endpoint a endpoint de RBAC, CSRF, rate limiting, multi-tenancy, dados pessoais e integridade financeira.
6. Não declarar o projeto pronto nem concluir o relatório das 10 áreas sem evidências por ficheiro/linha.

## Regras de validação

- Uma tarefa só é concluída quando os testes relevantes e o CI confirmam o comportamento.
- Falhas de quota, serviços externos ou configuração são registadas como bloqueios de infraestrutura.
- Atualizar sempre este ficheiro e `TODO.md` após cada conjunto de alterações.
- Trabalhar diretamente na `main`, com commits pequenos e mensagens em português de Portugal.


## Workflow de remediação de dependências — continuação

- [x] Atualizado `.github/workflows/dependency-remediation.yml` no commit `c5c9d9c`.
- [x] Adicionado trigger manual `workflow_dispatch` para permitir execução controlada futura.
- [x] Removido `|| true` de `npm audit fix`, para não esconder falhas inesperadas da ferramenta; a execução continua sem `--force`.
- [ ] Confirmar a execução do workflow, rever as alterações efetivas em `package.json`/`package-lock.json` e validar TypeScript, Vitest e build antes de aceitar qualquer atualização automática.


## Correções iniciais de ESLint — continuação

- [x] `src/components/bottom-nav.tsx`: `usePathname()` passa a ser chamado incondicionalmente; o valor `currentPath` é aplicado depois do hook.
- [x] `src/components/modals/poio-da-vaca-modal.tsx`: helper de leitura de estado renomeado de `useNumeroState` para `getNumeroState`, porque não é um hook React e é chamado dentro de callbacks; interfaces vazias convertidas em aliases de tipo.
- [ ] Confirmar redução dos erros ESLint e executar typecheck/testes no CI dos commits `648a255` e `a52243b`.


## Auditoria de dependências — resultado observado

- [x] Executado `npm audit fix --no-fund --no-progress` no workflow de remediação do commit `c5c9d9c`.
- [x] A ferramenta terminou sem atualizar dependências (`up to date`); os advisories restantes só indicam correções com breaking changes, nomeadamente Prisma 7, Vitest 3 e Zod 4. O job parou antes de typecheck/testes/build por o comando devolver exit code 1 devido às vulnerabilidades não resolvidas.
- [x] Atualizado `.github/workflows/dependency-remediation.yml` no commit `54c2a8c`: a tentativa de correção não-major passa a ser não bloqueante, mas o lockfile continua sujeito a `npm ci`, typecheck, Vitest e build antes de qualquer commit automático.
- [ ] Confirmar o novo workflow e planear as migrações major separadamente; não houve atualização de dependências nesta execução.
- [x] Evidência do audit completo: 29 vulnerabilidades (4 moderadas, 25 altas). O audit apenas de produção continua a indicar 12 (4 moderadas, 8 altas).


## Correção da falha E2E — segredo JWT inválido no CI (17/11/2026)

### Evidência do run `44160756845` (commit `e5c34d1`)

- Prisma Client, TypeScript, Vitest e build passaram.
- Os passos `Prepare SQLite database for E2E` e `Seed deterministic E2E fixtures` passaram; portanto, a falha anterior de schema não se reproduziu neste run.
- Playwright: 55 passaram, 7 ignorados e 8 falharam. As falhas comuns ocorreram em autenticação; os logs do servidor mostram `Erro no login` e os testes recebem HTTP 500.
- Inspeção de `src/lib/auth.ts`: `validateJwtSecret()` rejeita qualquer segredo que contenha `secret` como placeholder inseguro.
- O CI fornecia `JWT_SECRET=ci-test-secret-key-for-testing-only`, que contém a substring proibida. Após a validação da password, `generateToken()` lançava erro e o endpoint devolvia 500. Esta é a causa confirmada da falha de login.

### Alterações aplicadas diretamente na main

- [x] `.github/workflows/ci.yml`: segredo JWT de build e E2E substituído por um valor de teste válido, com entropia/diversidade suficientes e sem placeholders.
- [x] `.github/workflows/dependency-remediation.yml`: mesmo segredo corrigido para o build de validação.
- [x] `TODO.md` atualizado com causa, evidência e validação pendente.
- [ ] Aguardar CI dos commits `bf39331` / `89c3448`; confirmar Playwright e build.
- [ ] O ESLint mantém 214 erros e 1309 avisos no run observado; não foi alterado nem desativado.
- [ ] Auditoria de produção mantém 12 vulnerabilidades (4 moderadas, 8 altas) no run observado.
- [ ] Deploy Vercel continua bloqueado pela quota diária gratuita (mais de 100 deployments em 24h), apesar do build concluído.



## Reavaliação da CI após correção JWT — 18/11/2026

### Estado observado em GitHub Actions

- Branch analisada: main; último commit observado antes desta atualização: 90b3d94dc2021ca70aa3dcb4f3172a5ac3d7be65.
- Run CI: https://github.com/smpsandro1239/Aldeias_Games/actions/runs/44186738714 — falhou nos jobs lint e ci.
- O job de lint mantém 214 erros e 1309 avisos. Erros confirmados incluem @typescript-eslint/ban-ts-comment em src/lib/rbac/checkPermission.ts, src/lib/rbac/resolvePermissions.ts, src/lib/sms.ts, src/lib/stripe.ts e src/scripts/check-test-users.ts; o script tem ainda @ts-nocheck. Não foram desativadas regras.
- Playwright: 64 passaram, 3 falharam e 3 foram ignorados. A melhoria face ao run anterior (55/8/7) confirma que o segredo JWT corrigido removeu a falha generalizada de autenticação, mas não estabilizou todos os fluxos.

### Falhas E2E restantes — diagnóstico inicial

1. e2e/cofre-cashbox-flow.spec.ts: falha no fluxo de depósito de cashbox e confirmação pelo administrador. É necessário determinar se o depósito foi criado, se existe saldo físico suficiente e se o seed oferece um registo pendente determinístico.
2. e2e/login-compra-raspadinha.spec.ts: o botão Saldo Aldeias está visível mas desativado. Não se deve contornar o estado disabled; investigar o saldo do utilizador seed, preço do jogo e estado da participação/carteira.
3. e2e/verificacao-publica.spec.ts: o teste encontra o badge Válida, mas falha na expectativa textual /verificada com sucesso/i. A página src/app/verificar/page.tsx apresenta a mensagem fornecida pela API em result.mensagem; falta comparar a mensagem real com o contrato do teste antes de alterar a asserção.

### Auditoria de dependências e deployment

- Run Security Audit: https://github.com/smpsandro1239/Aldeias_Games/actions/runs/44186738753 — falhou com 12 vulnerabilidades (4 moderadas, 8 altas). O log identifica picomatch com ReDoS e zod <4.6.6 com risco de esgotamento de memória; também identifica glob e minimatch moderados. A recomendação automática para Zod é major (v4.6.7), pelo que exige análise de compatibilidade.
- Run Deploy: https://github.com/smpsandro1239/Aldeias_Games/actions/runs/44186739242 — build Next.js/Vercel concluído; deploy recusado por limite api-deployments-free-per-day (mais de 100 deployments em 24h). Bloqueio externo de quota, não falha do build.

### Estado desta continuação

- [x] Releitura de ANALISE_CRITICA_PROMPT.md, AGENTS.md, TODO.md e PROGRESS.md antes de continuar.
- [x] Confirmadas permissões de escrita na repository e branch default main.
- [x] Consultados os runs de CI, Security Audit e Deploy e respetivos logs.
- [x] Atualizado TODO.md com as três falhas E2E, ESLint, advisories e bloqueio Vercel observados.
- [ ] Corrigir os fluxos E2E por causa raiz e executar nova suite Playwright.
- [ ] Reduzir os erros ESLint por grupos, preservando verificações de tipos.
- [ ] Remediar advisories com atualizações compatíveis e testes completos.
- [ ] Executar novamente todos os checks e atualizar este ficheiro com os resultados do novo commit.

Nota de rigor: nesta continuação foram feitas inspeções e atualização documental. Não foi alterada lógica da aplicação nem se declara qualquer das três falhas E2E resolvida. O último build de produção observado foi concluído, mas não foi publicado devido à quota Vercel.


## Correção de teste não determinístico — 18/11/2026

- Run analisado: CI `44254577712`, commit `71d4a79`.
- Vitest: 528 testes passaram e 1 falhou em `src/__tests__/integration/real-db/jogos-estatisticas.test.ts`, na expectativa de apenas um dia de vendas.
- Causa identificada: os timestamps de fixture eram criados subtraindo horas a partir da hora atual. A suite correu às 06:53 UTC; as participações abrangeram dois dias UTC, e a API agrupou corretamente por `createdAt.toISOString().slice(0, 10)`. A expectativa do teste era, por isso, dependente da hora de execução.
- Alteração no commit `3c8cc5ebe04802e8ad12baea544dc731dc515045`: ancorar a janela de timestamps às 12:00 UTC do dia atual, preservando as oito vendas no mesmo dia e mantendo as expectativas de negócio intactas.
- Não foi alterada a implementação da API de estatísticas.
- Validação pendente: o push iniciou novos workflows; só marcar como resolvido depois de o Vitest/CI confirmar o resultado.

### Estado dos workflows anteriores (commit 71d4a79)

| Verificação | Resultado observado |
|---|---|
| Vitest | 528 passaram; 1 falhou por fixture temporal não determinística |
| ESLint | 214 erros e 1309 avisos; `ban-ts-comment` continua a bloquear |
| Security Audit | 12 vulnerabilidades de produção: 4 moderadas, 8 altas |
| Build Vercel | Concluído com sucesso |
| Deploy Vercel | Bloqueado por quota diária `api-deployments-free-per-day` (>100 deployments/24h) |

A falha do deploy é de quota externa; o build não falhou. A falha do Vitest foi corrigida no teste, mas ainda não está validada por um novo run.


## Correção de hook de acessibilidade — 18/11/2026

- O log ESLint do run `44254577712` identificou duas violações `react-hooks/rules-of-hooks` em `src/hooks/useAccessibility.ts`: `useRef` e `useEffect` eram invocados dentro da callback `useFocusTrap` criada por `useCallback`.
- No commit `0a73470dc6afb2c799e9fa8653bc56b763bc579f`, `useFocusTrap` foi extraído para um hook autónomo de nível superior; o efeito depende agora de `enabled` e `onEscape` em vez do objeto `options` completo.
- Validação pendente no CI; o restante lint não foi suprimido nem desativado.


## Redução de erros ESLint — 18/11/2026

- Run `44255161634` (commit `6498b9e`): o job lint terminou com falha. O log mostrou ainda 214 erros e 1309 avisos no total; os dois erros de `react-hooks/rules-of-hooks` em `useAccessibility.ts` já não aparecem no conjunto de erros extraído.
- Os erros restantes incluem `@ts-nocheck` em testes E2E/seed, `@ts-ignore`, imports `require`, `prefer-const`, e regras Next.js de navegação/script.
- No commit `234c1ad0d271bc3274d934a9691416a224bb90a0`, convertidas para `const` quatro declarações que o lint assinalou como não reatribuídas: `nextDate`, `where`, `hash`, `publicKey` e `privateKey` (quatro ficheiros de rotas).
- A alteração foi feita sem modificar condições, filtros, cálculos ou validações de negócio. A validação CI do commit `234c1ad` ainda não foi observada.
- Security Audit `44255161505`: falhou com 12 vulnerabilidades de produção (4 moderadas, 8 altas), incluindo advisories transitivos de `picomatch` e `zod <4.6.6`; o fix de Zod indicado é major e não foi aplicado.
- Deploy `44255161539`: build Vercel terminou com sucesso; publicação recusada pela quota `api-deployments-free-per-day` (>100 deployments/24h), bloqueio externo.


## Revisão da verificação pública e controlos de segurança — 18/11/2026

- `next.config.js` já define `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, HSTS e `Permissions-Policy`; CSP é aplicada em `src/proxy.ts` com nonce por pedido. Não foi necessário duplicar estes headers.
- `src/proxy.ts` já define limites específicos para login (5/15 min), registo (3/h), pagamentos e participações. A inspeção revelou que `/api/verificar-publico` não estava na lista de rotas públicas nem no mapa de rate limits, apesar de a página `/verificar` ser pública.
- No commit `f656a3ca23f6db77aa5d94364d43456a9fc34717`, `/api/verificar-publico` foi acrescentada à lista pública e recebeu limite de 20 pedidos/minuto por IP. A resposta continua a expor apenas os dados de verificação necessários (sem email/telefone/nome do jogador).
- Validação pendente no CI: confirmar acesso sem autenticação e resposta 429 sob excesso de pedidos.
- Nota de segurança adicional: `src/lib/rate-limit.ts` contém um identificador IP mais defensivo, mas o proxy usa diretamente `x-forwarded-for`; rever a confiança desse cabeçalho na infraestrutura Vercel antes de alterar o mecanismo.


## Segunda ronda de limpeza ESLint — 18/11/2026

- Run `44255820651` (commit `234c1ad`): ESLint passou de 214 para 207 erros; os erros `prefer-const` em `eventos/[id]`, `jogos`, `participacoes/[id]/prova` e `push/vapid-keys` desapareceram do relatório. O hook `useAccessibility` também deixou de apresentar violações React Hooks.
- No commit `963ccfc534cc687f341c4fe5c200dba7abef5fa1`, foram convertidas mais seis declarações `let` assinaladas pelo ESLint como não reatribuídas: `where` (admin entregas-saldo, comissões, RGPD e vendedor entrega-saldo), `html` (export relatório) e `updateData` (setup-status).
- Estas alterações são sintáticas e não alteram os valores nem a lógica das consultas/updates. A validação CI do commit `963ccfc` está pendente.


## Terceira ronda de ESLint e validação — 18/11/2026

### CI observado no commit `36d02a5`

- Run CI `44256083812`: job `lint` terminou com falha, mas a contagem baixou de 207 para **201 erros** (avisos mantiveram-se em 1309).
- Job `ci`: Prisma Client, TypeScript, Vitest, build Next.js, preparação da base SQLite e seed determinístico passaram. Playwright estava ainda em execução na última consulta.
- Run Security Audit `44256083954`: falhou com 12 vulnerabilidades de produção (4 moderadas, 8 altas). `glob`/`minimatch` e `picomatch` indicam correção não-major; Zod requer atualização breaking para 4.6.7 segundo o audit.

### Alteração aplicada

- Commit `61844dc86d9d04d9d9068e81685d477e2c871a9e`: em `src/lib/aldeia-progress.ts`, substituído o `require('@/lib/db')` executado dentro da função por import estático de `prisma` no topo do módulo; removido o `@ts-ignore` redundante sobre a importação Prisma.
- A lógica de progressão, cálculo de experiência, prémios e auditoria não foi alterada.
- Validação do commit `61844dc` pendente; não foram executados testes locais neste ambiente.

### Próximas ações

1. Aguardar o resultado do Playwright `44256083812` e registar as falhas funcionais concretas.
2. Verificar CI do commit `61844dc` antes de efectuar mais alterações de código.
3. Continuar a redução de erros ESLint por grupos, começando por imports `require` e declarações `prefer-const` com contexto suficiente; tratar `@ts-nocheck` e `@ts-ignore` caso a caso.
4. Planear a atualização de dependências vulneráveis, sem `npm audit fix --force` nem migração cega para Zod 4.


## Quarta ronda ESLint — correções prefer-const — 18/11/2026

- Aplicadas sete correções sintáticas `let` → `const` em `scripts/migrate-apostas-poio.ts`, `scripts/replace-design-tokens-extended.js`, `scripts/replace-design-tokens.js`, `src/__tests__/integration/game-lifecycle.test.ts`, `src/__tests__/integration/real-db/membros-gestao.test.ts`, `src/components/qr-code-generator.tsx` e `src/features/admin/hooks/use-admin-crud-handlers.tsx`.
- Commits sequenciais na `main`: `66a70ff`, `c434225`, `cf10f50`, `a278c84`, `3ec3f24`, `d62421a`, `039a6f9`.
- As alterações apenas tornam constantes bindings que o ESLint identificou como não reatribuídos.
- Validação pendente: os workflows iniciados pelos pushes ainda têm de confirmar a redução de erros; não foram executados testes locais neste ambiente.
- Restantes grupos identificados no relatório anterior: `@ts-nocheck`/`@ts-ignore`, imports `require()` em scripts/testes/rotas, duas regras Next.js e interface vazia em `src/hooks/use-eventos.ts`.


## Quinta ronda ESLint — regras de tipos e Next.js — 18/11/2026

- `src/hooks/use-eventos.ts`: interface vazia `UpdateEventoData extends Partial<CreateEventoData>` substituída por alias de tipo equivalente `type UpdateEventoData = Partial<CreateEventoData>`.
- `src/app/not-found.tsx`: link interno para a raiz substituído por `Link` de `next/link`.
- `src/app/docs/page.tsx`: elemento `<script>` síncrono de Swagger UI substituído por `Script` de `next/script`, com `strategy="afterInteractive"`; mantém-se o callback de inicialização após o carregamento.
- Commits: `11a0834`, `80855f8`, `e4033e6`.
- Validação CI pendente; estas alterações não foram testadas localmente.


## Sexta ronda ESLint — imports CommonJS nos módulos TypeScript — 18/11/2026

- Em quatro módulos TypeScript, `require('crypto')` foi substituído por imports estáticos de `node:crypto`.
- `src/app/api/auth/google/route.ts` usa agora `randomBytes` importado no topo para gerar o `state` OAuth com CSPRNG.
- `src/__tests__/integration/game-lifecycle.test.ts` e `src/__tests__/unit/raspadinha.test.ts` partilham o módulo de crypto importado; `src/__tests__/unit/game-logic.test.ts` observa `crypto.createHash` com `vi.spyOn`.
- Validação pendente por GitHub Actions. Não foram executados testes locais neste ambiente.


## Oitava ronda — controlo de concorrência do CI/CD — 18/11/2026

- Configurado `concurrency` no workflow CI para cancelar execuções obsoletas da mesma branch, evitando consumir runners com commits intermédios.
- Configurado `concurrency` no Security Audit para cancelar auditorias obsoletas da mesma branch.
- Deploy Vercel passa a serializar execuções por branch sem cancelar um deployment em curso (`cancel-in-progress: false`); pushes compostos apenas por Markdown e documentação deixam de provocar deploys.
- Objetivo: reduzir acumulação de workflows provocada por commits frequentes na `main`, mantendo a execução final representativa do estado mais recente.
- Validação dos workflows pendente após o push; os runs já enfileirados antes desta alteração não são automaticamente garantidos como cancelados.




## Continuação — correção de regressão TypeScript e CI — 18/11/2026

- [x] Reavaliado o commit `fdc9d6f7b9f401ee90e33bab10a6dc24177e37c0` e consultados os workflows CI, Security Audit e Deploy.
- [x] Identificada regressão em `src/lib/aldeia-progress.ts`: `Aldeia.moedaInterna` é `Float` no schema Prisma, mas o código usava `Prisma.Decimal` e `.toNumber()`. Remover a conversão incompatível e somar valores numéricos (`number`), preservando a regra de recompensa.
- [ ] Validar no CI o typecheck e os testes após a correção; não foram executados testes locais.
- [ ] O ESLint no run `44257802393` apresenta 180 erros e 1309 avisos (face a 201 erros na medição anterior). Permanecem `ban-ts-comment`, `@ts-nocheck` e outros erros; continuar por contexto.
- [ ] Security Audit `44257802349` continua a falhar; o audit completo reporta 29 vulnerabilidades (4 moderadas, 25 altas), sem remediação automática segura confirmada.
- [ ] Deploy `44257802457` falhou; consultar o log completo antes de classificar a causa. A quota Vercel anterior não deve ser assumida como causa deste run sem evidência.

### Evidência CI dos commits `60751bc` e `fdc9d6f`

- Run CI `44257802393`: falhou no job `ci` durante `npm run typecheck`; erro em `src/lib/aldeia-progress.ts:78` por incompatibilidade entre `Decimal` e `Float`, e chamada `.toNumber()` sobre `number`. O Vitest/build não ficaram validados neste run porque o job parou no typecheck.
- Run ESLint `44257802393`: 180 erros e 1309 avisos. Entre os erros observados: `@ts-ignore` em `src/lib/sms.ts` e `src/lib/stripe.ts`, `@ts-nocheck` em `src/scripts/check-test-users.ts`, além de ocorrências noutros módulos.
- Run CI `44257650903` reproduziu a mesma falha TypeScript; a alteração de imports em `aldeia-progress.ts` é a causa imediata e foi corrigida na ronda seguinte.
- Run Security Audit `44257802349`: falhou; instalação reportou 29 vulnerabilidades (4 moderadas, 25 altas). A auditoria de produção deve ser lida no log específico para identificar os advisories ainda activos.
- Run Deploy `44257802457`: terminou com falha. A causa será confirmada pelo log do job; não classificar automaticamente como quota Vercel.
- Não foram executados testes locais. A validação da correção depende de um novo CI.




## Continuação — teste de hash compatível com Node.js — 18/11/2026

- [x] O CI do commit `eee7131` confirmou que o typecheck passa após a correcção de `moedaInterna`.
- [x] Vitest: 528 passaram e 1 falhou em `src/__tests__/unit/game-logic.test.ts`; o teste tentava usar `vi.spyOn` sobre `node:crypto.createHash`, cuja propriedade não pode ser redefinida no runtime Node.js.
- [x] Substituído o teste intrusivo por uma verificação do contrato observável do identificador (`AG-` + 8 dígitos hexadecimais + timestamp base36), mantendo o comportamento de produção inalterado.
- [ ] Validar a suite Vitest completa no CI seguinte; não foram executados testes locais.
- [ ] Lint continua com 180 erros e 1309 avisos; não foram removidas supressões de tipos em massa.
- [ ] Security Audit mantém 12 vulnerabilidades de produção (4 moderadas, 8 altas).
- [ ] Deploy Vercel recusado por quota diária `api-deployments-free-per-day`; o build de artefactos chegou à fase de publicação.

### Resultados CI do commit `eee7131`

- `npm run typecheck`: passou; a falha de tipo em `src/lib/aldeia-progress.ts:78` foi eliminada.
- Vitest: 528 testes passaram e 1 falhou. A causa foi `TypeError: Cannot redefine property: createHash` no spy de `src/__tests__/unit/game-logic.test.ts:259`; por isso, os passos seguintes de build/E2E do job CI foram ignorados.
- ESLint: 180 erros e 1309 avisos; principais grupos `ban-ts-comment` e `no-require-imports`.
- Security Audit: `npm audit --omit=dev --audit-level=high` reportou 12 vulnerabilidades (4 moderadas, 8 altas).
- Vercel: build dos artefactos concluído até à fase de publicação; publicação recusada pela quota diária `api-deployments-free-per-day` (>100 deployments/24h).


## CI concluído e diagnóstico das falhas E2E — 18/11/2026

- Run CI: `44264364771`, commit `75e2dd2d50d711968ad8a2071bd02c691cc21e2d`; terminou com falha no job CI devido a dois testes Playwright.
- Resultados confirmados: typecheck passou; Vitest passou com 529 testes; build passou; preparação SQLite e seed E2E passaram; Playwright: 65 passaram, 2 falharam, 3 ignorados.
- `e2e/cofre-cashbox-flow.spec.ts`: o log apontava timeout em `networkidle` após navegar para o dashboard do vendedor. A aplicação estava a usar o cookie errado nos testes: o servidor `next start` executa em produção e a constante `AUTH_COOKIE_NAME` usa `__Host-auth-token`, não `auth-token`.
- `e2e/login-compra-raspadinha.spec.ts`: o método Saldo Aldeias ficava disabled porque o browser não estava autenticado com o cookie que a API da carteira reconhece; o seed atribui 1000€ ao super administrador e o jogo custa 2€. Não se alterou o saldo nem a regra de pagamento.
- Alterações aplicadas nos dois testes: cookie de produção com atributos `Secure`, `Path=/`, sem Domain; utilizador retornado pelo login guardado no localStorage. No fluxo Cofre, esperas por separadores funcionais substituem esperas por `networkidle`.
- Removidos os dois `@ts-nocheck` dos testes E2E alterados.
- Ainda não há validação das alterações: os testes só serão considerados resolvidos após novo CI verde.
- ESLint permanece com 180 erros/1309 avisos; Security Audit com 12 vulnerabilidades de produção (4 moderadas, 8 altas); deploy Vercel continua condicionado à quota diária.


## Prompt mestre e correcção E2E — 18/11/2026

- Criado `PROMPT_CONCLUSAO_AUTONOMA.md` como referência central para levar o projecto a produção com critérios verificáveis.
- `AGENTS.md` exige agora a leitura do prompt mestre antes de cada sessão.
- CI run `44268750503`: TypeScript, Vitest, build, preparação SQLite e seed passaram; Playwright terminou com 65 aprovados, 2 falhados e 3 ignorados.
- Causa das duas falhas: os testes injectavam manualmente cookies com `browserContext.addCookies`, apesar de `/api/auth/login` já emitir o cookie através de `setAuthCookie()`. O fixture `request` não partilhava o armazenamento de cookies do browser.
- Os testes foram alterados para autenticar via `page.context().request`, que partilha o cookie jar do browser, e verificar o cookie `__Host-auth-token` e os seus atributos. Aguardam nova validação CI.
- O workflow de deployment ignora agora `e2e/**` e `playwright.config.ts`, para que alterações apenas de testes não consumam quota de deployment.
- ESLint: 178 erros e 1309 avisos.
- Security Audit: 12 vulnerabilidades de produção (4 moderadas, 8 altas).
- Deploy: build de artefactos passou; publicação bloqueada pela quota diária Vercel `api-deployments-free-per-day`.
- Próximo passo: validar o novo CI, analisar Playwright e depois reduzir erros ESLint por grupos pequenos.


## Infraestrutura CI e compilação de produção — 18/11/2026

- CI `44297294757`: typecheck passou e Vitest passou com 529 testes. Playwright não arrancou porque o runner `ubuntu-latest` passou a Ubuntu 26.04, incompatível com Playwright 1.60.0.
- Runners de lint e CI fixados em `ubuntu-24.04` para usar uma imagem suportada pelo Playwright.
- Deploy `44297294863`: Next.js compilou, mas o typecheck de produção falhou em `playwright.config.ts` porque `@playwright/test` não está instalado no ambiente de produção. Este ficheiro é configuração de testes, não código de runtime; foi excluído do tsconfig da aplicação.
- Aguardam novo CI e build Vercel para validar estas alterações.
- ESLint: 159 erros e 1309 avisos após remoção de várias supressões. A maioria dos erros remanescentes está associada a regras React Compiler/hooks, que requerem correcções reais por componente.
- Security Audit: 12 vulnerabilidades de produção (4 moderadas, 8 altas).
- Deployment anterior também continua sujeito à quota Vercel `api-deployments-free-per-day`.


## Validação de infraestrutura e primeiro grupo React Compiler — 18/11/2026

- CI `44298140640` passou no job principal: typecheck, 529 testes Vitest, instalação Chromium em Ubuntu 24.04, build Next.js, push SQLite, seed e Playwright (67 aprovados, 3 ignorados).
- A exclusão de `playwright.config.ts` do tsconfig da aplicação corrigiu o erro de produção relativo à dependência dev `@playwright/test`.
- Build de artefactos Vercel passou; deploy falhou apenas porque a quota diária `api-deployments-free-per-day` excedeu 100 deployments/24h.
- ESLint continua a falhar com 159 erros e 1309 avisos. Foram preparadas correcções de efeitos e paginação nas páginas de Entregas/Pedidos e valor derivado na página Euromilhões; validação pendente.
- Security Audit mantém 12 vulnerabilidades de produção (4 moderadas, 8 altas).
- Próximo passo: verificar o novo lint e corrigir as falhas React Compiler por componentes, começando pelos restantes hooks de carregamento.


## Correcção da página Euromilhões — 18/11/2026

- O CI `44299258443` identificou erro TS1434 na linha 76 da página Euromilhões. Causa: marcador textual acidental no lugar do efeito de polling, introduzido durante a remoção do efeito de pré-selecção.
- Removido o marcador e preservado o polling de grelhas. O estado de montagem foi substituído por `useSyncExternalStore` para manter o comportamento client-only sem actualizar estado dentro de um effect.
- Lint desceu de 159 para 153 erros e de 1309 para 1305 avisos, apesar de o typecheck ter bloqueado o run.
- Aguarda novo CI para validar a correcção e os três fluxos administrativos.


## Ciclo ESLint — 18/11/2026

- CI `44299680572`: job principal concluído com sucesso. Typecheck, build, 529 testes Vitest e Playwright (67 aprovados, 3 ignorados) passaram.
- ESLint falhou com 153 erros e 1306 avisos. Os erros explícitos incluem quatro `@ts-nocheck` em seeds, `@ts-ignore` em imports RBAC/Sentry/SMS e imports CommonJS em três scripts.
- Alterações preparadas: remoção de `@ts-nocheck` nos quatro seeds; substituição dos `@ts-ignore` por `@ts-expect-error` localizadas; conversão dos scripts para imports ESM nativos.
- A validação destas alterações depende do novo CI; não há execução local npm disponível nesta sessão.
- Security Audit `44299682737`: 12 vulnerabilidades de produção (4 moderadas, 8 altas). Cadeias: `glob`/`minimatch` via Sentry, `picomatch` via Rollup CommonJS e `zod` via @vercel/blob → @vercel/oidc → @vercel/cli-config.
- Deploy `44299680519`: Prisma, schema e build Vercel passaram; publicação recusada por quota diária `api-deployments-free-per-day` (>100 deployments/24h), bloqueio externo.
- Próxima acção: validar novo lint/typecheck; depois investigar e actualizar dependências por cadeia, sem `npm audit fix --force`.


## Validação do primeiro ciclo ESLint — 18/11/2026

- Commit `b626322`: removidas quatro directivas `@ts-nocheck`, convertidos três scripts para ESM e substituídos imports `@ts-ignore` por `@ts-expect-error` localizadas.
- CI `44301485563`: lint reduziu de 153 para 138 erros e manteve 1306 avisos. Os erros remanescentes são maioritariamente regras React Compiler/hooks: setState síncrono dentro de effects, acesso a funções antes da declaração, funções impuras durante render e criação de componentes durante render.
- Typecheck falhou porque três `@ts-expect-error` eram supérfluas (TS2578); essas directivas foram removidas. O erro é de tipagem/supressão, não de comportamento da aplicação.
- Build Vercel `44301485582` falhou pelo mesmo TS2578, antes da fase de publicação. Não foi quota neste run.
- Security Audit `44301485542`: continuam 12 vulnerabilidades de produção (4 moderadas, 8 altas).
- Próximo passo: revalidar typecheck/build com as directivas removidas e corrigir os erros React Compiler por componentes, em grupos pequenos.


## React Query — Entregas e Pedidos administrativos (18/11/2026)

- CI `44302130079`: job principal passou integralmente: typecheck, 529 testes Vitest, build, preparação SQLite, seed e Playwright (67 aprovados, 3 ignorados).
- ESLint continua a falhar com 138 erros e 1306 avisos; os erros são maioritariamente React Compiler/hooks.
- Deployment `44302130095`: build Vercel passou; publicação bloqueada pela quota diária `api-deployments-free-per-day`.
- Security Audit `44302130082`: continua a falhar com 12 vulnerabilidades de produção (4 moderadas, 8 altas).
- Preparada migração de `src/app/admindashboard/entregas/page.tsx` e `src/app/admindashboard/pedidos/page.tsx` para TanStack Query: os dados passam a ser derivados de `useQuery`, com `enabled` dependente da sessão e chaves de cache por utilizador/estado. Foram removidos os effects e setters de carregamento.
- A alteração aguarda CI próprio; não confundir a validação do commit anterior com a validação deste novo refactor.


## React Query — erros de leitura visíveis (18/11/2026)

- Inspecção do commit `1c0ebd6`: as funções `queryFn` das páginas Entregas e Pedidos lançavam erro para respostas HTTP não-OK, mas apanhavam imediatamente a excepção e devolviam `[]`. Isto convertia indisponibilidade da API, 401/403 ou falha de rede num estado vazio aparentemente válido.
- Corrigido em `src/app/admindashboard/entregas/page.tsx` (commit `c43ec9c`) e `src/app/admindashboard/pedidos/page.tsx` (commit `1148dd6`): as excepções propagam-se ao TanStack Query; a UI distingue falha de carregamento de ausência real de registos e oferece retry manual.
- Verificação posterior: ambos os ficheiros na `main` contêm o estado de erro acessível e já não contêm o `return []` no catch que ocultava a falha.
- O estado combinado dos commits mostra apenas checks de deployment Vercel em falha por `build-rate-limit`; não foi possível observar um check CI de código através do endpoint de status consultado. Não classificar isto como falha de TypeScript/testes.
- Não existe execução local do projecto neste ambiente; typecheck, ESLint, Vitest e build permanecem pendentes de workflow CI.
- Próxima revisão: os endpoints são paginados (`createPaginatedResponse`), mas as páginas fazem paginação local e não enviam parâmetros de página/limite; verificar o limite predefinido e corrigir a paginação para não omitir dados.


## Auditoria P0 — concorrência na confirmação de entregas (18/11/2026)

- Revisão de `src/app/api/admin/entregas-saldo/route.ts` identificou que o handler PATCH lê a entrega e valida `estado === 'solicitado'` antes da transacção; executa os dois updates de saldo e os dois registos de transacção dentro de `prisma.$transaction`, mas só depois actualiza `EntregaSaldo.estado` fora da transacção.
- Risco: pedidos concorrentes podem passar ambos na validação inicial e executar transferências duplicadas antes de a entrega mudar de estado. Trata-se de risco de integridade financeira P0, não de um problema de interface.
- Não foi alterado o fluxo financeiro nesta ronda: a correcção exige transição condicional/claim atómico e teste real-DB de concorrência para não introduzir inconsistências em dinheiro.
- A tarefa foi adicionada ao TODO como prioridade máxima, com critérios de aceitação de exactamente uma transferência e rollback integral.


## Correcção P0 — atomicidade de entregas de saldo (18/11/2026)

- A auditoria confirmou que o PATCH de `/api/admin/entregas-saldo` transferia saldo dentro de uma transacção, mas actualizava o estado da entrega fora dela. Isto permitia double-spend em confirmações concorrentes.
- Criado `src/lib/entrega-saldo.ts`: claim condicional da transição, débito com guarda `saldo >= valor`, crédito ao administrador e criação dos dois movimentos financeiros passam a ocorrer na mesma transacção.
- O estado só é considerado confirmado se a transferência e os lançamentos forem todos concluídos; falha de saldo provoca rollback integral.
- As transições confirmar/rejeitar/concluir são condicionais ao estado de origem. Repetição/conflito de estado devolve HTTP 409; saldo insuficiente devolve HTTP 400.
- `executeWithRetry` passou a reconhecer conflitos/deadlocks Prisma e bloqueios SQLite, com limite de três tentativas.
- Adicionado teste real-DB `src/__tests__/integration/real-db/entregas-saldo.test.ts`: duas confirmações simultâneas (exactamente uma deve vencer), rollback por saldo insuficiente e rejeição repetida sem movimentos financeiros.
- Commits de implementação: `b0d24d1`, `76c9292`, `0b66635`, `0fa2098`, `bc9b59a`, `3988145`, `5a591a7`, `b6e69a6`, `9e42fac`.
- Validação ainda pendente: não existe execução npm/Prisma local neste ambiente; o endpoint de estado consultado apenas expõe checks Vercel, que estão a falhar por quota de deployments. É necessário confirmar o workflow CI do último commit para avaliar typecheck, Vitest, ESLint e build.


## Continuação — auditoria de entregas de saldo e CI (18/11/2026)

### Estado real do CI do commit `66c5ade98ef3a0f8be604a8b6c098303b83b8619`

- O workflow `CI — Lint, Typecheck & Tests` terminou com falha global.
- O job `ci` passou: geração Prisma, TypeScript, Vitest, build Next.js, preparação/seed SQLite e Playwright E2E.
- O job `lint` falhou com 136 erros e 1312 avisos. As regras React Hooks/Compiler apontam sobretudo `setState` síncrono em efeitos, referências antes da declaração, funções impuras durante render e memoização não preservada. São problemas de código a corrigir gradualmente; não se deve desligar as regras.
- O workflow `Security Audit` falhou em `npm audit --omit=dev --audit-level=high`: 4 vulnerabilidades altas (Zod abaixo de 4.6.6, incluindo dependência transitiva via `@vercel/blob`/`@vercel/oidc`). As vulnerabilidades de `glob`/`minimatch` são moderadas e têm correção não-major indicada pelo npm. Não aplicar `--force` sem avaliar a migração Zod 4.
- Vercel continua a recusar deployments por `build-rate-limit`; esta falha é quota externa, não resultado de compilação.

### Alterações desta continuação

- A revisão do PATCH de entregas revelou ausência de auditoria persistente na operação financeira. A transição agora cria `AuditLog` dentro da mesma transação que altera o estado, debita/credita saldos e cria os movimentos financeiros.
- A auditoria regista actor, aldeia, ação, recurso, IP, User-Agent limitado a 500 caracteres e metadados de estado/valor. Se a operação falhar, o AuditLog também sofre rollback.
- PATCH passa a aceitar apenas administradores de aldeia e super administradores, valida `entregaId`, ação e observações, e lê apenas `id`/`aldeiaId` na verificação prévia do âmbito.
- Os testes reais da BD foram ampliados para verificar auditoria única na confirmação, rollback da auditoria em saldo insuficiente e registo da rejeição. Estes testes ainda aguardam execução no CI pós-commit.

### Próximas ações

1. Confirmar CI pós-commit e corrigir eventuais erros dos novos testes.
2. Corrigir o ESLint em pequenos grupos, começando por hooks e componentes com maior impacto funcional.
3. Isolar a migração Zod 4 e avaliar as APIs utilizadas, sobretudo nas dependências de produção.
4. Continuar auditoria de criação de pedidos de entrega e reconciliação de carteira/caixa/cofre.
