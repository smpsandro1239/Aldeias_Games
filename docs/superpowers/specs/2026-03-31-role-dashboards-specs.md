# Especificações Finais: Sistema de Dashboards por Role

**Data:** 2026-03-31  
**Versão:** 1.0  
**Status:** Implementado

---

## Resumo Executivo

Este documento descreve a implementação do sistema de dashboards baseados em roles, com páginas dedicadas para cada tipo de utilizador e controlos de acesso granulares.

---

## 1. Roles e Dashboards

| Role | Dashboard | URL |
|------|-----------|-----|
| super_admin | SuperAdminDashboard | `/superadmindashboard` |
| aldeia_admin | AdminDashboard | `/admindashboard` |
| vendedor | VendedorDashboard | `/vendedordashboard` |
| user | ClienteDashboard | `/clientedashboard` |

---

## 2. Componente RoleGuard

### Localização
`src/components/auth/RoleGuard.tsx`

### Funcionalidade
- Verifica autenticação (token existe)
- Verifica role do utilizador contra lista de roles permitidos
- Mostra toast de "Acesso negado" se não autorizado
- Redirecciona para página do role do utilizador

### Props
```typescript
interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  redirectPath: string;
  panelName: string;
}
```

### Mensagens de Erro
| Dashboard | Mensagem |
|-----------|----------|
| AdminDashboard | "Acesso negado, não tem permissão para aceder ao painel AdminDashboard" |
| VendedorDashboard | "Acesso negado, não tem permissão para aceder ao painel VendedorDashboard" |
| ClienteDashboard | "Acesso negado, não tem permissão para aceder ao painel ClienteDashboard" |

---

## 3. AdminDashboard (`/admindashboard`)

### Funcionalidades por Role

#### Super Admin
| Funcionalidade | Visível |
|---------------|---------|
| Tab "Aldeias" | ✅ |
| Botão "Nova Aldeia" | ✅ |
| Ver todas as aldeias | ✅ |
| Ver todos os eventos | ✅ |
| Ver todos os jogos | ✅ |
| Ver todos os utilizadores | ✅ |
| Analytics global | ✅ |
| Exportar backup | ✅ |

#### Aldeia Admin
| Funcionalidade | Visível |
|---------------|---------|
| Tab "Aldeias" | ❌ |
| Botão "Nova Aldeia" | ❌ |
| Ver apenas sua aldeia | ✅ |
| Ver apenas eventos da sua aldeia | ✅ |
| Ver apenas jogos da sua aldeia | ✅ |
| Ver apenas utilizadores da sua aldeia | ✅ |
| Analytics da aldeia | ✅ |
| Exportar backup | ❌ |

### Tabs Disponíveis

| Tab | Super Admin | Aldeia Admin |
|-----|-------------|--------------|
| Visão Geral | ✅ | ✅ |
| Analytics | ✅ | ✅ |
| Eventos | ✅ | ✅ |
| Jogos | ✅ | ✅ |
| Vencedores | ✅ | ✅ |
| Verificar | ✅ | ✅ |
| Utilizadores | ✅ | ✅ |
| Aldeias | ✅ | ❌ |

### Modais por Role

| Modal | Super Admin | Aldeia Admin |
|-------|-------------|--------------|
| Criar Aldeia | ✅ | ❌ |
| Criar Evento | ✅ | ✅ |
| Criar Jogo | ✅ | ✅ |
| Criar Utilizador | ✅ | ✅ (vendedor/user) |

---

## 4. VendedorDashboard (`/vendedordashboard`)

### Funcionalidades
| Funcionalidade | Estado |
|---------------|--------|
| Ver stats (vendas hoje, total, comissão) | ✅ |
| POS Mobile (vendas rápidas) | ✅ |
| Venda Desktop (com dados cliente) | ✅ |
| Histórico de vendas | ✅ |
| Selecionar jogo | ✅ |
| Definir quantidade | ✅ |
| Escolher método pagamento | ✅ |
| Inserir dados cliente | ✅ |

### Métodos de Pagamento
- Dinheiro
- MBWay
- Transferência

### Restrições
- Apenas vê as suas próprias vendas
- Não pode criar/utilizadores
- Não pode criar/editar jogos

---

## 5. ClienteDashboard (`/clientedashboard`)

### Funcionalidades
| Funcionalidade | Estado |
|---------------|--------|
| Ver wallet/saldo | ✅ |
| Ver jogos disponíveis | ✅ |
| Participar em jogos | ✅ |
| Ver histórico de participações | ✅ |
| Raspadinha (comprar e revelar) | ✅ |
| Rifas (seleccionar números) | ✅ |
| Poio da Vaca (seleccionar coordenadas) | ✅ |

### Modais de Jogo
| Tipo de Jogo | Modal |
|-------------|--------|
| Raspadinha | PaymentModal + ScratchCardModal |
| Rifa | NumberSelectorModal + PaymentModal |
| Tombola | NumberSelectorModal + PaymentModal |
| Poio da Vaca | PoioDaVacaModal + PaymentModal |

### Métodos de Pagamento
- MBWay
- Saldo carteira
- Stripe

---

## 6. Navegação

### BottomNav - URLs por Role

| Role | Item 1 | Item 2 | Item 3 | Item 4 |
|------|--------|--------|--------|--------|
| super_admin | Dashboard | Aldeias | Analytics | Config |
| aldeia_admin | Dashboard | Eventos | Jogos | Equipa |
| vendedor | Dashboard | Vendas | Histórico | Perfil |
| user | Dashboard | Jogos | Histórico | Perfil |

### QuickActions - URLs por Role

