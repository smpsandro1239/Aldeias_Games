# Auditoria financeira — pagamentos, carteiras e reconciliação

Data: 18/11/2026  
Estado: auditoria inicial com riscos confirmados por leitura do código; correcções ainda não validadas nem marcadas como concluídas.

## Resumo de prioridade

| Prioridade | Área | Risco observado | Estado |
|---|---|---|---|
| P0 | Stripe | O fluxo de compra activo não envia metadata.tipo; o webhook só processa participação quando esse campo é participacao | Confirmado |
| P0 | MB WAY | A participação pendente é criada depois de iniciar o pagamento e não fica ligada ao transactionId; o webhook não a encontra | Confirmado |
| P0 | MB WAY/Stripe polling | Os endpoints GET alteram o estado da participação sem executar o processamento financeiro completo | Confirmado |
| P1 | Webhooks | Eventos failed são tratados como duplicados e não podem ser reclamados novamente | Confirmado |
| P1 | MB WAY | Carregamento sem transacção pendente correspondente é silenciosamente aceite e o evento é marcado concluído | Confirmado |
| P1 | Stripe | Não existe verificação de idempotência por session.id dentro do processamento de participações | Confirmado |
| P1 | Carteira | Entrega de saldo do vendedor usa verificação de saldo fora da transacção e decremento sem condição SQL | Confirmado |
| P1 | Ajuste de carteira | Notificação depois do commit pode falhar e devolver HTTP 500 apesar do saldo já ter sido alterado | Confirmado |
| P1 | Carregamentos | vendedorId e aldeiaId recebidos do body não são validados como vendedor activo da mesma aldeia | Confirmado |
| P1 | Reconciliação | É necessário reconciliar movimentos e saldos de wallet/cashbox/vault | Por aprofundar |

## 1. Stripe — classificação de eventos e valor cobrado

### P0 — metadata.tipo não é garantido no fluxo de compra

- src/app/api/pagamentos/stripe/route.ts:29-40 recebe metadata do pedido e envia-o para a Checkout Session, acrescentando userId, mas não deriva nem valida tipo a partir do jogo.
- src/hooks/useGamePage.ts:195 envia apenas { jogoId: jogo.id }.
- src/hooks/use-game-participation.ts:174 envia { jogoId, participante }, também sem tipo.
- src/app/api/stripe/webhook/route.ts:67-72 só processa quando tipo === 'participacao' ou tipo === 'carregamento_saldo'. Caso contrário, termina o switch e marca o evento como completed.

**Impacto:** o fluxo Stripe de participação pode cobrar o cartão e, ainda assim, não criar a participação nem creditar qualquer registo interno. A correcção deve ser feita no servidor: classificar o caso com base num payload validado e persistido, nunca confiar apenas num tipo arbitrário do cliente.

### P0 — preço de jogo não é validado no servidor

- POST /api/pagamentos/stripe valida o formato do pedido através de stripePaymentSchema, mas não consulta o jogo para confirmar que valor corresponde ao preço oficial × quantidade.
- src/app/api/stripe/webhook/route.ts:104 usa o montante pago na sessão para criar participações, sem comparar com o preço oficial do jogo.
- A rota src/app/api/stripe/checkout/route.ts também recebe valor e jogoId do body; deve ser confirmada como endpoint legado ou endurecida, não presumida inactiva sem prova de utilização.

**Correcção prevista:** gerar o preço no servidor a partir do jogo, quantidade e opções autorizadas; persistir uma intenção de pagamento com utilizador, aldeia, jogo, quantidade, preço em cêntimos e estado; no webhook, comparar moeda e montante exactos antes de alterar stock/saldo.

### P1 — idempotência por sessão e estado de pagamento

- src/app/api/stripe/webhook/route.ts:55-75 reclama event.id, mas processParticipacao não verifica se session.id já originou participações.
- O handler processa checkout.session.completed sem uma guarda explícita session.payment_status === 'paid'.

