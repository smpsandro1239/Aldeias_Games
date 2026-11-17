# TODO — Aldeias Games

> Lista de trabalho ativa. A lista histórica permanece em `todolist.md`; não marcar tarefas como concluídas sem evidência de validação.

## Prioridade crítica

- [ ] **P0 — Dependências de produção:** resolver o `npm audit --omit=dev --audit-level=high` que falha na branch `main`. Evidência inicial: `@sentry/nextjs` (crítico), `follow-redirects` (alto) e `zod` (alto; correção indicada pelo npm implica migração major para Zod 4). Atualizar primeiro sem alterações major e planear a migração de Zod separadamente.
- [ ] **P0 — CI de segurança:** voltar a executar a auditoria após atualizar o lockfile e confirmar que não existem vulnerabilidades high/critical nas dependências de produção.
- [ ] **P1 — Compatibilidade de dependências:** rever PRs Dependabot abertos individualmente; não integrar atualizações major sem typecheck, testes e build.

## Prioridade alta

- [ ] **P1 — Segurança de autenticação e autorização:** completar auditoria endpoint a endpoint (RBAC, CSRF, rate limiting, isolamento multi-tenant e PII).
- [ ] **P1 — Integridade financeira:** rever concorrência e idempotência em todos os fluxos de carteira, caixa, cofre, pagamentos e webhooks.

## Prioridade média

- [x] **P2 — Recorrência mensal:** cálculo partilhado entre criação, cron e pré-visualização; correção do overflow de dias 30/31 e testes de regressão. Código atualizado em 17/11/2026; validação CI pendente.
- [ ] **P2 — Qualidade do frontend:** auditoria de acessibilidade, estados de erro/loading e componentes client com logs de depuração.
- [ ] **P2 — Backups:** validar backup externo e procedimento de restauro com evidência operacional.

## Regras de conclusão

Uma tarefa só passa a concluída depois de executar os testes relevantes e verificar o resultado do CI. Falhas de infraestrutura ou serviços externos devem ser registadas como bloqueios, não como defeitos de código.
