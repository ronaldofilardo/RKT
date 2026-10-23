import { prisma } from "@/lib/prisma";

export async function deleteMatch(
  id: string,
  options: { type: 'soft' | 'hard'; reason?: string; deletedBy?: string },
) {
  const match = await prisma.match.findFirst({
    where: { id },
    include: {
      pointLog: { select: { id: true } },
      annotationSessions: { select: { id: true } },
    },
  });

  if (!match) return { error: 'MATCH_NOT_FOUND' } as const;

  if (match.state === 'FINISHED') {
    return {
      error: 'CANNOT_DELETE_FINISHED: Partidas finalizadas não podem ser excluídas permanentemente',
    } as const;
  }

  if (options.type === 'hard') {
    await prisma.$transaction([
      prisma.pointLog.deleteMany({ where: { matchId: id } }),
      prisma.matchAnnotationSession.deleteMany({ where: { matchId: id } }),
      prisma.match.delete({ where: { id } }),
    ]);
    return {
      success: true,
      type: 'hard',
      stats: { points: match.pointLog.length, annotationSessions: match.annotationSessions.length },
    } as const;
  }

  const updateData: Record<string, unknown> = { state: 'CANCELLED', deletedAt: new Date() };
  if (options.deletedBy) updateData.deletedBy = options.deletedBy;
  if (options.reason) updateData.finishNote = options.reason;

  await prisma.match.update({ where: { id }, data: updateData });

  return {
    success: true,
    type: 'soft',
    stats: { points: match.pointLog.length, annotationSessions: match.annotationSessions.length },
  } as const;
}
