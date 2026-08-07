# Política de Retenção de Dados & Acordo de Processamento (RGPD)

**Projeto:** Aldeias Games — Plataforma de jogos de sorte (rifas, raspadinhas, euromilhões, poio da vaca)
**Data:** 07/08/2026
**Versão:** 1.0

---

## 1. Âmbito

Esta política define os períodos de retenção dos dados pessoais processados pela
plataforma Aldeias Games e os mecanismos automáticos de anonimização e purga.
Aplica-se a todos os dados armazenados em base de dados, backups e logs.

**Princípios (Art. 5º RGPD):** minimização, limitação de conservação, integridade
e confidencialidade. A plataforma processa dados apenas para o fim a que se
destinam (execução de vendas de bilhetes, atribuição de prémios, contabilidade).

---

## 2. Categorias de dados e períodos de retenção

| Categoria | Dados | Retenção | Ação ao fim do prazo |
|-----------|-------|----------|----------------------|
| Conta de utilizador | nome, email, telefone, password (hash) | Duração da conta + 12 meses após pedido de eliminação | Eliminação definitiva |
| Dados de clientes em participações | `nomeCliente`, `telefoneCliente`, `emailCliente` | **365 dias** após a participação | **Anonimização automática** (cron semanal) |
| Registos financeiros | transações, depósitos, levantamentos, cofre | 10 anos (obrigação fiscal — Art. 123º CIRC) | Arquivo contabilístico (não eliminável) |
| Eventos de webhook | `WebhookEvent` (Stripe/MBWay) | **365 dias** | **Purga automática** (cron semanal) |
| Notificações | `Notificacao` | 180 dias após leitura | **Purga automática** |
| Logs de auditoria | `AuditLog`, `LogAcesso` | 730 dias | Avaliação anual; arquivo |
| Dados de jogo (participações) | hash, resultados, números | 365 dias após o sorteio | Anonimização (sem valores identificáveis) |

> Os períodos automáticos são executados pelos cron jobs `/api/rgpd/anonimizacao`
> (segundas-feiras 03:00 UTC) e `/api/rgpd/purga` (segundas-feiras 04:00 UTC),
> ambos autenticados com `CRON_SECRET`.

---

## 3. Mecanismo de anonimização

A anonimização (`src/lib/rgpd.ts` → `anonymizeParticipacoes`) executa:

1. Seleciona participações com `createdAt <= hoje - 365 dias` que ainda tenham
   `nomeCliente`, `telefoneCliente` ou `emailCliente` preenchidos.
2. Substitui **todos** os campos por `NULL` — não deixando nenhum dado
   identificável ou pseudo-identificável.
3. Regista um `AuditLog` com ação `RGPD_ANONIMIZACAO` por participação (contagem,
   data e prazo aplicado) — nunca os valores anonimizados.

A operação é **idempotente**: uma segunda execução não encontra alvos e não
altera nada.

---

## 4. Mecanismo de purga

A purga (`purgeOldData`) elimina definitivamente:

- `WebhookEvent` com `status = "completed"` mais antigos que 365 dias;
- `Notificacao` lidas mais antigas que 180 dias.

Cada execução regista `AuditLog` com ação `RGPD_PURGA` e as contagens.
Eventos de webhook com `status != "completed"` (em processamento ou falhados)
**nunca** são purgados automaticamente — exigem revisão manual para diagnóstico.

---

## 5. Direitos dos titulares

| Direito | Implementação |
|---------|---------------|
| Acesso (Art. 15º) | Exportação dos dados do utilizador via dashboard/perfil |
| Retificação (Art. 16º) | Edição de perfil + alterações sensíveis com aprovação (`PendingAldeiaChange`) |
| Apagamento (Art. 17º) | Eliminação de conta (admin) + anonimização automática dos dados de cliente |
| Portabilidade (Art. 20º) | Exportação CSV (`src/lib/export-utils.ts`) |
| Oposição (Art. 21º) | Desativação de notificações e marketing |

---

## 6. Subcontratantes

| Fornecedor | Dados | Finalidade |
|------------|-------|------------|
| Vercel Inc. | código, env vars, cache, logs de deploy | Hospedagem (prévia contrato Vercel DPA) |
| Vercel Postgres (Neon) | toda a base de dados | Armazenamento de dados |
| Stripe | dados de pagamento | Processamento de pagamentos (DPA Stripe) |
| Google Cloud | dados OAuth (email, nome) | Autenticação social |

---

## 7. Violação de dados

- Notificação à CNPD e aos titulares em 72h (Art. 33º/34º RGPD) em caso de risco
  elevado;
- Toda a atividade sensível é registada em `AuditLog` para investigação forense.

---

*Documento mantido em `docs/DPA.md`. Revisto anualmente ou em caso de alteração
de categorias de dados ou subcontratantes.*
