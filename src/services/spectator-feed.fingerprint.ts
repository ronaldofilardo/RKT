import { prisma } from '@/lib/prisma';

export interface FeedAggregation {
  match: { id: string; state: string; version: number; updatedAt: Date } | null;
  pointCount: number;
  maxSeq: number;
  maxPtUpdMs: number;
  lastReceivedAt: Date | null;
  lastHeartbeatAt: Date | null;
  annotatorName: string | null;
  hasActiveSession: boolean;
  scoreEditCount: number;
}

/**
 * Passo 0 de pré-checagem barata: lê apenas escalares agregados no Postgres (< 150 bytes).
 * Protege contra estouro da cota de 5 GB de egress do Neon.
 */
export async function getFeedAggregation(matchId: string): Promise<FeedAggregation | null> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, state: true, version: true, updatedAt: true },
  });
  if (!match) return null;

  const [ptAgg, activeSession, scoreEditCount] = await Promise.all([
    prisma.pointLog.aggregate({
      where: { matchId, voidedAt: null },
      _count: { id: true },
      _max: { sequenceNumber: true, updatedAt: true, receivedAt: true },
    }),
    prisma.matchAnnotationSession.findFirst({
      where: { matchId, isActive: true },
      orderBy: { startedAt: 'desc' },
      select: { lastHeartbeatAt: true, annotator: { select: { name: true } } },
    }),
    prisma.matchScoreEdit.count({ where: { matchId } }),
  ]);

  const maxPtUpd = ptAgg._max.updatedAt ? new Date(ptAgg._max.updatedAt).getTime() : 0;
  const lastHeartbeatAt = activeSession?.lastHeartbeatAt ?? null;

  return {
    match,
    pointCount: ptAgg._count.id,
    maxSeq: ptAgg._max.sequenceNumber ?? 0,
    maxPtUpdMs: maxPtUpd,
    lastReceivedAt: ptAgg._max.receivedAt ?? null,
    lastHeartbeatAt,
    annotatorName: activeSession?.annotator?.name ?? null,
    hasActiveSession: Boolean(activeSession),
    scoreEditCount,
  };
}

export function computeFeedFingerprint(agg: FeedAggregation): string {
  const matchUpdMs = new Date(agg.match!.updatedAt).getTime();
  const hbMs = agg.lastHeartbeatAt ? new Date(agg.lastHeartbeatAt).getTime() : 0;
  return `${agg.match!.version}_${agg.match!.state}_${agg.pointCount}_${agg.maxSeq}_${agg.maxPtUpdMs}_${matchUpdMs}_${agg.scoreEditCount}_${hbMs}`;
}

