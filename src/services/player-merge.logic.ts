import { prisma } from '@/lib/prisma';

export async function mergePlayers({
  sourceId,
  targetId,
  actorUserId,
}: {
  sourceId: string;
  targetId: string;
  actorUserId: string;
}) {
  if (sourceId === targetId) {
    throw new Error('SAME_PLAYER');
  }

  const source = await prisma.player.findUnique({ where: { id: sourceId } });
  const target = await prisma.player.findUnique({ where: { id: targetId } });
  if (!source || !target) {
    throw new Error('PLAYER_NOT_FOUND');
  }
  if (source.mergedIntoId) {
    throw new Error('ALREADY_MERGED');
  }

  await prisma.$transaction([
    // Reatribui partidas onde source participa para target
    prisma.match.updateMany({
      where: { player1Id: sourceId },
      data: { player1Id: targetId },
    }),
    prisma.match.updateMany({
      where: { player2Id: sourceId },
      data: { player2Id: targetId },
    }),
    prisma.match.updateMany({
      where: { player1PartnerId: sourceId },
      data: { player1PartnerId: targetId },
    }),
    prisma.match.updateMany({
      where: { player2PartnerId: sourceId },
      data: { player2PartnerId: targetId },
    }),
    // Reatribui vínculos PlayerCT de source para target (quando target não tem vínculo no mesmo CT)
    prisma.playerCT.updateMany({
      where: { playerId: sourceId },
      data: { playerId: targetId },
    }),
    // Marca source como mesclado em target
    prisma.player.update({
      where: { id: sourceId },
      data: { mergedIntoId: targetId },
    }),
    // Auditoria
    prisma.auditLog.create({
      data: {
        actorUserId: actorUserId,
        action: 'player:merge',
        resourceType: 'Player',
        resourceId: targetId,
        meta: { sourceId, targetId, sourceName: source.name, targetName: target.name },
      },
    }),
  ]);

  return { sourceId, targetId, mergedIntoId: targetId };
}
