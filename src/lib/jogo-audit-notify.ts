import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { escapeHtml } from '@/lib/utils';
import { ELIMINACAO_LABELS } from '@/lib/eliminacao-types';
import type { EliminacaoTipo } from '@/lib/eliminacao-types';

interface Recipient {
  id: string;
  email: string;
  nome: string;
}

async function getAldeiaAdmins(aldeiaId: string, excludeUserId?: string): Promise<Recipient[]> {
  const aldeia = await prisma.aldeia.findUnique({
    where: { id: aldeiaId },
    include: {
      admins: { select: { id: true, email: true, nome: true } },
    },
  });
  if (!aldeia) return [];
  return aldeia.admins.filter((a) => a.id !== excludeUserId);
}

async function getSuperAdmins(excludeUserId?: string): Promise<Recipient[]> {
  const supers = await prisma.user.findMany({
    where: { role: 'super_admin' },
    select: { id: true, email: true, nome: true },
  });
  return supers.filter((s) => s.id !== excludeUserId);
}

async function notifyUser(userId: string, tipo: string, titulo: string, mensagem: string) {
  try {
    await prisma.notificacao.create({
      data: { userId, tipo: tipo as any, titulo, mensagem, lida: false },
    });
  } catch (e) {
    console.error('[jogo-audit-notify] Erro notificação in-app:', e);
  }
}

async function emailUsers(users: Recipient[], subject: string, html: string) {
  await Promise.all(
    users.map(async (u) => {
      if (!u.email) return;
      await sendEmail({ to: u.email, subject, html });
    })
  );
}

const emailShell = (titulo: string, corpo: string) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #b91c1c;">${titulo}</h2>
    ${corpo}
    <p style="color: #666; font-size: 14px; margin-top: 24px;">
      Com os melhores cumprimentos,<br/>A equipa Aldeias Games
    </p>
  </div>
