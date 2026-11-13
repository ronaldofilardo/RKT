import { prisma } from '@/lib/prisma';

/**
 * Marca avisos `ASSIGNED_TO_ANNOTATE` como lidos quando o treinador
 * designado finaliza/encerra a anotação vinculada ao cartaz.
 */
export async function markAssignedNotificationsRead(
  userId: string,
  matchId: string,
  sourceMatchId?: string | null,
): Promise<void> {
  try {
    const matchIds = [matchId, sourceMatchId].filter(Boolean) as string[];
    const assigned = await prisma.notification.findMany({
      where: {
        recipientId: userId,
        type: 'ASSIGNED_TO_ANNOTATE',
        readAt: null,
      },
    });
    const toMark = assigned.filter(
      (n) =>
        matchIds.includes((n.payload as { matchId?: string; templateId?: string })?.matchId ?? '') ||
        matchIds.includes((n.payload as { matchId?: string; templateId?: string })?.templateId ?? ''),
    );
    if (toMark.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: toMark.map((n) => n.id) } },
        data: { readAt: new Date() },
      });
    }
  } catch {
    // Não falha o encerramento da partida por erro ao desmarcar aviso.
  }
}

