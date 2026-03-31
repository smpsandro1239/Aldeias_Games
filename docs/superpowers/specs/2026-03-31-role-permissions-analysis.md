# Análise Detalhada: Roles e Permissões do Sistema

**Data:** 2026-03-31  
**Versão:** 1.0

---

## 1. Hierarquia de Roles

```
super_admin (Nível Global)
    │
    ├── aldeia_admin (Nível Aldeia)
    │       │
    │       ├── vendedor (Nível Aldeia)
    │       │
    │       └── user (Cliente Final)
    │
    └── [sem acesso a outras aldeias]
```

---

## 2. SUPER_ADMIN - Administrador Global

### Descrição
Administrador máximo do sistema. Acesso a TODAS as aldeias e funcionalidades globais.

### Permissões Completas

| Categoria | Ação | Permitido |
|-----------|------|-----------|
| **Aldeias** | Criar aldeia | ✅ Sim |
| **Aldeias** | Editar aldeia | ✅ Sim (qualquer uma) |
| **Aldeias** | Eliminar aldeia | ✅ Sim |
| **Aldeias** | Ver todas aldeias | ✅ Sim |
| **Eventos** | Criar evento | ✅ Sim (em qualquer aldeia) |
| **Eventos** | Editar evento | ✅ Sim |
| **Eventos** | Eliminar evento | ✅ Sim |
| **Jogos** | Criar jogo | ✅ Sim |
| **Jogos** | Editar jogo | ✅ Sim |
| **Jogos** | Eliminar jogo | ✅ Sim |
| **Jogos** | Ativar/Desativar jogo | ✅ Sim |
| **Jogos** | Executar sorteio | ✅ Sim |
| **Utilizadores** | Criar utilizador | ✅ Sim |
| **Utilizadores** | Editar qualquer utilizador | ✅ Sim |
| **Utilizadores** | Eliminar utilizador | ✅ Sim |
| **Utilizadores** | Atribuir role | ✅ Sim (excepto super_admin) |
| **Vendedores** | Criar vendedor | ✅ Sim |
| **Vendedores** | Ver comissões | ✅ Sim (todas) |
| **Vendedores** | Ajustar saldo vendedor | ✅ Sim |
| **Vencedores** | Ver todos os vencedores | ✅ Sim |
| **Vencedores** | Confirmar entrega de prémio | ✅ Sim |
| **Vencedores** | Converter prémio em saldo | ✅ Sim |
| **Backup** | Exportar dados | ✅ Sim |
| **Config** | Gerir planos | ✅ Sim |
| **Analytics** | Ver estatísticas globais | ✅ Sim |

### Dashboard AdminDashboard - Elementos

```
┌─────────────────────────────────────────────────────┐
│  DASHBOARD GLOBAL                                  │
├─────────────────────────────────────────────────────┤
│  [Stats Cards]                                      │
│  ├─ Total Angariado (todas aldeias)                │
│  ├─ Participações (todas)                         │
│  ├─ Eventos Ativos                                │
│  └─ Jogos Ativos                                  │
├─────────────────────────────────────────────────────┤
│  [Tabs]                                            │
│  ├─ Visão Geral ──── Ver todas aldeias             │
│  ├─ Analytics ────── Gráficos globais             │
│  ├─ Eventos ──────── CRUD completo                 │
│  ├─ Jogos ────────── CRUD + ativar/desativar      │
│  ├─ Vencedores ───── Todos os prémios              │
│  ├─ Verificar ────── Hash verification            │
│  ├─ Utilizadores ─── CRUD todos                   │
│  └─ Aldeias ──────── CRUD completo                │
├─────────────────────────────────────────────────────┤
│  [Modals]                                          │
│  ├─ Criar Aldeia                                  │
│  ├─ Criar Evento                                  │
│  ├─ Criar Jogo (Rifa/Poio da Vaca/Raspadinha)    │
│  ├─ Criar Utilizador                              │
│  └─ Sorteio                                       │
└─────────────────────────────────────────────────────┘
```

