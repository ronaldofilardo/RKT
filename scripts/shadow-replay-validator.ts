import { PrismaClient } from '@prisma/client';
import { runShadowReplaySafely } from '../src/core/scoring/shadow-replay';
import { logger } from '../src/lib/logger';

export interface ShadowValidatorSummary {
  inspected: number;
  matched: number;
  divergentExpected: number;
  divergentUnexpected: number;
  errors: number;
}

/**
 * Validador offline do modo sombra.
 * Carrega partidas FINISHED com seus PointLogs e compara o placar canônico
 * com o placar derivado pelo replay. Risco zero em produção ou branch Neon.
 */
export async function runShadowReplayBatch(prismaClient?: PrismaClient): Promise<ShadowValidatorSummary> {
  const prisma = prismaClient ?? new PrismaClient();
  const summary: ShadowValidatorSummary = {
    inspected: 0,
    matched: 0,
    divergentExpected: 0,
    divergentUnexpected: 0,
    errors: 0,
  };

  try {
    const matches = await prisma.match.findMany({
      where: {
        state: 'FINISHED',
        scoreState: { not: null as any },
      },
      select: {
        id: true,
        format: true,
        player1Id: true,
        player2Id: true,
        initialServerId: true,
        scoreState: true,
        pointLogs: {
          where: { voidedAt: null },
          orderBy: { sequenceNumber: 'asc' },
          select: {
            id: true,
            winnerId: true,
            type: true,
            serverId: true,
            annotations: true,
            sequenceNumber: true,
            createdAt: true,
          },
        },
      },
    });

    summary.inspected = matches.length;

    for (const m of matches) {
      try {
        const rawScoreState = m.scoreState as any;
        const canonical = (rawScoreState?.state ?? rawScoreState) as any;
        if (!canonical || !Array.isArray(canonical.sets)) continue;

        const config = {
          format: m.format as any,
          player1Id: m.player1Id,
          player2Id: m.player2Id,
          initialServerId: m.initialServerId ?? m.player1Id,
        };

        const mappedLogs = m.pointLogs.map((log) => ({
          id: log.id,
          winnerId: log.winnerId,
          type: log.type as any,
          serverId: log.serverId,
          annotations: log.annotations,
          sequenceNumber: log.sequenceNumber ?? 0,
          timestamp: log.createdAt,
        }));

        const result = runShadowReplaySafely({
          matchId: m.id,
          config,
          canonicalState: canonical,
          pointLogs: mappedLogs as any,
        });

        if (result?.matches) {
          summary.matched++;
        } else if (result?.expectedDivergenceReason) {
          summary.divergentExpected++;
        } else {
          summary.divergentUnexpected++;
        }
      } catch (err) {
        summary.errors++;
        logger.error(`[runShadowReplayBatch] Erro ao validar partida ${m.id}:`, err);
      }
    }
  } finally {
    if (!prismaClient) {
      await prisma.$disconnect();
    }
  }

  return summary;
}

if (require.main === module) {
  runShadowReplayBatch()
    .then((res) => {
      console.log('Validação de modo sombra concluída:', res);
      process.exit(res.divergentUnexpected === 0 ? 0 : 1);
    })
    .catch((err) => {
      console.error('Falha na execução do validador de sombra:', err);
      process.exit(1);
    });
}