| Role | Acção 1 | Acção 2 | Acção 3 | Acção 4 |
|------|---------|---------|---------|---------|
| super_admin | Dashboard | Criar Aldeia | Ver Aldeias | Config |
| aldeia_admin | Dashboard | Criar Evento | Criar Jogo | Vencedores |
| vendedor | Dashboard | Nova Venda | Histórico | Metas |
| user | Dashboard | Ver Jogos | Participações | Perfil |

---

## 7. Estrutura de Ficheiros

```
src/
├── app/
│   ├── superadmindashboard/
│   │   └── page.tsx              # SuperAdminDashboard com RoleGuard (super_admin)
│   ├── admindashboard/
│   │   └── page.tsx              # AdminDashboard com RoleGuard (aldeia_admin)
│   ├── vendedordashboard/
│   │   └── page.tsx              # VendedorDashboard com RoleGuard (vendedor)
│   ├── clientedashboard/
│   │   └── page.tsx              # ClienteDashboard com RoleGuard (user)
│   └── page.tsx                  # Página principal (landing)
├── components/
│   ├── auth/
│   │   └── RoleGuard.tsx         # Componente de protecção
│   ├── bottom-nav.tsx            # Navegação mobile
│   └── quick-actions.tsx         # Ações rápidas
└── features/
    ├── admin/
    │   ├── admin-dashboard.tsx   # Dashboard admin (compartilhado)
    │   └── analytics-dashboard.tsx
    ├── vendedor/
    │   ├── vendedor-dashboard.tsx
    │   └── pos-view.tsx
    └── cliente/
        └── cliente-dashboard.tsx
```

---

## 8. Controlo de Acesso no Backend

### Verificações por Role

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

### Filtros de Aldeia

| Role | Filtro |
|------|--------|
| super_admin | Sem filtro (todas) |
| aldeia_admin | `{ aldeiaId: user.aldeiaId }` |
| vendedor | Sem filtro aldeia (vendas próprias) |
| user | Sem filtro (participações próprias) |

---

## 9. Alterações Implementadas

### Ficheiros Criados
- `src/components/auth/RoleGuard.tsx`
- `src/app/superadmindashboard/page.tsx` - Super Admin Dashboard
- `src/app/admindashboard/page.tsx` - Aldeia Admin Dashboard
- `src/app/vendedordashboard/page.tsx`
- `src/app/clientedashboard/page.tsx`

### Ficheiros Modificados
- `src/components/bottom-nav.tsx` - URLs actualizadas
- `src/components/quick-actions.tsx` - Navegação por router
- `src/features/admin/admin-dashboard.tsx` - Role checking
- `src/components/modals/user-modal.tsx` - Restrições aldeia_admin

---

## 10. Fluxos de Acesso

### Acesso Não Autorizado
1. Utilizador tenta acceder a página sem role
2. RoleGuard verifica token e role
3. Toast.error() com mensagem de acesso negado
4. router.push() para página do role

### Login → Redireccionamento
| Role | Dashboard |
|------|-----------|
| super_admin | → `/superadmindashboard` |
| aldeia_admin | → `/admindashboard` |
| vendedor | → `/vendedordashboard` |
| user | → `/clientedashboard` |

---

## 11. Testes Recomendados

### Cenários a Testar

1. **Super Admin**
   - [ ] Acede a `/superadmindashboard` ✅
   - [ ] Vê tab "Aldeias" ✅
   - [ ] Pode criar aldeia ✅
   - [ ] Vê todas as aldeias ✅
   - [ ] Bloqueado em `/admindashboard` ✅
   - [ ] Bloqueado em `/vendedordashboard` ✅
   - [ ] Bloqueado em `/clientedashboard` ✅

2. **Aldeia Admin**
   - [ ] Acede a `/admindashboard` ✅
   - [ ] NÃO vê tab "Aldeias" ✅
   - [ ] NÃO vê botão "Nova Aldeia" ✅
   - [ ] Vê apenas dados da sua aldeia ✅
   - [ ] Pode criar vendedores ✅
   - [ ] NÃO pode criar aldeia_admin ✅
   - [ ] Bloqueado em `/superadmindashboard` ✅
   - [ ] Bloqueado em `/vendedordashboard` ✅
   - [ ] Bloqueado em `/clientedashboard` ✅

3. **Vendedor**
   - [ ] Acede a `/vendedordashboard` ✅
   - [ ] Vê stats de vendas ✅
   - [ ] Pode registar venda ✅
   - [ ] NÃO vê tab admin ✅
   - [ ] Bloqueado em `/admindashboard` ✅
   - [ ] Bloqueado em `/superadmindashboard` ✅
   - [ ] Pode acceder a `/clientedashboard` ✅

4. **User**
   - [ ] Acede a `/clientedashboard` ✅
   - [ ] Vê jogos disponíveis ✅
   - [ ] Pode participar em jogos ✅
   - [ ] NÃO vê tabs admin ✅
   - [ ] Bloqueado em `/admindashboard` ✅
   - [ ] Bloqueado em `/superadmindashboard` ✅
   - [ ] Bloqueado em `/vendedordashboard` ✅

---

## 12. Notas de Implementação

### Segurança
- Todos os dashboards verificam role no cliente (RoleGuard)
- Backend também verifica permissões em cada API
- Não confiar apenas na verificação client-side

### UX
- Toast informativo ao tentar acceder sem permissão
- Redirect automático para dashboard correcto
- Loading state durante verificação de role

### Performance
- Dashboards carregados com dynamic imports (ssr: false)
- Lazy loading de componentes pesados
