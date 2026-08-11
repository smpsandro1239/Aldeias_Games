import { prisma } from '@/lib/db';
import type { EliminacaoTipo } from '@/lib/eliminacao-types';

export { ELIMINACAO_TIPOS } from '@/lib/eliminacao-types';

export async function aplicarSoftDelete(tipo: EliminacaoTipo, recursoId: string): Promise<boolean> {
  if (tipo === 'jogo') {
    const result = await prisma.jogo.updateMany({
      where: { id: recursoId },
      data: { eliminado: true, estado: 'fechado' },
    });
    return result.count > 0;
  }
  if (tipo === 'evento') {
    const result = await prisma.evento.updateMany({
      where: { id: recursoId },
      data: { eliminado: true, publico: false },
    });
    return result.count > 0;
  }
  const result = await prisma.aldeia.updateMany({
    where: { id: recursoId },
    data: { eliminado: true, ativo: false },
  });
  return result.count > 0;
}
