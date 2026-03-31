# Design: Páginas de Dashboard por Role

**Data:** 2026-03-31  
**Autor:** Agent  
**Versão:** 1.0

## Sumário

Criar páginas de rota separadas para cada role do sistema, com proteção via RoleGuard component que exibe toast de "Acesso negado" e redirect.

## Roles do Sistema

1. `super_admin` → `/admindashboard`
2. `aldeia_admin` → `/admindashboard`
3. `vendedor` → `/vendedordashboard`
4. `user` → `/clientedashboard`

## Estrutura de Ficheiros

```
src/app/
├── admindashboard/
│   └── page.tsx              # RoleGuard(super_admin, aldeia_admin)
├── vendedordashboard/
│   └── page.tsx              # RoleGuard(vendedor)
├── clientedashboard/
│   └── page.tsx              # RoleGuard(user)
└── components/
    └── auth/
        └── RoleGuard.tsx      # Componente de proteção
```

## Arquitectura

### RoleGuard Component

```typescript
interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  redirectPath: string;
}
```

**Fluxo:**
1. Verifica se utilizador está autenticado (localStorage token)
2. Verifica se role está na lista `allowedRoles`
3. Se não tem permissão → toast.error("Acesso negado, não tem permissão para aceder ao painel [nome]") + redirect para `redirectPath`
4. Se tem → renderiza children

### Páginas

| Página | Roles Permitidos | Redirect se Negado |
|--------|-----------------|-------------------|
| `/admindashboard` | super_admin, aldeia_admin | `/clientedashboard` |
| `/vendedordashboard` | vendedor | `/clientedashboard` |
| `/clientedashboard` | user | `/` (home) |

## Implementação

### 1. Criar RoleGuard Component
- Verifica autenticação (token existe)
- Verifica role do utilizador
- Toast com mensagem de acesso negado
- Router.push para redirect

### 2. Criar Páginas
- `/admindashboard/page.tsx` - importa AdminDashboard com RoleGuard
- `/vendedordashboard/page.tsx` - importa VendedorDashboard com RoleGuard
- `/clientedashboard/page.tsx` - importa ClienteDashboard com RoleGuard

### 3. Atualizar Navegação
- Atualizar QuickActions para usar rotas correctas
- BottomNav com links para páginas do role

## UI/Mensagens

**Toast de Acesso Negado:**
```
"Acesso negado, não tem permissão para aceder ao painel AdminDashboard"
"Acesso negado, não tem permissão para aceder ao painel VendedorDashboard"
"Acesso negado, não tem permissão para aceder ao painel ClienteDashboard"
```

## Sem Alterações de Backend

Não são necessárias alterações na API. Os componentes existentes são reutilizados.
