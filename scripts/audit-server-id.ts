import { PrismaClient } from '@prisma/client';
import { ScoringEngine } from '../src/core/scoring/engine';
import type { ScoringEngineConfig } from '../src/core/scoring/types';

export interface AuditSummary {
  inspected: number;
  tb10Matches: number;
  matchesWithDivergentServer: number;
  totalPointsChecked: number;
  divergentPoints: number;
  details: Array<{
    matchId: string;
    format: string;
    totalPoints: number;
    divergentPointsCount: number;
  }>;
}

/**
 * Script de auditoria somente-leitura para detectar divergências de serverId
 * em partidas históricas, especialmente MATCH_TB_10 e partidas com histórico de pontos.
 */
export async function auditServerId(prismaClient?: PrismaClient): Promise<AuditSummary> {
  const prisma = prismaClient ?? new PrismaClient();
  const summary: AuditSummary = {
    inspected: 0,
    tb10Matches: 0,
    matchesWithDivergentServer: 0,
    totalPointsChecked: 0,
    divergentPoints: 0,
    details: [],
  };

  try {
    const matches = await prisma.match.findMany({
      where: {
        state: { in: ['IN_PROGRESS', 'FINISHED'] },
        initialServerId: { not: null },
      },
      select: {
        id: true,
        format: true,
        player1Id: true,
        player2Id: true,
        initialServerId: true,
        pointLog: {
          where: { voidedAt: null },
          orderBy: { sequenceNumber: 'asc' },
          select: {
            id: true,
            winnerId: true,
            type: true,
            serverId: true,
            sequenceNumber: true,
          },
        },
      },
    });

    summary.inspected = matches.length;

    for (const match of matches) {
      if (match.format === 'MATCH_TB_10') {
        summary.tb10Matches++;
      }

      const logs = match.pointLog ?? [];
      if (logs.length === 0 || !match.initialServerId) {
        continue;
      }

      const config: ScoringEngineConfig = {
        format: match.format as ScoringEngineConfig['format'],
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        initialServerId: match.initialServerId,
      };

      let engine: ScoringEngine;
      try {
        engine = new ScoringEngine(config);
      } catch {
        continue;
      }

      let matchDivergences = 0;

      for (const log of logs) {
        summary.totalPointsChecked++;
        const currentServer = engine.getServer();
        const expectedServerId = currentServer === 'player1' ? match.player1Id : match.player2Id;

        if (log.serverId && log.serverId !== expectedServerId) {
          matchDivergences++;
          summary.divergentPoints++;
        }

        try {
          engine.applyPoint({
            winnerId: log.winnerId,
            serverId: expectedServerId,
            type: log.type,
          });
        } catch {
          // Se o engine não puder aplicar o ponto (ex: partida finalizada antes do fim dos logs), interrompe replay desta partida
          break;
        }
      }

      if (matchDivergences > 0) {
        summary.matchesWithDivergentServer++;
        summary.details.push({
          matchId: match.id,
          format: match.format,
          totalPoints: logs.length,
          divergentPointsCount: matchDivergences,
        });
      }
    }

    return summary;
  } finally {
    if (!prismaClient) {
      await prisma.$disconnect();
    }
  }
}

if (require.main === module) {
  auditServerId()
    .then((result) => {
      console.log('--- Auditoria de ServerId Concluída ---');
      console.log(`Partidas inspecionadas: ${result.inspected}`);
      console.log(`Partidas MATCH_TB_10: ${result.tb10Matches}`);
      console.log(`Pontos verificados: ${result.totalPointsChecked}`);
      console.log(`Pontos com serverId divergente: ${result.divergentPoints}`);
      console.log(`Partidas com divergência: ${result.matchesWithDivergentServer}`);
      if (result.details.length > 0) {
        console.table(result.details);
      }
    })
    .catch((err) => {
      console.error('Erro na auditoria:', err);
      process.exit(1);
    });
}