---

## 3. ALDEIA_ADMIN - Administrador de Aldeia

### Descrição
Gestor de uma aldeia específica. Acesso limitado à sua aldeia.

### Permissões Completas

| Categoria | Ação | Permitido |
|-----------|------|-----------|
| **Aldeias** | Criar aldeia | ❌ Não |
| **Aldeias** | Editar aldeia | ⚠️ Apenas a sua |
| **Aldeias** | Eliminar aldeia | ❌ Não |
| **Aldeias** | Ver todas aldeias | ❌ Apenas a sua |
| **Eventos** | Criar evento | ✅ Sim (na sua aldeia) |
| **Eventos** | Editar evento | ✅ Sim (da sua aldeia) |
| **Eventos** | Eliminar evento | ✅ Sim (da sua aldeia) |
| **Jogos** | Criar jogo | ✅ Sim |
| **Jogos** | Editar jogo | ✅ Sim (da sua aldeia) |
| **Jogos** | Eliminar jogo | ✅ Sim (da sua aldeia) |
| **Jogos** | Ativar/Desativar jogo | ✅ Sim (da sua aldeia) |
| **Jogos** | Executar sorteio | ✅ Sim |
| **Utilizadores** | Criar utilizador | ✅ Sim (vendedor, user) |
| **Utilizadores** | Editar utilizador | ⚠️ Apenas da sua aldeia |
| **Utilizadores** | Eliminar utilizador | ⚠️ Apenas da sua aldeia |
| **Utilizadores** | Atribuir role | ⚠️ Não pode dar aldeia_admin/super_admin |
| **Vendedores** | Criar vendedor | ✅ Sim |
| **Vendedores** | Ver comissões | ✅ Sim (da sua aldeia) |
| **Vendedores** | Ajustar saldo vendedor | ✅ Sim |
| **Vencedores** | Ver vencedores | ✅ Sim (da sua aldeia) |
| **Vencedores** | Confirmar entrega | ✅ Sim |
| **Vencedores** | Converter prémio em saldo | ✅ Sim |
| **Backup** | Exportar dados | ❌ Não |
| **Config** | Gerir planos | ❌ Não |
| **Analytics** | Ver estatísticas | ✅ Sim (da sua aldeia) |

### Dashboard AdminDashboard - Elementos

```
┌─────────────────────────────────────────────────────┐
│  DASHBOARD [Nome da Aldeia]                         │
├─────────────────────────────────────────────────────┤
│  [Stats Cards]                                      │
│  ├─ Total Angariado (sua aldeia)                   │
│  ├─ Participações (sua aldeia)                     │
│  ├─ Eventos Ativos (sua aldeia)                    │
│  └─ Jogos Ativos (sua aldeia)                     │
├─────────────────────────────────────────────────────┤
│  [Tabs]                                            │
│  ├─ Visão Geral ──── Eventos recentes              │
│  ├─ Analytics ────── Gráficos da aldeia           │
│  ├─ Eventos ──────── CRUD na sua aldeia           │
│  ├─ Jogos ────────── CRUD na sua aldeia           │
│  ├─ Vencedores ───── Prémios da aldeia            │
│  ├─ Verificar ────── Hash verification            │
│  └─ Utilizadores ─── Vendedores/Users da aldeia   │
│                      (SEM TAB DE ALDEIAS)          │
├─────────────────────────────────────────────────────┤
│  [Modals]                                          │
│  ├─ [SEM Criar Aldeia]                            │
│  ├─ Criar Evento                                  │
│  ├─ Criar Jogo                                    │
│  ├─ Criar Utilizador (vendedor/user)               │
│  └─ Sorteio                                       │
└─────────────────────────────────────────────────────┘
```

---

## 4. VENDEDOR - Comercial da Aldeia

### Descrição
Vendedor que regista vendas físicas/digitais e ganha comissões.

### Permissões Completas

