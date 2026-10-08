import { PrismaClient } from '@prisma/client';
import { normalizeScoreState } from '../src/core/scoring/score-normalizer';
import { logger } from '../src/lib/logger';

export interface BackfillSummary {
  inspected: number;
  updated: number;
  errors: number;
}

/**
 * Backfill seguro e idempotente que garante que sets 7-6 ou 6-7 tenham
 * tiebreakScore persistido diretamente no `scoreState` da partida.
 * Isso desacopla o score-normalizer da dependência futura de `history`.
 */
export async function backfillTiebreakScores(prismaClient?: PrismaClient): Promise<BackfillSummary> {
  const prisma = prismaClient ?? new PrismaClient();
  const summary: BackfillSummary = { inspected: 0, updated: 0, errors: 0 };

  try {
    const matches = await prisma.match.findMany({
      where: {
        scoreState: { not: null as any },
      },
      select: {
        id: true,
        format: true,
        scoreState: true,
      },
    });

    summary.inspected = matches.length;

    for (const m of matches) {
      try {
        if (!m.scoreState || typeof m.scoreState !== 'object') continue;
        const raw = JSON.parse(JSON.stringify(m.scoreState));

        const normalized = normalizeScoreState(raw, m.format as any);
        if (!normalized || !Array.isArray(normalized.sets)) continue;

        let needsUpdate = false;
        const originalSets = (m.scoreState as any).state?.sets ?? (m.scoreState as any).sets;

        if (Array.isArray(originalSets)) {
          for (let i = 0; i < originalSets.length; i++) {
            const originalSet = originalSets[i];
            const normalizedSet = normalized.sets[i];
            if (
              normalizedSet?.tiebreakScore &&
              (!originalSet.tiebreakScore || originalSet.tiebreakScore == null)
            ) {
              needsUpdate = true;
              break;
            }
          }
        }

        if (needsUpdate) {
          const newScoreState = (raw as any).state
            ? { ...(raw as any), state: { ...(raw as any).state, sets: normalized.sets } }
            : { ...(raw as any), sets: normalized.sets };

          await prisma.match.update({
            where: { id: m.id },
            data: { scoreState: newScoreState },
          });
          summary.updated++;
        }
      } catch (err) {
        summary.errors++;
        logger.error(`[backfillTiebreakScores] Erro na partida ${m.id}:`, err);
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
  backfillTiebreakScores()
    .then((res) => {
      console.log('Backfill concluído com sucesso:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Falha no backfill:', err);
      process.exit(1);
    });
}
