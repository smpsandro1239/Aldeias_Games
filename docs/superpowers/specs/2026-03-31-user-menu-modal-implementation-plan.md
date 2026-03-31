# Implementation Plan: User Menu Modal & Bottom Navigation

**Data:** 2026-03-31  
**Projeto:** Aldeias Games - Standardização User Menu

---

## Objetivo
Padronizar o user menu (editar perfil, logout) em todas as páginas da aplicação, baseando-se no exemplo de `/jogos`.

---

## Ficheiros Criados/Modificados

### Novos Componentes

| Ficheiro | Descrição |
|----------|-----------|
| `src/components/user-menu-modal.tsx` | Modal de menu do utilizador reutilizável |
| `src/components/app-header.tsx` | Header com user menu (opcional) |

### Páginas Atualizadas

| Página | Estado | Notas |
|-------|--------|-------|
| `/jogos/page.tsx` | ✅ Atualizado | Usa UserMenuModal |
| `/perfil/page.tsx` | ✅ Atualizado | Usa UserMenuModal |
| `/premios/page.tsx` | ✅ Já tinha | user menu inline |
| `/configuracoes/page.tsx` | ✅ Já tinha | UserMenuButton |
| `/aldeia/[slug]/page.tsx` | ✅ Já tinha | user menu inline |

---

## Componente: UserMenuModal

### API

```tsx
interface UserMenuModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saldo?: number;
}
```

### Funcionalidades
- Mostrar nome e email do utilizador
- Mostrar saldo (buscado da API ou passado como prop)
- Botão "Editar Perfil" → `/perfil`
- Botão "Configurações" (apenas admin) → `/configuracoes`
- Botão "Terminar Sessão" → logout + redirect para `/`

---

## Componente: UserButton

### API

```tsx
interface UserButtonProps {
  onClick: () => void;
}
```

Botão circular para usar no header que abre o UserMenuModal.

---

## Implementação em Páginas

### Padrão básico:

```tsx
import { UserMenuModal } from "@/components/user-menu-modal";
import { User } from "lucide-react";

// No componente:
const [userMenuOpen, setUserMenuOpen] = useState(false);

// No header:
<button 
  onClick={() => setUserMenuOpen(true)}
  className="..."
>
  <User className="h-4 w-4 text-[#ff734b]" />
</button>

// Antes do BottomNav:
<UserMenuModal open={userMenuOpen} onOpenChange={setUserMenuOpen} />
```

---

## Tarefas Concluídas

- [x] Criar UserMenuModal component
- [x] Criar UserButton component
- [x] Atualizar jogos/page.tsx
- [x] Atualizar perfil/page.tsx
- [x] Verificar premios/page.tsx
- [x] Verificar configuracoes/page.tsx
- [x] Verificar aldeia/[slug]/page.tsx
- [x] TypeScript check passar

---

## Próximos Passos

- [ ] Atualizar outras páginas se necessário
- [ ] Buscar saldo real da API no UserMenuModal
- [ ] Adicionar animação de transição no modal