| Categoria | Ação | Permitido |
|-----------|------|-----------|
| **Aldeias** | Criar aldeia | ❌ Não |
| **Aldeias** | Ver aldeias | ❌ Não |
| **Eventos** | Criar evento | ❌ Não |
| **Eventos** | Ver eventos | ⚠️ Apenas activos |
| **Jogos** | Criar jogo | ❌ Não |
| **Jogos** | Editar jogo | ❌ Não |
| **Jogos** | Ativar/Desativar | ❌ Não |
| **Jogos** | Executar sorteio | ❌ Não |
| **Utilizadores** | Criar utilizador | ❌ Não |
| **Utilizadores** | Editar utilizador | ❌ Não |
| **Vendas** | Registar venda | ✅ Sim |
| **Vendas** | Ver histórico vendas | ✅ Sim (as suas) |
| **Vendas** | Cancelar venda | ❌ Não |
| **Comissões** | Ver comissões | ✅ Sim (as suas) |
| **Saldo** | Ver saldo carteira | ✅ Sim |
| **Saldo** | Carregar saldo | ✅ Sim (para si) |

### Dashboard VendedorDashboard - Elementos

```
┌─────────────────────────────────────────────────────┐
│  ÁREA DO VENDEDOR                                  │
├─────────────────────────────────────────────────────┤
│  [Stats Cards]                                      │
│  ├─ Vendas Hoje                                   │
│  ├─ Vendas Totais                                 │
│  ├─ Comissão Total                                │
│  └─ Média por Venda                               │
├─────────────────────────────────────────────────────┤
│  [Tabs]                                            │
│  ├─ POS Mobile ─── Interface rápida vendas         │
│  ├─ Venda Desktop ─ Venda com dados cliente      │
│  └─ Histórico ─── Lista de vendas                │
├─────────────────────────────────────────────────────┤
│  [Funcionalidades]                                 │
│  ├─ Selecionar jogo                               │
│  ├─ Definir quantidade                           │
│  ├─ Escolher método pagamento                    │
│  ├─ Inserir dados cliente (nome obrigatório)     │
│  └─ Confirmar venda                               │
└─────────────────────────────────────────────────────┘
```

### Fluxo de Venda
1. Selecionar jogo disponível
2. Definir quantidade
3. Escolher método pagamento (MBWay/Dinheiro/Transferência)
4. Inserir nome cliente (obrigatório)
5. Inserir contacto (telefone ou email)
6. Confirmar venda

---

## 5. USER - Cliente Final

### Descrição
Utilizador comum que compra rifas/participa em jogos.

### Permissões Completas

| Categoria | Ação | Permitido |
|-----------|------|-----------|
| **Aldeias** | Ver aldeias | ✅ Sim (lista pública) |
| **Eventos** | Ver eventos | ✅ Sim (públicos) |
| **Jogos** | Ver jogos activos | ✅ Sim |
| **Jogos** | Participar/Jogar | ✅ Sim |
| **Jogos** | Comprar rifa | ✅ Sim |
| **Jogos** | Raspadinha | ✅ Sim |
| **Jogos** | Ver números seleccionados | ✅ Sim |
| **Pagamentos** | Pagar com MBWay | ✅ Sim |
| **Pagamentos** | Pagar com Saldo | ✅ Sim |
| **Pagamentos** | Pagar com Stripe | ✅ Sim |
| **Carteira** | Ver saldo | ✅ Sim |
| **Carteira** | Carregar saldo | ✅ Sim |
| **Participações** | Ver histórico | ✅ Sim (as suas) |
| **Prémios** | Ver se venceu | ✅ Sim |
| **Perfil** | Editar perfil | ✅ Sim |
| **Perfil** | Alterar password | ✅ Sim |

### Dashboard ClienteDashboard - Elementos