**Correcção prevista:** usar uma intenção de pagamento persistida e uma chave única por sessão, com transição condicional; só processar sessões pagas, validar currency === 'eur' e montante esperado, e cobrir retries após falha entre commit financeiro e confirmação do evento.

## 2. MB WAY — associação da participação ao pagamento

### P0 — o transactionId não chega à participação criada pelo cliente

- src/app/api/pagamentos/mbway/route.ts:39-47 só procura uma participação quando o body inclui participacaoId; nessa situação, valida ownership e estado e guarda referenciaPagamento.
- src/hooks/useGamePage.ts:172-187 inicia o pagamento MB WAY e só depois chama criarParticipacao('pendente'), sem participacaoId.
- src/hooks/use-game-participation.ts:154-166 segue a mesma ordem e cria a participação depois do pedido MB WAY, também sem a referência.
- `src/app/api/mbway/webhook/route.ts` exige agora correspondência em `Participacao.referenciaPagamento`; a procura alternativa em JSON livre foi removida no commit `3d71a310`. A ausência de correspondência gera erro explícito e permite retry do evento `failed`.

**Impacto:** o pagamento pode ser aceite pelo MB WAY, mas a participação não fica ligada à transacção; o webhook pode terminar como concluído sem actualizar a participação nem creditar cashback.

**Correcção prevista:** criar primeiro uma intenção/participação pendente no servidor; iniciar o MB WAY com essa referência; associar transactionId à intenção por transição condicional; em falha/cancelamento, fechar a intenção sem consumir stock nem deixar pedidos pendentes indefinidamente.

### P0 — polling contorna o processamento financeiro

- src/app/api/pagamentos/mbway/route.ts:180 actualiza a participação para concluido quando o fornecedor devolve completed, fora do processamento que cria cashback e movimento financeiro.
- src/app/api/pagamentos/stripe/route.ts:102 também altera o estado da participação no GET sem chamar o mesmo serviço transaccional do webhook.

**Impacto:** o polling pode vencer a corrida e marcar a participação concluída antes do webhook. No MB WAY, o webhook pode depois encontrar estadoPagamento === 'concluido' e sair sem creditar cashback. O estado da participação deixa de representar o conjunto completo dos lançamentos.

**Correcção prevista:** GET de estado deve ser read-only. A transição financeira deve existir num único serviço de domínio, invocado pelo webhook e por uma rotina de reconciliação autenticada, sempre com claim condicional e idempotência.

### P1 — carregamento MB WAY sem registo correspondente

- src/app/api/mbway/webhook/route.ts:136 usa if (!c) return no carregamento.
- O handler exterior continua e marca o evento como completed.

**Correcção prevista:** ausência de registo pendente deve ser erro operacional explícito, não sucesso. Guardar referência e montante esperados antes de confirmar o pedido externo, ou criar uma intenção idempotente que possa ser reconciliada.

## 3. Idempotência dos webhooks

- src/lib/webhook-helpers.ts cria WebhookEvent com unique (provider,eventId).
- Em conflito P2002, a implementação actual devolve sempre false. Um evento anteriormente marcado failed não pode ser reclamado para nova tentativa.
- Se o processamento financeiro fizer commit e a actualização final do evento falhar, o fornecedor pode repetir o webhook, mas a chave única impede nova execução. Se uma execução falhar antes do commit, também não há caminho de retry automático.

**Correcção prevista:** distinguir completed (duplicado definitivo), processing (em curso) e failed (reclamável por compare-and-swap); introduzir estratégia de lease para eventos presos, com limites e observabilidade. A lógica financeira tem de ser idempotente por session.id/transactionId, para que retry nunca duplique stock, participação ou crédito.

## 4. Carteira e carregamentos

### P1 — entrega de saldo do vendedor

