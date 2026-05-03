# Auditoria Completa - Sistema de Jogos Aldeias Games

Auditado em: 2026-05-03

---

## 1. CRIACAO DE JOGOS

### 1.1 Validacao Zod (createJogoSchema)

| Item | Status | Observacoes |
|------|--------|-------------|
| [OK] Schema baseado em Zod implementado | [OK] | src/lib/validations.ts:117-143 |
| [OK] Validacao de preco minimo (0.50EUR) | [OK] | Linha 122 |
| [OK] Validacao de stock minimo (1) | [OK] | Linha 123 |
| [AVISO] Campo limitePorUsuario sem validacao de maximo | [AVISO] | Apenas min(1) em linha 124 |
| [AVISO] percentagem sem validacao de soma total | [AVISO] | Risco de >100% total em raspadinhas |
| [FALTA] Validacao de eventoId obrigatorio ausente | [FALTA] | Schema permite undefined |
| [FALTA] Validacao de multiplos premios duplicados | [FALTA] | Camada duplicada no modal |
| [FALTA] Verificacao de consistencia configuracao por tipo | [FALTA] | Modal aceita dados inconsistentes |

### 1.2 Campos Obrigatorios vs Opcionais por Tipo

| Tipo | Campos Obrigatorios | Implementado | Caminho |
|------|---------------------|--------------|---------|
| Raspadinha | nome, tipo, preco, stockInicial, premios[], percentagem | [AVISO] Parcial | create-jogo-modal.tsx:683-787 |
| Rifa/Tombola | nome, tipo, preco, stockInicial, premios[] | [AVISO] Parcial | create-jogo-modal.tsx:789-840 |
| Poio da Vaca | nome, tipo, dimensoes, custoQuadrado, valorCompraVaca | [AVISO] Parcial | create-jogo-modal.tsx:842-895 |

### 1.3 Calculo de Rentabilidade e Lucro Minimo

| Item | Status | Caminho |
|------|--------|---------|
| [OK] Calculo para raspadinha (percentagem-based) | [OK] | route.ts:29-56 |
| [OK] Calculo para rifa/tombola (fixed prizes) | [OK] | route.ts:49-55 |
| [OK] Calculo para poio da vaca (dimensoes) | [OK] | route.ts:56-73 |
| [OK] Validacao minima 50% para raspadinha | [OK] | route.ts:258-263 |
| [AVISO] Calculo duplicado no frontend (nao sincronizado) | [AVISO] | create-jogo-modal.tsx:227-286 |
| [FALTA] Validacao 50% minimo em rifa nao obrigatoria | [FALTA] | So recomendado, nao bloqueado |
| [FALTA] Validacao 50% minimo em poio da vaca | [FALTA] | Nao implementada |

### 1.4 Geracao de Hash de Verificacao

| Item | Status | Caminho |
|------|--------|---------|
| [OK] SHA-256 implementado | [OK] | route.ts:8-27 |
| [OK] Prefixo AG- + timestamp | [OK] | Linha 26 |
| [AVISO] Hash nao inclui versao do schema | [AVISO] | V1.0 fixo em linha 22 |
| [FALTA] Verificacao de integridade pos-criacao | [FALTA] | Nao ha validacao de hash existente |
| [FALTA] Endpoint de verificacao publica | [FALTA] | Falta API GET /jogos/:id/verify |

### 1.5 Permissoes (aldeia_admin vs super_admin)

| Item | Status | Caminho |
|------|--------|---------|
| [OK] Verificacao de role em POST /jogos | [OK] | route.ts:194-198 |
| [OK] Verificacao de aldeia ownership | [OK] | route.ts:226-231 |
| [AVISO] Super admin pode criar sem evento | [AVISO] | Nao validado |
| [FALHA] Log de auditoria de criacao | [FALHA] | Falta em route.ts:329-338 |

### 1.6 Validacao de Evento Existente e Permissao da Aldeia

| Item | Status | Caminho |
|------|--------|---------|
| [OK] Busca evento por ID | [OK] | route.ts:214-217 |
| [OK] Verificacao 404 evento | [OK] | route.ts:219-224 |
| [OK] Isolamento aldeia_admin | [OK] | route.ts:226-231 |
| [AVISO] Nao verifica se evento esta ativo | [AVISO] | Falta verificacao estado evento |
| [FALHA] Validacao de data evento (nao passado) | [FALHA] | Pode criar jogo para evento passado |

---

## 2. CICLO DE VIDA DO JOGO

### 2.1 Estados: rascunho, aberto, pausado, fechado, finalizado