```
┌─────────────────────────────────────────────────────┐
│  OS MEUS JOGOS                                     │
├─────────────────────────────────────────────────────┤
│  [Header + Wallet Card]                            │
├─────────────────────────────────────────────────────┤
│  [Stats Cards]                                      │
│  ├─ Participações                                  │
│  ├─ Total Gasto                                   │
│  └─ Vitórias                                       │
├─────────────────────────────────────────────────────┤
│  [Tabs]                                            │
│  ├─ Jogar ────── Lista de jogos disponíveis       │
│  └─ Minhas ──── Histórico de participações        │
├─────────────────────────────────────────────────────┤
│  [Jogos Disponíveis]                              │
│  ├─ Card de jogo                                  │
│  ├─ Preço                                          │
│  ├─ Stock disponível                               │
│  └─ Botão "Jogar"                                 │
├─────────────────────────────────────────────────────┤
│  [Modal de Jogo]                                   │
│  ├─ Rifa: Seletor de números                      │
│  ├─ Poio da Vaca: Seletor de coordenadas         │
│  ├─ Raspadinha: Pagamento + revelação            │
│  └─ Pagamento: MBWay/Saldo/Stripe                │
└─────────────────────────────────────────────────────┘
```

---

## 6. Resumo Matriz de Permissões

| Funcionalidade | Super Admin | Aldeia Admin | Vendedor | User |
|---------------|-------------|--------------|----------|------|
| **ALDEIAS** |||||
| Criar aldeia | ✅ | ❌ | ❌ | ❌ |
| Ver todas aldeias | ✅ | ❌ | ❌ | ❌ |
| Ver sua aldeia | ✅ | ✅ | ❌ | ✅ (público) |
| Editar aldeia | ✅ | ✅ | ❌ | ❌ |
| **EVENTOS** |||||
| Criar evento | ✅ | ✅ | ❌ | ❌ |
| Ver eventos | ✅ | ✅ | ✅ | ✅ |
| Editar evento | ✅ | ✅ | ❌ | ❌ |
| Eliminar evento | ✅ | ✅ | ❌ | ❌ |
| **JOGOS** |||||
| Criar jogo | ✅ | ✅ | ❌ | ❌ |
| Ver jogos activos | ✅ | ✅ | ✅ | ✅ |
| Editar jogo | ✅ | ✅ | ❌ | ❌ |
| Ativar/Desativar | ✅ | ✅ | ❌ | ❌ |
| Executar sorteio | ✅ | ✅ | ❌ | ❌ |
| Participar em jogo | ❌ | ❌ | ❌ | ✅ |
| **UTILIZADORES** |||||
| Criar utilizador | ✅ | ✅ (vendedor/user) | ❌ | ❌ |
| Ver utilizadores | ✅ | ✅ | ❌ | ❌ |
| Editar utilizador | ✅ | ✅ | ❌ | ❌ |
| Eliminar utilizador | ✅ | ✅ | ❌ | ❌ |
| **VENDAS** |||||
| Registar venda | ❌ | ❌ | ✅ | ❌ |
| Ver histórico vendas | ✅ | ✅ | ✅ (suas) | ❌ |
| **COMISSÕES** |||||
| Ver comissões | ✅ | ✅ | ✅ (suas) | ❌ |
| Ajustar saldo | ✅ | ✅ | ❌ | ❌ |
| **VENCEDORES** |||||
| Ver vencedores | ✅ | ✅ | ❌ | ✅ (próprios) |
| Confirmar entrega | ✅ | ✅ | ❌ | ❌ |
| Converter em saldo | ✅ | ✅ | ❌ | ❌ |
| **VERIFICAR HASH** |||||
| Verificar participação | ✅ | ✅ | ❌ | ❌ |
| **BACKUP** |||||
| Exportar dados | ✅ | ❌ | ❌ | ❌ |
| **CONFIG** |||||
| Gerir planos | ✅ | ❌ | ❌ | ❌ |
| **ANALYTICS** |||||
| Ver estatísticas | ✅ | ✅ | ❌ | ❌ |

---

## 7. Diferenças Entre Dashboards

### AdminDashboard (Super Admin vs Aldeia Admin)

