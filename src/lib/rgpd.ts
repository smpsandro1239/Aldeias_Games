import type { PrismaClient } from "@prisma/client";

export const ANONIMIZACAO_DIAS = 365;
export const PURGA_WEBHOOK_DIAS = 365;
export const PURGA_NOTIFICACOES_DIAS = 180;

/**
 * RGPD: anonimiza dados pessoais de clientes em participações com mais de
 * `dias` dias. Nome, telefone e email são substituídos por marcadores
 * pseudo-anónimos e o resultado é registado em AuditLog.
 *
 * Critério de seleção: participações cujo `createdAt <= cutoff` e que ainda
 * tenham dados de cliente por anonimizar.
 */
export async function anonymizeParticipacoes(
  prisma: PrismaClient,
  dias: number = ANONIMIZACAO_DIAS
): Promise<{ anonimizadas: number; alvos: number }> {
  const cutoff = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

  const targets = await prisma.participacao.findMany({
    where: {
      createdAt: { lte: cutoff },
      OR: [
        { nomeCliente: { not: null } },
        { telefoneCliente: { not: null } },
        { emailCliente: { not: null } },
      ],
    },
    select: {
      id: true,
      jogo: { select: { aldeiaId: true } },
    },
  });

  if (targets.length === 0) {
    return { anonimizadas: 0, alvos: 0 };
  }

  const result = await prisma.participacao.updateMany({
    where: { id: { in: targets.map((t) => t.id) } },
    data: {
      nomeCliente: null,
      telefoneCliente: null,
      emailCliente: null,
    },
  });

  for (const t of targets) {
    await prisma.auditLog.create({
      data: {
        userId: null,
        aldeiaId: t.jogo?.aldeiaId ?? undefined,
        action: "RGPD_ANONIMIZACAO",
        resource: "Participacao",
        resourceId: t.id,
        metadata: { dias },
      },
    });
  }

  return { anonimizadas: result.count, alvos: targets.length };
}

/**
 * RGPD: purga dados anónimos e registos operacionais para além do período de
 * retenção. Remove:
 *  - WebhookEvent com status "completed" mais antigos que `webhookDias`
 *  - Notificacoes lidas mais antigas que `notifDias`
 */
export async function purgeOldData(
  prisma: PrismaClient,
  webhookDias: number = PURGA_WEBHOOK_DIAS,
  notifDias: number = PURGA_NOTIFICACOES_DIAS
): Promise<{ webhooks: number; notificacoes: number }> {
  const webhookCutoff = new Date(Date.now() - webhookDias * 24 * 60 * 60 * 1000);
  const notifCutoff = new Date(Date.now() - notifDias * 24 * 60 * 60 * 1000);

  const [webhooks, notificacoes] = await Promise.all([
    prisma.webhookEvent.deleteMany({
      where: { createdAt: { lte: webhookCutoff }, status: "completed" },
    }),
    prisma.notificacao.deleteMany({
      where: { createdAt: { lte: notifCutoff }, lida: true },
    }),
  ]);

  await prisma.auditLog.create({
    data: {
      userId: null,
      action: "RGPD_PURGA",
      resource: "Sistema",
      metadata: { webhooks: webhooks.count, notificacoes: notificacoes.count },
    },
  });

  return { webhooks: webhooks.count, notificacoes: notificacoes.count };
}