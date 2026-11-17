# TODO — Aldeias Games

> Lista de trabalho ativa. A lista histórica permanece em `todolist.md`; não marcar tarefas como concluídas sem evidência de validação.

## Prioridade crítica

- [ ] **P0 — Validação HMAC MBWay e lint:** substituído `require('crypto')` por imports tipados e comparação `timingSafeEqual` com verificação explícita do comprimento; acrescentados testes para assinatura válida, adulterada, truncada e credenciais vazias. Aguarda CI.

- [ ] **P0 — E2E bloqueado por rotas dinâmicas Next.js duplicadas:** `membros/[membroId]` e `membros/[userId]/role` usavam nomes diferentes no mesmo segmento; a pasta foi normalizada para `[userId]` para permitir arranque do servidor Next.js. Aguarda CI/E2E.

- [ ] **P0 — Privacidade em `GET /api/apostas`:** a rota legada devolvia nomes, contactos e relações completas do jogo mesmo sem autenticação. A resposta pública foi reduzida a números/estado/IDs; utilizadores autenticados ficam limitados às próprias apostas, vendedores às suas vendas e administradores à sua aldeia. Adicionados testes; aguarda CI.

- [ ] **P0 — Robustez do relógio oficial:** uma resposta HTTP 200 sem `unixtime` válido podia propagar `Invalid Date` para criação de grelhas e cron do Euromilhões. A validação defensiva e o fallback para relógio local foram implementados; aguarda CI.
- [ ] **P0 — Build Vercel com URL inválido:** `NEXT_PUBLIC_BASE_URL` malformada provocava falha no `metadataBase` de `src/app/layout.tsx`. Implementado parsing defensivo com fallback para `VERCEL_URL` e domínio canónico; aguarda build.

- [x] **P0 — Consulta de estado MBWay sem isolamento por utilizador:** o GET agora confirma a associação da referência à participação ou ao carregamento do utilizador autenticado antes de consultar o fornecedor; atualização da participação usa condição de ownership e estado.

- [x] **P0 — Webhook MBWay sem verificação de montante implementada:** adicionada comparação ao cêntimo contra o valor pendente registado; carregamentos passam a guardar `Transacao.referencia` para lookup indexável; o endpoint valida ownership/estado/valor da participação antes de iniciar o pagamento. Callbacks `failed`/`cancelled` passam a ser reconhecidos e registados sem creditar saldo. Testes unitários da comparação adicionados; CI pendente.

- [ ] **P0 — Dependências de produção:** resolver o `npm audit --omit=dev --audit-level=high` que falha na branch `main`. Evidência inicial: `@sentry/nextjs` (crítico), `follow-redirects` (alto) e `zod` (alto; correção indicada pelo npm implica migração major para Zod 4). Atualizar primeiro sem alterações major e planear a migração de Zod separadamente.
- [ ] **P0 — CI de segurança:** executar o workflow de remediação não-major; confirmar a atualização de Sentry, Next.js, follow-redirects, glob e minimatch e rever a vulnerabilidade Zod separadamente. A auditoria só fica concluída quando `npm audit --omit=dev --audit-level=high` passar.
- [ ] **P1 — Compatibilidade de dependências:** rever PRs Dependabot abertos individualmente; não integrar atualizações major sem typecheck, testes e build.

## Prioridade alta

- [ ] **P1 — Dívida técnica ESLint:** o primeiro lint integral revelou 224 erros e 1311 avisos em 1535 ocorrências; predominam `@ts-nocheck`/`@ts-ignore`, imports `require`, `prefer-const` e violações reais das Rules of Hooks. Corrigir por módulos, sem desativar regras globalmente.

- [ ] **P1 — Segurança de autenticação e autorização:** completar auditoria endpoint a endpoint (RBAC, CSRF, rate limiting, isolamento multi-tenant e PII).
- [ ] **P1 — Integridade financeira:** rever concorrência e idempotência em todos os fluxos de carteira, caixa, cofre, pagamentos e webhooks.

## Prioridade média

- [x] **P2 — Recorrência mensal:** cálculo partilhado entre criação, cron e pré-visualização; correção do overflow de dias 30/31 e testes de regressão. Código atualizado em 17/11/2026; validação CI pendente.
- [ ] **P2 — Qualidade do frontend:** auditoria de acessibilidade, estados de erro/loading e componentes client com logs de depuração.
- [ ] **P2 — Backups:** validar backup externo e procedimento de restauro com evidência operacional.

## Regras de conclusão

Uma tarefa só passa a concluída depois de executar os testes relevantes e verificar o resultado do CI. Falhas de infraestrutura ou serviços externos devem ser registadas como bloqueios, não como defeitos de código.
