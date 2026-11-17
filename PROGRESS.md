# PROGRESS — Aldeias Games

## Estado da branch

- Branch de trabalho: `main`
- Commit de referência antes desta sessão: `28176292694eae3f6db0c391a5456703fa36091a`
- Repositório: `smpsandro1239/Aldeias_Games`
- Última atualização: 17/11/2026

## Trabalho desta sessão

### Concluído no código (validação pendente)

- [x] Leitura das instruções do repositório (`AGENTS.md`) e do prompt de análise (`ANALISE_CRITICA_PROMPT.md`).
- [x] Identificada divergência: o helper `src/lib/recurrence.ts` já corrigia parte do overflow mensal, mas o POST de criação e o cron mantinham implementações próprias; o helper de primeira ocorrência ainda alterava mês antes de definir o dia 1.
- [x] Corrigida a ordem de operações mensal em `computeFirstRecurrenceDate`.
- [x] POST `/api/eventos` passa a usar `computeFirstRecurrenceDate`.
- [x] Cron `/api/eventos/process-recurring` passa a usar `addRecurrence`.
- [x] Acrescentados testes unitários para datas de referência no dia 31 e preservação da hora.
- [x] Atualizada a tarefa histórica em `todolist.md`.

### Validação

- [ ] Vitest — executar suite de recorrência e suite completa.
- [ ] Typecheck.
- [ ] Lint.
- [ ] Build.
- [ ] Verificar CI e auditoria de dependências após o commit.

## Bloqueios e riscos identificados

- **Bloqueio CI conhecido:** a execução Security Audit de 16/11/2026 falhou no passo `npm audit --omit=dev --audit-level=high`, após instalação bem-sucedida. O log identifica 1 vulnerabilidade crítica em `@sentry/nextjs`, vulnerabilidades altas em `follow-redirects` e `zod`, além de moderadas em `glob/minimatch`. Não é falha de infraestrutura.
- **Migração Zod:** o npm indica que a correção de Zod requer versão 4, uma alteração major que exige revisão de compatibilidade antes de integrar.
- **PRs Dependabot:** existem PRs abertos; cada atualização será avaliada individualmente antes de integrar.

## Próximo passo

Resolver as vulnerabilidades de produção sem forçar atualizações major, avaliar a migração de Zod 4 isoladamente e executar novamente CI, testes, typecheck e build. Não declarar a tarefa de recorrência validada até o CI confirmar os testes.
