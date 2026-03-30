# Relatório de Análise UX/UI por Role - Aldeias Games

**Data:** 30/03/2026  
**Versão:** 1.0  
**Projeto:** Aldeias Games - Plataforma de Angariação de Fundos

---

## Sumário Executivo

Este relatório analisa a experiência de utilizador para cada role no sistema Aldeias Games, identificando gaps de UX/UI, funcionalidades em falta e recomendações para garantir uma experiência imersiva e consistente.

---

## 1. Visão Geral dos Roles

| Role | Descrição | Objetivo Principal |
|------|-----------|-------------------|
| **super_admin** | Administrador da plataforma | Gestão global de todas as aldeias e organizações |
| **aldeia_admin** | Administrador local | Gestão de eventos, jogos e vendedores da sua organização |
| **vendedor** | Equipa de vendas | Vender rifas/bilhetes e acompanhar comissões |
| **user** | Jogador/Cliente | Participar em jogos e ganhar prémios |

---

## 2. Análise Detalhada por Role

---

### 2.1 SUPER_ADMIN - Administrador da Plataforma

#### ✅ O que já existe:
- Dashboard completo com estatísticas globais
- Gestão de aldeias/organizações
- Analytics com gráficos (Recharts)
- Gestão de utilizadores
- Aba "Aldeias" exclusiva

#### ❌ Gaps Identificados:

| # | Problema | Prioridade | Severidade |
|---|----------|-----------|------------|
| 1 | Não há menu de navegação dedicado - usa tabs internos | Alta | Média |
| 2 | Analytics mostra dados fake/percentuais fixos | Crítica | Alta |
| 3 | Não há visualização de logs de auditoria | Média | Média |
| 4 | Não há gestão de planos SaaS UI | Alta | Alta |
| 5 | Falta overview global de todas as aldeias num mapa/lista | Média | Baixa |
| 6 | Não há métricas de receita/saúde da plataforma | Alta | Alta |

#### 🎯 Melhorias Recomendadas:

1. **Dashboard Overview Global**
   - Mapa de Portugal com aldeias participantes
   - Total de receita gerada
   - Número de jogadores activos
   - Tendência de crescimento

2. **Gestão de Planos**
   - Lista de planos disponíveis
   - Clientes por plano
   - Conversões/upgrades

3. **Sistema de Alertas**
   - Notificações para eventos problemáticos
   - Alertas de pagamento falhado
   - Relatórios automáticos

---

### 2.2 ALDEIA_ADMIN - Administrador Local

#### ✅ O que já existe:
- Dashboard com estatísticas do evento
- Gestão completa de Eventos
- Gestão completa de Jogos (CRUD)
- Gestão de Vendedores
- Visualização de Vencedores
- Analytics locais
- Resultados externos (EuroMilhões, etc.)
- Conversão de prémios em saldo

#### ❌ Gaps Identificados:

| # | Problema | Prioridade | Severidade |
|---|----------|-----------|------------|
| 1 | **Não há wizard de configuração inicial** - cria aldeia sem guiá-lo | Crítica | Alta |
| 2 | Não há gestão de prémios por jogo | Crítica | Alta |
| 3 | UI de winners está confusa - lista mistura estados | Alta | Média |
| 4 | Não há histórico de transações completo | Alta | Média |
| 5 | Não há QR codes para partilha de jogos | Média | Baixa |
| 6 | Não há template de email para notificações | Média | Baixa |
| 7 | Modal de criar jogo é complexo demais | Média | Média |
| 8 | Não há preview dos jogos antes de ativar | Alta | Alta |

#### 🎯 Melhorias Recomendadas:

1. **Wizard de Configuração**
   ```
   Passo 1: Dados da Aldeia (nome, tipo, contactos)
   Passo 2: Primeiro Evento (nome, datas, meta)
   Passo 3: Primeiro Jogo (tipo, prémios, preço)
   Passo 4: Configurar pagamentos (Stripe/MBWay)
   Passo 5: Convidar vendedores
   ```

2. **Gestão de Prémios**
   - CRUD completo de prémios
   - Upload de imagens
   - Opção de valor alternativo em dinheiro
   - Ordem de atribuição

3. **Dashboard de Resultados**
   - Gráfico de participantes por dia
   - Receita vs meta
   - Top vendedores
   - Taxa de conversão

4. **Ferramentas de Marketing**
   - Gerar QR code para jogo
   - Link de partilha para redes sociais
   - Poster/Banner para imprimir

---

### 2.3 VENDEDOR - Equipa de Vendas

#### ✅ O que já existe:
- POS Mobile simplificado
- Dashboard de vendas
- Histórico de vendas
- Visualização de comissões
- Venda desktop (form completo)

#### ❌ Gaps Identificados:

