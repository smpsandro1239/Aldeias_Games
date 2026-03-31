# Design: Bottom Navigation & Dashboard por Role

**Data:** 2026-03-31  
**Projeto:** Aldeias Games - Dashboard UX Improvement  
**Versão:** 1.0

---

## 1. Visão Geral

Este documento especifica a estrutura de navegação inferior (Bottom Navigation) e Dashboard com métricas e ações rápidas para cada role do sistema Aldeias Games.

### Objetivos
- Navigation mobile-first com ícones específicos por role
- Métricas relevantes visíveis no topo do dashboard
- Ações rápidas (quick actions) para operações frequentes

---

## 2. Bottom Navigation

### Estrutura

| Role | Ícone 1 | Ícone 2 | Ícone 3 | Ícone 4 |
|------|---------|---------|---------|---------|
| **user** | Explorar | Jogos | Histórico | Perfil |
| **vendedor** | Vendas | Histórico | Metas | Perfil |
| **aldeia_admin** | Dashboard | Eventos | Jogos | Equipa |
| **super_admin** | Dashboard | Aldeias | Analytics | Config |

### Especificações Técnicas
- **Posição:** Fixa no fundo do ecrã (`fixed bottom-0`)
- **Responsivo:** Apenas visível em mobile (`md:hidden`)
- **Styling:** Glassmorphism com `backdrop-blur-2xl`
- **Ícone ativo:** Destaque com gradiente + escala (scale-110)
- **Labels:** 10px, maiúsculas, tracking-widest

### Componente
- **Ficheiro:** `src/components/bottom-nav.tsx`
- **Props:** `role?: string`, `currentPath?: string`

---

## 3. Dashboard Stats (Métricas)

### Métricas por Role

| Role | Métrica 1 | Métrica 2 | Métrica 3 | Métrica 4 |
|------|-----------|-----------|-----------|-----------|
| **super_admin** | Total Angariado | Jogadores | Eventos Ativos | Jogos Ativos |
| **aldeia_admin** | Angariado | Participantes | Vendas Hoje | Eventos Ativos |
| **vendedor** | Vendas Hoje | Valor Hoje | Comissão | Total Vendas |
| **user** | Saldo | Participações | Vitórias | Total Gasto |

### Especificações Técnicas
- **Layout:** Grid 2x2 (mobile) / 4 colunas (desktop)
- **Cards:** Estilo glassmorphism com ring de destaque no primeiro item
- **Formatação:** Valores monetários formatados com `formatCurrency()`

### Componente
- **Ficheiro:** `src/components/dashboard-stats.tsx`
- **Props:** `role?: string`, `stats?: object`

---

## 4. Quick Actions

### Ações por Role

| Role | Ação 1 | Ação 2 | Ação 3 | Ação 4 |
|------|--------|--------|--------|--------|
| **super_admin** | Criar Aldeia | Ver Aldeias | Analytics | Configurações |
| **aldeia_admin** | Criar Evento | Criar Jogo | Vendedores | Vencedores |
| **vendedor** | Nova Venda | Histórico | Metas | - |
| **user** | Ver Jogos | Participações | Adicionar Saldo | Perfil |

### Especificações Técnicas
- **Layout:** Grid de 4 colunas
- **Estilo:** Buttons ghost com ícones coloridos
- **Responsividade:** 2x2 em mobile

### Componente
- **Ficheiro:** `src/components/quick-actions.tsx`
- **Props:** `role?: string`, `onOpenModal?: function`

---

## 5. Integração

### Fluxo no page.tsx

```
Utilizador Autenticado:
├── QuickActions (todos os roles)
├── DashboardStats (apenas admins)
├── Dashboard Principal (Admin/Vendedor/Cliente)
└── BottomNav (específico por role)

Utilizador Não Autenticado:
├── Conteúdo Landing Page
└── BottomNav (padrão: Explorar, Aldeias, Competir, Carteira)
```

---

## 6. Alterações de Código

### Ficheiros Criados/Modificados

| Ficheiro | Ação | Descrição |
|----------|------|-----------|
| `src/components/bottom-nav.tsx` | Criado | Componente de navegação inferior |
| `src/components/dashboard-stats.tsx` | Criado | Componente de métricas |
| `src/components/quick-actions.tsx` | Criado | Componente de ações rápidas |
| `src/app/page.tsx` | Modificado | Integração dos componentes |

---

## 7. Screenshots de Referência

### Exemplo visual (Bottom Navigation):
```
┌─────────────────────────────┐
│         CONTEÚDO            │
│                             │
├─────────────────────────────┤
│  🏠     📊     🎮     ⚙️    │
│Dash  Eventos Jogos  Equipa  │
│   Bottom Nav (aldeia_admin)│
└─────────────────────────────┘
```

---

## 8. Próximos Passos

- [ ] Conectar QuickActions aos modais existentes (CreateEventoModal, CreateJogoModal)
- [ ] Popular DashboardStats com dados reais da API
- [ ] Adicionar animasções de transição
- [ ] Testar em dispositivos reais
