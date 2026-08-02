import { NextResponse } from 'next/server';

export interface ScopeUser {
  id: string;
  role: string;
  aldeiaId?: string | null;
}

/**
 * Verifica se um utilizador pode aceder aos dados de uma determinada aldeia.
 * super_admin acede a qualquer aldeia; os restantes apenas à sua própria.
 */
export function canAccessAldeia(user: ScopeUser, aldeiaId?: string | null): boolean {
  if (!aldeiaId) return false;
  if (user.role === 'super_admin') return true;
  return !!user.aldeiaId && user.aldeiaId === aldeiaId;
}

/**
 * Guarda reutilizável: devolve uma resposta de erro 400/403 se o utilizador
 * não puder aceder à aldeia, ou null se tiver acesso.
 */
export function aldeiaScopeDenied(user: ScopeUser, aldeiaId?: string | null): NextResponse | null {
  if (!aldeiaId) {
    return NextResponse.json({ error: 'Aldeia não especificada' }, { status: 400 });
  }
  if (!canAccessAldeia(user, aldeiaId)) {
    return NextResponse.json({ error: 'Acesso negado a esta aldeia' }, { status: 403 });
  }
  return null;
}
