import { prisma } from '@/lib/prisma';

export type CloseTemplateResult =
  | { ok: true }
  | { ok: false; status: 400 | 403 | 404; error: string; message: string };

/**
 * Encerra o cartaz no pool (soft-delete). As anotações derivadas continuam
 * existindo e seguem soberanas — apenas o template deixa de ser encontrado.
 */
export async function closePublicTemplate(
  templateId: string,
  actorUserId: string,
): Promise<CloseTemplateResult> {
  const match = await prisma.match.findFirst({
    where: { id: templateId, deletedAt: null },
    select: { createdByUserId: true, isPublicTemplate: true, ctId: true },
  });

  if (!match) {
    return { ok: false, status: 404, error: 'MATCH_NOT_FOUND', message: 'Partida não encontrada' };
  }

  if (!match.isPublicTemplate) {
    return {
      ok: false,
      status: 400,
      error: 'NOT_A_TEMPLATE',
      message: 'Esta partida não é um template público',
    };
  }

  if (match.createdByUserId !== actorUserId) {
    return {
      ok: false,
      status: 403,
      error: 'FORBIDDEN',
      message: 'Apenas o criador pode encerrar o template',
    };
  }

  await prisma.match.update({
    where: { id: templateId },
    data: { deletedAt: new Date(), deletedBy: actorUserId },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId,
      action: 'MATCH_TEMPLATE_CLOSED',
      resourceType: 'Match',
      resourceId: templateId,
      ctId: match.ctId ?? null,
    },
  });

  return { ok: true };
}
