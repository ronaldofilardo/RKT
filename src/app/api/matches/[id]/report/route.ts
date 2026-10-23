import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withRLSHandler, getRLSUser } from '@/lib/auth';

import type { TimelinePoint, TennisFormat } from '@/core/scoring/types';
import {
  rebuildTimelineFromPointLogs,
  type PointLogRow,
} from '@/core/scoring/timeline-rebuild';
import { getMatch, findAbandonedSessionSnapshot, getMatchScoreEdits } from '@/services/matchService';
import { prisma } from '@/lib/prisma';
import { buildReportIntegrity } from './report.integrity';
import { computeAdvancedStats } from '@/core/report/compute-stats';
import { addScoreEditBreaks } from './route-timeline.logic';
import { buildEngineConfig } from '@/core/scoring/engine-config';
import { buildReportSummary } from './report-summary.logic';
import { buildReportResponse } from './report-payload.logic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    try {
      const { id } = await params;

      const user = getRLSUser();
      if (!user) {
        return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
      }

      const isStaff = user.role === 'ADMIN';

      const match = await getMatch(id);

      if (!match) {
        return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
      }

      if (match.state === 'CANCELLED') {
        return NextResponse.json({ error: 'MATCH_CANCELLED', message: 'Partida cancelada ou removida' }, { status: 410 });
      }

      const isPlayer =
        match.player1.id === user.id ||
        match.player2.id === user.id ||
        match.player1PartnerId === user.id ||
        match.player2PartnerId === user.id;
      const isCreator = match.createdByUserId === user.id;
      if (!isPlayer && !isCreator && !isStaff) {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
      }

      const engineConfig = buildEngineConfig(match);
      const player1Id = engineConfig.player1Id;
      const player2Id = engineConfig.player2Id;
      const initialServerId = engineConfig.initialServerId;
      const format = engineConfig.format as TennisFormat;

      // Os `PointLog` são a fonte imutável e completa das anotações
      // (rallyDetails, firstFault, áudio, etc.) — e a ÚNICA fonte usada
      // para montar a timeline do relatório. Buscamos TODOS de uma vez,
      // em ordem cronológica.
      const pointLogs = await prisma.pointLog.findMany({
        where: { matchId: id, voidedAt: null },
                orderBy: [
          { sequenceNumber: 'asc' },
          { timestamp: 'asc' },
          { id: 'asc' },
        ],

        select: {
          id: true,
          winnerId: true,
          type: true,
          serverId: true,
                    timestamp: true,
          sequenceNumber: true,
          clientEventId: true,
          annotations: true,
          audioNoteDuration: true,
          audioNoteMime: true,
        },
      }) as PointLogRow[];

      // A timeline é SEMPRE reconstruída em UMA ÚNICA simulação contínua
      // sobre todos os PointLog, do início ao fim da partida (passamos
      // `history: []` para forçar o caminho de reconstrução em
      // `rebuildTimelineFromPointLogs`, que aplica cada PointLog em ordem
      // no ScoringEngine e devolve o placar real — set, game e ponto —
      // no momento de cada ponto).
      //
      // Antes, cada trecho entre duas edições de placar (`MatchScoreEdit`)
      // era reconstruído separadamente a partir do `scoreState.history`
      // salvo naquele momento — só que esse `history` é CUMULATIVO desde
      // o início da partida, não um delta daquele trecho. Isso fazia os
      // pontos do(s) set(s) anterior(es) serem reconstruídos de novo a
      // cada novo trecho (duplicando o Set 1 na tela), e — quando o
      // número de PointLog do trecho não batia com o tamanho desse
      // histórico cumulativo — a reconstrução falhava silenciosamente e
      // caía num fallback que resimulava o placar do zero (0-0, Set 1)
      // só com os PointLog daquele trecho, fazendo o relatório mostrar
      // "Set 1" de novo em vez de continuar no Set 2, e por consequência
      // nunca alcançar o Set 3 real da partida.
      //
      // Usando a "Stateful Simulation", iteramos sobre todos os PointLog,
      // mas injetamos o estado de eventuais edições manuais (MatchScoreEdit)
      // no ScoringEngine exatamente no momento em que ocorreram. Assim,
      // a reconstrução não perde o contexto da correção e a tabela final
      // respeita exatamente a realidade imposta pelo usuário.
      const scoreEdits = await getMatchScoreEdits(id);
      
      let timelinePoints: TimelinePoint[] = rebuildTimelineFromPointLogs(
        [],
        pointLogs,
        player1Id,
        player2Id,
        initialServerId,
        format,
        scoreEdits,
        engineConfig.doubles,
      );

      // Decoramos a timeline com o aviso visual "⏸ Partida interrompida" 
      // no ponto correto.
      timelinePoints = addScoreEditBreaks(timelinePoints, pointLogs, scoreEdits);

      // Snapshot "atual" devolvido no payload (usado pelo cliente para
      // continuar a anotação, se a partida ainda não tiver terminado).
      let responseScoreState: unknown = match.scoreState ?? null;
      if (!responseScoreState) {
        const abandonedSession = await findAbandonedSessionSnapshot(id);
        if (abandonedSession?.matchStateSnapshot) {
          try {
            responseScoreState = JSON.parse(abandonedSession.matchStateSnapshot);
          } catch {
            responseScoreState = null;
          }
        }
      }

      const summary = buildReportSummary(timelinePoints);
      const integrity = buildReportIntegrity(pointLogs, timelinePoints);
      const advancedStats = computeAdvancedStats(timelinePoints);

      const comments = await prisma.matchComment.findMany({
        where: { matchId: id, deletedAt: null },
        select: {
          id: true,
          content: true,
          category: true,
          author: { select: { name: true } },
          createdAt: true,
          audioNoteDuration: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      return NextResponse.json(buildReportResponse({
        match,
        id,
        responseScoreState,
        timelinePoints,
        comments,
        summary,
        integrity,
        advancedStats,
        scoreEdits,
      }));
    } catch (error) {
      logger.error('[MATCH REPORT]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}