| Estado | Descricao | Status | Caminho |
|--------|-----------|--------|---------|
| Rascunho | Jogo nao disponivel | [AVISO] Parcial | Schema: EstadoJogo prisma |
| Aberto | Jogo ativo para participacoes | [OK] | route.ts default |
| Pausado | Temporariamente indisponivel | [AVISO] Parcial | Schema existe, nao usado |
| Fechado | Encerrado sem sortear | [OK] | Modal toggle implementa |
| Finalizado | Apos sorteio | [AVISO] Parcial | Marcado como sorteado |

### 2.2 Transicoes Permitidas

| De | Para | Permitido | Responsavel | Caminho |
|-----|------|-----------|-------------|---------|
| rascunho -> aberto | [OK] | aldeia_admin | [FALHA] Nao implementado |
| aberto -> pausado | [AVISO] | aldeia_admin | Falta endpoint |
| aberto -> fechado | [OK] | aldeia_admin | Modal toggle |
| fechado -> aberto | [OK] | aldeia_admin | Modal toggle |
| aberto -> finalizado | [OK] | aldeia_admin | Sorteio |

### 2.3 Toggle Estado (aberto <-> fechado)

| Item | Status | Caminho |
|------|--------|---------|
| [OK] Implementado no modal | [OK] | create-jogo-modal.tsx:214-230 |
| [OK] Botao Power/PowerOff | [OK] | JogosTab.tsx:214-230 |
| [AVISO] Sem confirmacao de acao | [AVISO] | onToggleEstado direto |
| [FALHA] Endpoint PATCH /jogos/:id/estado | [FALHA] | Usa PUT generico |
| [FALHA] Bloqueio se ha participacoes | [FALHA] | Pode fechar com vendas |

### 2.4 Fechamento Automatico por Stock Esgotado

| Item | Status |
|------|--------|
| [FALHA] Webhook de stock baixo | [FALHA] |
| [FALHA] Auto-fechamento stock=0 | [FALHA] |
| [FALHA] Notificacao admin stock baixo | [FALHA] |

---

## 3. PARTICIPACOES (COMPRAS)

### 3.1 Fluxo Completo: Selecao -> Pagamento -> Confirmacao

| Etapa | Status | Caminho |
|-------|--------|---------|
| [OK] Validacao de jogo aberto | [OK] | route.ts:197-202 |
| [OK] Verificacao stock | [OK] | route.ts:205-210 |
| [OK] Calculo valor total | [OK] | route.ts:213 |
| [FALHA] Verificacao limitePorUsuario | [FALHA] | Nao implementado |
| [OK] Transacao atomica PostgreSQL | [OK] | route.ts:251-473 |
| [OK] Atualizacao stock atomicamente | [OK] | route.ts:263-277 |

### 3.2 Validacao de Stock Disponivel (Concorrencia)

| Item | Status | Caminho |
|------|--------|---------|
| [OK] Lock otimista com update | [OK] | route.ts:263-277 |
| [OK] Condicao gte: quantidade | [OK] | Linha 266 |
| [AVISO] Retry em caso de conflito | [AVISO] | Nao implementado |
| [FALHA] Queue de espera | [FALHA] | Nao ha fila |

### 3.3 Verificacao de limitePorUsuario

| Item | Status | Caminho |
|------|--------|---------|
| [FALHA] Contador de participacoes/usuario | [FALHA] | Nao implementado |
| [FALHA] Bloqueio de compra excedente | [FALHA] | Falta no schema |
| [FALHA] Reset automatico | [FALHA] | Nao implementado |

### 3.4 Tipos de Pagamento

| Tipo | Status | Implementacao |
|------|--------|---------------|
| Saldo | [OK] | route.ts:216-223 |
| Dinheiro | [OK] | route.ts:287 - estado concluido |
| MBWay | [AVISO] | Schema existe, webhook? |
| Stripe | [AVISO] | Schema existe, webhook? |
| Transferencia | [AVISO] | Schema existe, sem webhook |

---

## 4. SORTEIO

### 4.1 API: /api/sorteios

| Item | Status | Caminho |
|------|--------|---------|
| [OK] POST executar sorteio | [OK] | route.ts:324-497 |
| [OK] PATCH commit/reveal | [OK] | route.ts:12-262 |
| [OK] GET listar sorteios | [OK] | route.ts:264-322 |
| [AVISO] Apenas rifa/tombola/poio suportados | [AVISO] | route.ts:180-181 |

### 4.2 Sorteio Real vs Teste (super_admin)

| Item | Status | Caminho |
|------|--------|---------|
| [OK] POST /sorteios/teste | [OK] | teste/route.ts:6-164 |
| [OK] Apenas super_admin/vendedor | [OK] | route.ts:10 |
| [OK] Modo simulacao (nao persiste) | [OK] | teste/route.ts:140-158 |
| [FALHA] Limitacao de testes/diario | [FALHA] | Nao limitado |