`;

// ============ Pedido de eliminação criado ============
export async function notifyEliminacaoSolicitada(params: {
  tipo: EliminacaoTipo;
  recursoNome: string;
  aldeiaNome?: string;
  aldeiaId?: string;
  solicitanteNome: string;
  motivo: string;
  autoAprovado?: boolean;
}) {
  const { tipo, recursoNome, aldeiaId, aldeiaNome, solicitanteNome, motivo, autoAprovado } = params;
  const label = ELIMINACAO_LABELS[tipo];
  const titulo = autoAprovado
    ? `Eliminação de ${label} aprovada automaticamente`
    : `Pedido de eliminação de ${label}`;
  const mensagem = autoAprovado
    ? `O super administrador eliminou o ${label} "${recursoNome}"${aldeiaNome ? ` da aldeia "${aldeiaNome}"` : ''}.`
    : `${solicitanteNome} solicitou a eliminação do ${label} "${recursoNome}"${aldeiaNome ? ` (aldeia "${aldeiaNome}")` : ''}. Motivo: ${motivo}. Aguarda aprovação de um outro administrador.`;

  const targets: Recipient[] = [];
  if (aldeiaId) targets.push(...(await getAldeiaAdmins(aldeiaId)));
  if (!autoAprovado) targets.push(...(await getSuperAdmins()));

  const subject = `${titulo}: ${recursoNome}`;
  const html = emailShell(titulo, `<p style="font-size: 16px;">${escapeHtml(mensagem)}</p>`);

  await Promise.all([
    ...targets.map((t) => notifyUser(t.id, autoAprovado ? 'eliminacao_aprovado' : 'eliminacao_criado', titulo, mensagem)),
    emailUsers(targets, subject, html),
  ]);
}

// ============ Pedido aprovado ============
export async function notifyEliminacaoAprovada(params: {
  tipo: EliminacaoTipo;
  recursoNome: string;
  aldeiaNome?: string;
  aldeiaId?: string;
  aprovadorNome: string;
  solicitanteId: string;
}) {
  const { tipo, recursoNome, aldeiaId, aldeiaNome, aprovadorNome, solicitanteId } = params;
  const label = ELIMINACAO_LABELS[tipo];
  const titulo = `Eliminação de ${label} aprovada`;
  const mensagem = `${aprovadorNome} aprovou a eliminação do ${label} "${recursoNome}"${aldeiaNome ? ` da aldeia "${aldeiaNome}"` : ''}. O ${label} foi arquivado.`;

  const targets: Recipient[] = [];
  if (aldeiaId) targets.push(...(await getAldeiaAdmins(aldeiaId)));
  if (solicitanteId) {
    const solicitante = await prisma.user.findUnique({
      where: { id: solicitanteId },
      select: { id: true, email: true, nome: true },
    });
    if (solicitante) targets.push(solicitante as Recipient);
  }

  const subject = `${titulo}: ${recursoNome}`;
  const html = emailShell(titulo, `<p style="font-size: 16px;">${escapeHtml(mensagem)}</p>`);

  await Promise.all([
    ...targets.map((t) => notifyUser(t.id, 'eliminacao_aprovado', titulo, mensagem)),
    emailUsers(targets, subject, html),
  ]);
}

// ============ Pedido rejeitado ============
export async function notifyEliminacaoRejeitada(params: {
  tipo: EliminacaoTipo;
  recursoNome: string;
  aldeiaNome?: string;
  rejeitadorNome: string;
  solicitanteId: string;
  observacoes?: string;
}) {
  const { tipo, recursoNome, aldeiaNome, rejeitadorNome, solicitanteId, observacoes } = params;
  const label = ELIMINACAO_LABELS[tipo];
  const titulo = `Eliminação de ${label} rejeitada`;
  const mensagem = `${rejeitadorNome} rejeitou o pedido de eliminação do ${label} "${recursoNome}"${aldeiaNome ? ` da aldeia "${aldeiaNome}"` : ''}.${observacoes ? ` Motivo da rejeição: ${observacoes}.` : ''}`;

  const solicitante = await prisma.user.findUnique({
    where: { id: solicitanteId },
    select: { id: true, email: true, nome: true },
  });
  if (!solicitante) return;

  const subject = `${titulo}: ${recursoNome}`;
  const html = emailShell(titulo, `<p style="font-size: 16px;">${escapeHtml(mensagem)}</p>`);

  await Promise.all([
    notifyUser(solicitante.id, 'eliminacao_rejeitado', titulo, mensagem),
    emailUsers([solicitante as Recipient], subject, html),
  ]);
}

// ============ Jogo editado ============
export async function notifyJogoEditado(params: {
  jogoNome: string;
  aldeiaId?: string;
  autorNome: string;
  campos: string[];
}) {
  const { jogoNome, aldeiaId, autorNome, campos } = params;
  const aldeia = aldeiaId
    ? await prisma.aldeia.findUnique({ where: { id: aldeiaId }, select: { nome: true } })
    : null;
  const aldeiaNome = aldeia?.nome;
  const titulo = 'Jogo editado';
  const mensagem = `${autorNome} editou o jogo "${jogoNome}"${aldeiaNome ? ` da aldeia "${aldeiaNome}"` : ''}. Campos alterados: ${campos.join(', ')}.`;

  const targets = aldeiaId ? await getAldeiaAdmins(aldeiaId) : [];
  if (!targets.length) return;

  const subject = `${titulo}: ${jogoNome}`;
  const html = emailShell(titulo, `<p style="font-size: 16px;">${escapeHtml(mensagem)}</p>`);

  await Promise.all([
    ...targets.map((t) => notifyUser(t.id, 'jogo_editado', titulo, mensagem)),
    emailUsers(targets, subject, html),
  ]);
}

// ============ Pool de raspadinha redefinido ============
// Avisa os admins da aldeia quando os prémios de uma raspadinha são alterados
// e o pool de prémios é regenerado (os prémios por sortear foram repostos).
export async function notifyPoolRedefinido(params: {
  jogoNome: string;
  aldeiaId?: string;
  autorNome: string;
}) {
  const { jogoNome, aldeiaId, autorNome } = params;
  const aldeia = aldeiaId
    ? await prisma.aldeia.findUnique({ where: { id: aldeiaId }, select: { nome: true } })
    : null;
  const aldeiaNome = aldeia?.nome;
  const titulo = 'Pool de prémios redefinido';
  const mensagem = `${autorNome} alterou os prémios da raspadinha "${jogoNome}"${aldeiaNome ? ` da aldeia "${aldeiaNome}"` : ''}. O pool de prémios foi regenerado — os prémios por sortear foram repostos.`;

  const targets = aldeiaId ? await getAldeiaAdmins(aldeiaId) : [];
  if (!targets.length) return;

  const subject = `${titulo}: ${jogoNome}`;
  const html = emailShell(titulo, `<p style="font-size: 16px;">${escapeHtml(mensagem)}</p>`);

  await Promise.all([
    ...targets.map((t) => notifyUser(t.id, 'jogo_editado', titulo, mensagem)),
    emailUsers(targets, subject, html),
  ]);
}