- src/app/api/wallet/adjust/route.ts:48-66 verifica user.saldo antes da transacção e depois aplica increment: valor negativo sem condição saldo >= valorAbs.
- Duas entregas concorrentes podem passar na leitura inicial e produzir saldo negativo.
- O aldeiaId recebido no body é usado nos metadados e na selecção dos administradores sem validação explícita contra user.aldeiaId.

**Correcção prevista:** claim condicional updateMany({ where: { id, aldeiaId, saldo: { gte: valorAbs } } }) dentro da transacção; validar aldeia a partir da sessão; criar movimento e auditoria na mesma transacção; notificar depois do commit.

### P1 — ajuste manual de saldo

- src/app/api/wallet/adjust/route.ts:135-160 grava alteração de saldo e transacção na mesma transacção, mas a notificação em :169 corre depois do commit e não está protegida.
- Uma falha na notificação pode devolver 500 apesar do saldo já ter sido alterado, incentivando repetição pelo cliente.
- O valorAntes/valorDepois é calculado numa leitura anterior à transacção; para ajustes positivos não cria saldo negativo, mas o audit trail pode conter um valor anterior desactualizado sob concorrência.

**Correcção prevista:** notificação best-effort; cálculo e leitura de saldo dentro da transacção; criar um AuditLog estruturado ou manter um registo financeiro equivalente, sempre atómico.

### P1 — pedidos de carregamento com vendedor

- src/app/api/wallet/carregar/route.ts:66-83 aceita body.vendedorId e cria pedidoCarregamento sem validar que o vendedor existe, está activo, tem papel vendedor e pertence à mesma aldeia do utilizador.
- O aldeiaId pode vir do body, pelo que o isolamento multi-tenant precisa de ser reforçado.

**Correcção prevista:** resolver vendedor e aldeia na BD; derivar a aldeia do utilizador ou verificar explicitamente uma permissão global; criar pedido e auditoria na mesma transacção.

## 5. Reconciliação financeira — plano de verificação

Não assumir que o saldo actual é igual à soma de qualquer feed parcial. Construir uma reconciliação por entidade e moeda:

1. **Wallet:** User.saldo vs soma de Transacao.valor por utilizador, excluindo/identificando lançamentos reversos e tipos não monetários.
2. **Cashbox:** VendedorCashbox.saldo vs soma de VendedorCashboxTransaction.valor, agrupada por vendedor e aldeia.
3. **Vault:** Vault.saldo vs soma de VaultTransaction.valor com semântica explícita de entradas/saídas e estados confirmados.
4. **Participações:** valor cobrado no Stripe/MB WAY vs Participacao.valorPago, estado e referências externas.
5. **Pagamentos:** intenção, sessão/transacção do fornecedor, webhook, movimento interno, cashback, reembolso e estorno.
6. **Depósitos/levantamentos:** estado, saldo de origem/destino, movimento e AuditLog exactamente uma vez.
7. **Comissões/prémios:** verificar que a mesma operação não credita carteira, caixa e cofre em simultâneo sem uma regra explícita.

Criar relatório read-only que apresente divergências por aldeia, utilizador, vendedor, referência externa e intervalo temporal. Não corrigir saldos automaticamente: produzir proposta de ajuste com evidência e exigir revisão autorizada.

## 6. Sequência de implementação

1. Corrigir a associação de pagamentos MB WAY com intenção persistida e testes de ponta a ponta.
2. Corrigir a classificação e validação de montantes Stripe, com intenção persistida e idempotência por sessão.
3. Tornar GET de estado read-only e centralizar confirmação no serviço transaccional.
4. Corrigir retry de eventos failed e os casos MB WAY sem registo pendente.
5. Corrigir concorrência de entrega/ajuste de carteira e isolamento de carregamentos.
6. Criar testes real-DB concorrentes e testes de repetição para cada operação.
7. Criar relatório de reconciliação read-only e só depois propor rotinas de compensação.
8. Executar TypeScript, Vitest, testes real-DB, Playwright, build e CI de segurança; actualizar TODO.md e PROGRESS.md com resultados observados.

