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