| Elemento | Super Admin | Aldeia Admin |
|----------|-------------|--------------|
| Tab "Aldeias" | ✅ Visível | ❌ Oculta |
| Botão "Nova Aldeia" | ✅ Visível | ❌ Oculta |
| Stats | Todas as aldeias | Apenas sua aldeia |
| Filtro de aldeia | Selector global | Fixo na sua aldeia |
| Utilizadores | Todos | Apenas da sua aldeia |

### VendedorDashboard vs ClienteDashboard

| Elemento | Vendedor | Cliente |
|----------|----------|---------|
| Stats | Vendas/comissões | Participações/ganhos |
| Tab "Jogar" | ❌ | ✅ |
| Tab "POS" | ✅ | ❌ |
| Tab "Vendas" | ✅ | ❌ |
| Tab "Histórico" | ✅ | ✅ |
| Wallet | ✅ | ✅ |

---

## 8. Fluxos de Utilizador por Role

### Super Admin
```
Login → /admindashboard
  └─→ Vista Global de todas as aldeias
      ├─ Gerir Aldeias
      ├─ Gerir Eventos
      ├─ Gerir Jogos
      ├─ Ver Analytics
      └─ Gerir Utilizadores
```

### Aldeia Admin
```
Login → /admindashboard
  └─→ Vista da sua Aldeia
      ├─ Gerir Eventos (da aldeia)
      ├─ Gerir Jogos (da aldeia)
      ├─ Ver Analytics (da aldeia)
      ├─ Gerir Vendedores
      └─ Gerir Utilizadores (da aldeia)
      (SEM opção de gerir aldeias)
```

### Vendedor
```
Login → /vendedordashboard
  └─→ Área de Vendas
      ├─ POS Mobile (vendas rápidas)
      ├─ Venda Desktop (com dados cliente)
      └─ Histórico de Vendas
```

### User (Cliente)
```
Login → /clientedashboard
  └─→ Área de Jogo
      ├─ Ver Jogos Disponíveis
      ├─ Participar em Jogos
      ├─ Ver Minhas Participações
      └─ Ver Prémios
```

---

## 9. Implementação Técnica

### Verificações de Role no Backend

```typescript
// Super Admin Only
hasRole(user.role, ['super_admin'])

// Admin (Super + Aldeia)
hasRole(user.role, ['super_admin', 'aldeia_admin'])

// Admin + Vendedor
hasRole(user.role, ['super_admin', 'aldeia_admin', 'vendedor'])

// Todos autenticados
hasRole(user.role, ['super_admin', 'aldeia_admin', 'vendedor', 'user'])
```

### Filtros por Aldeia

```typescript
// Super Admin: sem filtro (todas)
const aldeiaFilter = {};

// Aldeia Admin: filtro na sua aldeia
const aldeiaFilter = { aldeiaId: user.aldeiaId };

// Vendedor: filtro opcional para stats
const vendedorFilter = { vendedorId: user.id };

// User: filtro nas suas participações
const userFilter = { userId: user.id };
```

---

## 10. Recomendações de UI

### Mostrar/Ocultar Elementos por Role

| UI Element | Super Admin | Aldeia Admin | Vendedor | User |
|------------|-------------|--------------|----------|------|
| QuickActions Dashboard | ✅ | ✅ | ✅ | ✅ |
| Tab Aldeias | ✅ | ❌ | ❌ | ❌ |
| Botão Nova Aldeia | ✅ | ❌ | ❌ | ❌ |
| POS/Vendas | ❌ | ❌ | ✅ | ❌ |
| Participar em Jogos | ❌ | ❌ | ❌ | ✅ |
| Analytics | ✅ | ✅ | ❌ | ❌ |

### Mensagens de Erro

| Cenário | Mensagem |
|---------|----------|
| Sem permissão para criar aldeia | "Apenas o Administrador Global pode criar aldeias" |
| Sem permissão para criar jogo | "Apenas administradores podem criar jogos" |
| Acesso a dashboard errado | "Acesso negado, não tem permissão para aceder ao painel X" |
| Tentativa de editar outra aldeia | "Não tem permissão para editar esta aldeia" |