## 7. Critérios de aceitação

- Cada pagamento tem uma intenção interna única antes de contactar o fornecedor.
- Montante, moeda, ownership, jogo, quantidade e aldeia são verificados no servidor.
- Webhook repetido, polling concorrente e retry após erro não duplicam participação, stock, cashback ou saldo.
- Nenhum GET altera saldos ou estado financeiro.
- Uma falha de notificação nunca converte commit financeiro em HTTP 500.
- Cada movimento tem referência, actor, estado, timestamp e registo de auditoria atómico.
- Testes concorrentes demonstram que os saldos nunca ficam negativos e que cada evento gera no máximo um lançamento.
- Reconciliação detecta divergências sem alterar automaticamente dados financeiros.


## Actualização de implementação — 18/11/2026

- **Corrigido, por validar:** `GET /api/pagamentos/stripe` já não altera estado financeiro e verifica `metadata.userId` contra a sessão autenticada.
- **Corrigido, por validar:** `GET /api/pagamentos/mbway` já não altera participações; mantém a validação de ownership antes de consultar o fornecedor.
- **Corrigido, por validar:** `POST /api/pagamentos/stripe` deriva `metadata.tipo` no servidor, filtra metadados para campos operacionais e deixou de actualizar participações por ID arbitrário enviado pelo cliente.
- **Corrigido, por validar:** página de sucesso apresenta o valor em euros conforme contrato da API.
- Testes adicionados em `src/__tests__/unit/payment-status-readonly.test.ts`; aguardam CI.
- Permanecem P0: intenção MB WAY persistida e associada ao `transactionId`, preço oficial e quantidade Stripe validados no servidor, `payment_status`/moeda no webhook e idempotência financeira por sessão/transacção.


## Actualização de webhooks — 18/11/2026

- `claimWebhookEvent` agora permite retry condicional de eventos `failed`, mantendo bloqueio para eventos `processing` e `completed`; testes unitários e real-DB acrescentados, ainda por validar em CI.
- MB WAY passou a classificar a operação a partir dos registos internos de carregamento/participação e a falhar se a referência não existir ou for ambígua; deixou de aceitar a classificação do payload como fonte de verdade.
- Stripe valida `payment_status=paid`, `currency=eur` e montante positivo; participações guardam `referenciaPagamento=session.id` e a transacção verifica essa referência antes de criar participações/cashback.
- O fluxo MB WAY continua incompleto enquanto os hooks não persistirem e associarem o `transactionId` a uma participação pertencente ao utilizador; manter como P0 aberto.
- O preço oficial e quantidade de participações Stripe ainda não são comparados com o montante cobrado; manter como P0 aberto.


## Estado de validação do ciclo — 18/11/2026

As alterações de consultas read-only, classificação Stripe, retry de webhooks, validação básica de sessão Stripe e classificação MB WAY por registos internos estão **corrigidas, por validar**. Os status checks observáveis dos commits mostram apenas os deployments Vercel bloqueados por `build-rate-limit`; não há evidência de execução dos jobs TypeScript/Vitest/Playwright. A validação real-DB e o CI devem passar antes de mudar o estado para validado.


### Actualização — associação por referência dedicada (18/11/2026)

- No commit `3d71a310b2a18cc83be836f1df73a28b07911555`, o webhook MB WAY deixou de procurar referências em `dadosParticipacao` (JSON livre) e passou a exigir exclusivamente `referenciaPagamento`.
- Esta alteração reduz o risco de colisão/associação acidental, mas não resolve a criação tardia da participação. O P0 permanece aberto: os hooks continuam a iniciar o pagamento antes de criar a participação e não fornecem uma referência interna ao endpoint MB WAY.
- Sem execução local ou CI confirmado para este commit, a alteração está corrigida por leitura, mas por validar.