### 4.3 Geracao de Seed

| Item | Status | Caminho |
|------|--------|---------|
| [OK] crypto.randomBytes(32) | [OK] | route.ts:368 |
| [OK] Seed numerica para teste | [OK] | teste/route.ts:53-64 |
| [FALHA] Verificacao de seed repetida | [FALHA] | Nao validada |

### 4.4 Calculo de Vencedores por Tipo

| Tipo | Algoritmo | Status | Caminho |
|------|-----------|--------|---------|
| Poio da Vaca | Letra + Numero matching | [OK] | route.ts:121-152 |
| Rifa/Tombola | Numero matching | [OK] | route.ts:153-179 |
| Raspadinha | N/A (resultado no create) | [AVISO] | Ja revelado na criacao |

### 4.5 Persistencia de Resultados

| Item | Status | Caminho |
|------|--------|---------|
| [OK] Tabela Sorteio | [OK] | schema.prisma:461-479 |
| [OK] Tabela VencedorSorteio | [OK] | schema.prisma:481-492 |
| [OK] Hash SHA-256 | [OK] | route.ts:431 |
| [FALHA] Backup de seed | [FALHA] | Nao persistente |

---

## 5. PREMIOS

### 5.1 Claim Automatico vs Manual

| Tipo | Implementacao | Status | Caminho |
|------|---------------|--------|---------|
| Raspadinha | Manual via /claim-premio | [OK] | claim-premio/route.ts |
| Rifa/Tombola | Manual via admin | [OK] | VencedoresTab.tsx |
| Poio da Vaca | Manual via admin | [OK] | Via VencedoresSorteio |

### 5.2 Conversao em Saldo

| Item | Status | Caminho |
|------|--------|---------|
| [OK] Endpoint /claim-premio | [OK] | claim-premio/route.ts:25-228 |
| [OK] Transacao atomica | [OK] | claim-premio/route.ts:158-205 |
| [OK] Verificacao duplicado | [OK] | claim-premio/route.ts:142-155 |
| [FALHA] Notificacao de claim concluido | [FALHA] | Nao implementado |

### 5.3 Entrega Fisica (premioEntregue)

| Item | Status | Caminho |
|------|--------|---------|
| [OK] Campo premioEntregue | [OK] | schema.prisma:427 |
| [OK] Toggle em VencedoresTab | [OK] | VencedoresTab.tsx:115-143 |
| [FALHA] Assinatura/confirmacao fisica | [FALHA] | Nao implementado |

---

## 6. FRONTEND

### 6.1 Modais

| Modal | Status | Caminho |
|-------|--------|---------|
| CreateJogoModal | [OK] | create-jogo-modal.tsx |
| SorteioModal | [OK] | sorteio-modal.tsx |
| TransparencyModal | [OK] | transparency-modal.tsx |
| VencedorDetailModal | [OK] | vencedor-detail-modal.tsx |
| Confirmacao acoes criticas | [FALHA] | Falta em JogosTab |

### 6.2 Validacoes Cliente

| Item | Status | Caminho |
|------|--------|---------|
| [OK] Validacao formulario | [OK] | create-jogo-modal.tsx |
| [OK] Validacao lucratividade | [OK] | create-jogo-modal.tsx:227-266 |
| [FALHA] Validar percentagem > 100% | [FALHA] | Nao implementado |
| [FALHA] Sanitizacao XSS | [FALHA] | Falta sanitizacao |

---

## 7. SEGURANCA

### 7.1 Rate Limiting