| # | Problema | Prioridade | Severidade |
|---|----------|-----------|------------|
| 1 | **Não há login/logout dedicado** - usa o mesmo do jogador | Crítica | Alta |
| 2 | POS Mobile não mostra preview do bilhete | Alta | Média |
| 3 | Não há impressão de recibo | Alta | Alta |
| 4 | Não há gestão de stock por vendedor | Alta | Alta |
| 5 | UI parece "admin" em vez de "vendedor" - falta enfoque | Alta | Alta |
| 6 | Não há tutorial/onboarding inicial | Alta | Média |
| 7 | Comissões não são visíveis claramente | Média | Média |
| 8 | Não há metas/objectivos de vendas | Média | Baixa |

#### 🎯 Melhorias Recomendadas:

1. **App Vendedor Dedicado**
   ```
   - Login separado com PIN rápido
   - Dashboard minimalista focado em vendas
   - Um-Click venda
   - Scanner de QR codes (futuro)
   ```

2. **Experiência POS Mobile**
   ```
   ┌─────────────────────────┐
   │   VENDER RIFA           │
   │                         │
   │   [Evento: Festa 2026]  │
   │                         │
   │   ┌─────┬─────┬─────┐  │
   │   │ 001 │ 002 │ 003 │  │
   │   ├─────┼─────┼─────┤  │
   │   │ 004 │ 005 │ 006 │  │
   │   └─────┴─────┴─────┘  │
   │                         │
   │   Total: €10.00         │
   │                         │
   │   [  VENDER  ]          │
   └─────────────────────────┘
   ```

3. **Recibo Digital**
   - QR code com link para verificar
   - Opção de enviar por SMS/WhatsApp
   - Impressão térmica (futuro)

4. **Sistema de Metas**
   - Barra de progresso semanal
   - Bónus por atingir metas
   - Leaderboard opcional

---

### 2.4 USER - Jogador/Cliente

#### ✅ O que já existe:
- Landing page com jogos disponíveis
- Dashboard de jogos
- Carteira/saldo
- Histórico de participações
- Sistema de raspadinhas
- Sistema de rifas
- Sistema de Poio da Vaca

#### ❌ Gaps Identificados:

| # | Problema | Prioridade | Severidade |
|---|----------|-----------|------------|
| 1 | **Não há notifications em tempo real** para ganhos | Crítica | Alta |
| 2 | **Não há celebração de vitória** - apenas badge | Crítica | Alta |
| 3 | Histórico de participações é confuso | Alta | Média |
| 4 | Não há loja/carteira para adicionar saldo | Crítica | Alta |
| 5 | Landing page mistura conteúdo para logged-in e logged-out | Alta | Média |
| 6 | Não há gamificação (badges, níveis, conquistas) | Média | Baixa |
| 7 | Não há programa de referral | Média | Baixa |
| 8 | UI do Poio da Vaca não é imersiva | Alta | Alta |
| 9 | Não há tutorial para cada jogo | Alta | Média |
| 10 | FAQ/Regras de cada jogo não são visíveis | Média | Média |

#### 🎯 Melhorias Recomendadas:

1. **Celebrações de Vitória**
   ```
   ┌─────────────────────────────┐
   │                             │
   │      🎉 PARABÉNS! 🎉       │
   │                             │
   │   ┌───────────────────┐     │
   │   │    🏆 TROFÉU     │     │
   │   │                   │     │
   │   │   1º Prémio      │     │
   │   │   Vale €50        │     │
   │   │                   │     │
   │   └───────────────────┘     │
   │                             │
   │   [Ver no Histórico]        │
   │                             │
   └─────────────────────────────┘
   ```
   - Animação de confetti
   - Som de celebração
   - Partilha nas redes sociais

2. **Loja de Saldo**
   - Adicionar saldo via MBWay
   - Adicionar saldo via Stripe
   - Histórico de carregamentos
   - 5% cashback automático

3. **Gamificação**
   - Níveis de jogador (Iniciado → Expert)
   - Badges por conquistas
   - Leaderboard semanal
   - Desafios diários

4. **Jogos Imersivos**
   - Tutorial interativo no primeiro jogo
   - Regras sempre visíveis
   - Feedback visual/háptico ao selecionar
   - Animação de "compra" do número

5. **Perfil/Ranking**
   - Número total de vitórias
   - Total angariado
   - Posição no ranking da aldeia
   - Estatísticas pessoais

---

## 3. Problemas Transversais (Todos os Roles)

### 3.1 Acessibilidade

| Problema | Impacto | Solução |
|----------|---------|---------|
| Contraste insuficiente em elementos | Utilizadores com visão reduzida | Verificar todos os textos contra fundo |
| Sem suporte a keyboard navigation | Utilizadores sem rato | Tab order + focus states |
| Sem ARIA labels | Screen readers | Adicionar aria-label a todos os botões |
| Touch targets < 44px | Mobile users | Garantir mínimo 44x44px |