| Endpoint | Limite | Status | Caminho |
|----------|--------|--------|---------|
| /auth/login | 5/15min | [OK] | rate-limit.ts:24-27 |
| /auth/register | 3/min | [OK] | rate-limit.ts:29-32 |
| /api/* | 100/min | [OK] | rate-limit.ts:34-37 |
| /participacoes | 20/min | [OK] | rate-limit.ts:39-42 |
| /claim-premio | 10/min | [AVISO] | Custom local |
| /sorteios | [FALHA] | [FALHA] | Nao implementado |

### 7.2 SQL Injection (Prisma)

| Item | Status | Observacoes |
|------|--------|-------------|
| [OK] Prisma ORM | [OK] | Usa prepared statements |
| [OK] Validacao Zod | [OK] | Sanitiza entrada |
| [AVISO] DadosParticipacao raw JSON | [AVISO] | route.ts:284 - parse JSON |

### 7.3 XSS (dadosParticipacao)

| Item | Status | Caminho |
|------|--------|---------|
| [AVISO] JSON.stringify sem sanitizacao | [AVISO] | route.ts:284, 297 |
| [FALHA] Escape HTML em dados | [FALHA] | Falta sanitize |
| [FALHA] Content Security Policy | [FALHA] | Nao configurado |

### 7.4 CSRF

| Item | Status | Caminho |
|------|--------|---------|
| [AVISO] SameSite=Lax cookie | [AVISO] | auth.ts:37 |
| [FALHA] CSRF token | [FALHA] | Nao implementado |

---

## 8. TESTES

### 8.1 Testes Unitarios (Logica de Negocio)

| Arquivo | Status | Cobertura |
|---------|--------|-----------|
| game-logic.test.ts | [OK] | calcularRentabilidade, gerarHash |
| rate-limit.test.ts | [OK] | Funcoes de rate limit |
| validations.test.ts | [OK] | Schemas Zod |
| [FALHA] Teste de webhook handlers | [FALHA] | Nao testado |

### 8.2 Testes Integracao (API)

| Item | Status | Caminho |
|------|--------|---------|
| [AVISO] game-lifecycle.test.ts | [AVISO] | Cobertura parcial |
| [FALHA] Teste fluxo completo compra | [FALHA] | Nao implementado |

### 8.3 Testes E2E

| Cenario | Status |
|---------|--------|
| Criar -> Comprar -> Sortear -> Vencer | [FALHA] |
| Multiplos vencedores empate | [FALHA] |
| Claim premio duplicado | [FALHA] |

---

## 9. BANCO DE DADOS

### 9.1 Migrations Prisma

| Item | Status | Caminho |
|------|--------|---------|
| [OK] Schema definido | [OK] | schema.prisma |
| [OK] Enums criados | [OK] | schema.prisma:582-711 |
| [AVISO] Indices basicos | [AVISO] | Em models |

### 9.2 Constraints

| Tabela | Constraint | Status |
|--------|------------|--------|
| User | email unique | [OK] |
| Evento | slug unique | [OK] |
| Jogo | stockAtual <= stockInicial | [FALHA] |

### 9.3 Indices

| Campo | Tipo | Status |
|-------|------|--------|
| User.email | index | [OK] |
| User.role | index | [OK] |
| User.aldeiaId | index | [OK] |
| Evento.aldeiaId | index | [OK] |
| Participacao.estadoPagamento | index | [OK] |
| Jogo.estado | index | [OK] |

---

## 10. OBSERVABILIDADE

### 10.1 Logs

| Tipo | Status | Caminho |
|------|--------|---------|
| Console.error | [OK] | Em todos APIs |
| Log de acesso | [OK] | auth.ts:193-221 |
| Audit log acoes | [AVISO] | AuditLog model criado |
| [FALHA] Structured logging | [FALHA] | Nao implementado |

### 10.2 Metricas

| Item | Status | Caminho |
|------|--------|---------|
| GameAnalytics model | [OK] | schema.prisma:930-961 |
| Analytics endpoint | [AVISO] | Existe mas incompleto |
| [FALHA] Prometheus/Grafana | [FALHA] | Nao integrado |

---

## PRIORIDADES DE IMPLEMENTACAO

### [CRITICO]
1. Validacao limitePorUsuario em participacoes
2. Webhook Stripe/MBWay implementar
3. CSRF protection
4. Rate limit em /sorteios
5. Testes E2E completos

### [IMPORTANTE]
1. Content Security Policy
2. Sanitizacao XSS em dadosParticipacao
3. Retry em conflitos stock
4. Notificacao de claims
5. Validacao percentagem > 100%

### [MELHORIA]
1. Structured logging
2. Request ID tracing
3. Dashboard metricas
4. Offline detection
5. Retry automatico UI

---

## ARQUIVOS AUDITADOS

- src/app/api/jogos/route.ts (339 linhas)
- src/app/api/participacoes/route.ts (649 linhas)
- src/app/api/sorteios/route.ts (497 linhas)
- src/app/api/sorteios/teste/route.ts (164 linhas)
- src/app/api/participacoes/[id]/claim-premio/route.ts (228 linhas)
- src/components/modals/create-jogo-modal.tsx (935 linhas)
- src/components/modals/sorteio-modal.tsx (183 linhas)
- src/features/admin/components/tabs/JogosTab.tsx (290 linhas)
- src/features/admin/components/tabs/VencedoresTab.tsx (197 linhas)
- src/lib/validations.ts (253 linhas)
- src/lib/auth.ts (221 linhas)
- src/lib/rate-limit.ts (161 linhas)
- prisma/schema.prisma (968 linhas)
- src/__tests__/unit/game-logic.test.ts (401 linhas)