### 3.2 Performance

| Problema | Impacto | Solução |
|----------|---------|---------|
| Carregamento lento de dashboards | Experiência poor | Lazy loading + skeleton screens |
| Sem cache de API | requests excessivos | Implementar SWR/React Query |
| Imagens sem otimização | Dados móveis | WebP + lazy loading |

### 3.3 Mobile-First

| Problema | Impacto | Solução |
|----------|---------|---------|
| Tabelas não responsivas | Impossível usar em mobile | Converter para cards |
| Modais demasiado grandes | UI quebrada | Full-screen em mobile |
| Navegação confusa | Utilizadores perdidos | Bottom nav consistente |

---

## 4. Matriz de Funcionalidades por Role

| Funcionalidade | super_admin | aldeia_admin | vendedor | user |
|---------------|:-----------:|:------------:|:--------:|:----:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Gestão Eventos | ❌ | ✅ | ❌ | ❌ |
| Gestão Jogos | ❌ | ✅ | ❌ | ❌ |
| Gestão Prémios | ❌ | ✅ | ❌ | ❌ |
| Gestão Vendedores | ❌ | ✅ | ❌ | ❌ |
| Ver Analytics | ✅ Global | ✅ Local | ❌ | ❌ |
| POS/Vendas | ❌ | ❌ | ✅ | ❌ |
| Carteira | ❌ | ❌ | ❌ | ✅ |
| Jogar | ❌ | ❌ | ❌ | ✅ |
| Notificações | ❌ | ✅ | ❌ | ✅ |
| Configurações | ✅ | ✅ | ❌ | ✅ |
| Perfil | ✅ | ✅ | ✅ | ✅ |
| Importar Resultados | ❌ | ✅ | ❌ | ❌ |
| QR Code Partilha | ❌ | ✅ | ❌ | ❌ |
| Recibo/Bilhete | ❌ | ❌ | ✅ | ❌ |

---

## 5. Roadmap de Melhorias Prioritárias

### Fase 1: Crítico (Semana 1-2)
1. ✅ Celebração de vitória para jogadores
2. ✅ Loja de saldo/carteira para users
3. ✅ POS mobile melhorado para vendedores
4. ✅ Fix bugs críticos (stock, cashback)

### Fase 2: Importante (Semanas 3-4)
5. ✅ Wizard de configuração para aldeia_admin
6. ✅ Gestão de prémios completa
7. ✅ Notificações push
8. ✅ Recibo digital para vendas

### Fase 3: Expansão (Semanas 5-6)
9. ✅ Gamificação (badges, níveis)
10. ✅ Analytics com dados reais
11. ✅ QR codes para partilha
12. ✅ Tutorial interativo para jogos

### Fase 4: Polimento (Semanas 7-8)
13. ✅ Acessibilidade completa (WCAG 2.1 AA)
14. ✅ Testes automatizados
15. ✅ Onboarding flow para cada role
16. ✅ Documentação de uso

---

## 6. Checklist de UX/UI por Role

### Todos os Roles
- [ ] Suporte a Dark Mode
- [ ] Skeleton screens durante loading
- [ ] Empty states informativos
- [ ] Error states com recovery
- [ ] Confirmações para ações destrutivas
- [ ] Feedback tátil (haptics)
- [ ] Animações suaves (150-300ms)

### super_admin
- [ ] Overview de receita global
- [ ] Mapa de aldeias ativas
- [ ] Alertas de sistema
- [ ] Export de relatórios

### aldeia_admin
- [ ] Wizard de configuração
- [ ] Preview de jogos
- [ ] QR code generator
- [ ] Templates de comunicação

### vendedor
- [ ] PIN de acesso rápido
- [ ] UI minimalista
- [ ] Recibo imprimível
- [ ] Metas visuais

### user
- [ ] Celebrações de vitória
- [ ] Loja de saldo
- [ ] Tutorial de jogos
- [ ] Gamificação
- [ ] Programa de referral

---

## 7. Conclusão

O projeto Aldeias Games tem uma base sólida, mas precisa de trabalho significativo em **experiência de utilizador** para se tornar verdadeiramente imersivo e profissional.

### Prioridades por Role:
1. **Jogador (user)**: Celebrações, loja de saldo, gamificação
2. **Vendedor**: POS dedicado, recibos, PIN de acesso
3. **Admin Aldeia**: Wizard de setup, gestão de prémios, preview
4. **Super Admin**: Analytics reais, overview global

### Métricas de Sucesso:
- Tempo de onboarding < 5 minutos
- Taxa de conclusão de venda > 80%
- NPS > 40
- Engagement > 3 jogos por sessão

---

*Relatório gerado para análise do projeto Aldeias Games*
