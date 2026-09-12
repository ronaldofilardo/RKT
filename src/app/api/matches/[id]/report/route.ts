import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withRLSHandler, getRLSUser } from '@/lib/auth';
import type { Role } from '@/schemas/contracts';
import type { TimelinePoint } from '@/core/scoring/types';
import {
  rebuildTimelineFromPointLogs,
  type PointLogRow,
} from '@/core/scoring/timeline-rebuild';
import { getMatch, findAbandonedSessionSnapshot, getMatchScoreEdits } from '@/services/matchService';
import { prisma } from '@/lib/prisma';
import type { ReportSummary, PlayerPointSummary } from '@/core/report/report-types';
import { buildReportIntegrity } from './report.integrity';
import { computeAdvancedStats } from '@/core/report/compute-stats';
import { addScoreEditBreaks } from './route.timeline.helpers';

function buildPlayerSummary(
  points: TimelinePoint[],
  isPlayer1: boolean,
): PlayerPointSummary {
  const winner = isPlayer1 ? 'PLAYER_1' : 'PLAYER_2';
  const pointsWon = points.filter(p => p.winner === winner).length;
  const aces = points.filter(p => p.type === 'ACE' && p.server === (isPlayer1 ? 'player1' : 'player2')).length;
  const doubleFaults = points.filter(p => p.type === 'DOUBLE_FAULT' && p.server === (isPlayer1 ? 'player1' : 'player2')).length;

  let winners = 0;
  let forcedErrors = 0;
  let unforcedErrors = 0;
  for (const p of points) {
    const tipo = p.rallyDetails?.tipo;
    if (p.winner === winner) {
      if (tipo === 'winner') winners++;
    } else {
      if (tipo === 'erro_forcado') forcedErrors++;
      else if (tipo === 'erro_nao_forcado') unforcedErrors++;
    }
  }

  const isServer = (p: TimelinePoint) =>
    (isPlayer1 && p.server === 'player1') || (!isPlayer1 && p.server === 'player2');
  const breakPoints = points.filter(p => p.isBreakPoint && !isServer(p)).length;
  const breakPointsWon = points.filter(p => p.isBreakPoint && !isServer(p) && p.winner === winner).length;

  return { pointsWon, aces, winners, forcedErrors, unforcedErrors, doubleFaults, breakPoints, breakPointsWon };
}

function buildReportSummary(
  timelinePoints: TimelinePoint[],
): ReportSummary {
  const sets: ReportSummary['sets'] = [];
  const setMap = new Map<number, { p1: number; p2: number; isTiebreak: boolean }>();

  for (const p of timelinePoints) {
    const s = p.setNumber;
    if (!setMap.has(s)) setMap.set(s, { p1: 0, p2: 0, isTiebreak: false });
    const entry = setMap.get(s)!;
    if (p.winner === 'PLAYER_1') entry.p1++;
    else entry.p2++;
    if (p.isTiebreak) entry.isTiebreak = true;
  }

  for (const [, v] of setMap) {
    sets.push({ player1: v.p1, player2: v.p2, isTiebreak: v.isTiebreak });
  }

  return {
    totalPoints: timelinePoints.length,
    player1: buildPlayerSummary(timelinePoints, true),
    player2: buildPlayerSummary(timelinePoints, false),
    sets,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ATHLETE', async () => {
    try {
      const { id } = await params;

      const user = getRLSUser();
      if (!user) {
        return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
      }

      const isStaff = (['ADMIN', 'GESTOR', 'COACH'] as Role[]).includes(user.role as Role);

      const match = await getMatch(id);

      if (!match) {
        return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
      }

      if (match.state === 'CANCELLED') {
        return NextResponse.json({ error: 'MATCH_CANCELLED', message: 'Partida cancelada ou removida' }, { status: 410 });
      }

      const isPlayer = match.player1.id === user.id || match.player2.id === user.id;
      const isCreator = match.createdByUserId === user.id;
      if (!isPlayer && !isCreator && !isStaff) {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
      }

      const player1Id = match.player1.id;
      const player2Id = match.player2.id;
      const initialServerId = match.initialServerId ?? player1Id;
      const format = match.format as any;

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

          audioNote: true,
          audioNoteDuration: true,
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
      // Usando sempre uma simulação única e contínua sobre TODOS os
      // PointLog, o placar nunca reinicia no meio da partida: cada set é
      // mostrado uma única vez, na ordem certa, do Set 1 ao Set final.
      let timelinePoints: TimelinePoint[] = rebuildTimelineFromPointLogs(
        [],
        pointLogs,
        player1Id,
        player2Id,
        initialServerId,
        format,
      );

      // `MatchScoreEdit` registra cada correção manual de placar (ex.:
      // retomada de partida interrompida). Isso não afeta mais o CÁLCULO
      // do placar (que agora vem só dos PointLog) — usamos apenas para
      // decorar a timeline com o aviso "⏸ Partida interrompida" no ponto
      // correto, mostrando o que o placar era antes/depois da correção
      // manual, para dar contexto a quem está lendo o relatório.
      const scoreEdits = await getMatchScoreEdits(id);
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

      return NextResponse.json({
        matchId: id,
        player1: { id: match.player1.id, name: match.player1.name },
        player2: { id: match.player2.id, name: match.player2.name },
        format: match.format,
        sportType: match.sportType,
        courtType: match.courtType ?? null,
        tournamentName: match.tournamentName ?? null,
        category: match.category ?? null,
        round: match.round ?? null,
        bracketType: match.bracketType ?? null,
        temperature: match.temperature ?? null,
        humidity: match.humidity ?? null,
        winnerId: match.winnerId ?? null,
        finishReason: match.finishReason ?? null,
        finishNote: match.finishNote ?? null,
        scoreState: responseScoreState,
        timelinePoints,
        summary,
        integrity,
        advancedStats,
        scoreEditsCount: scoreEdits.length,
        state: match.state,
        startedAt: match.startedAt,
        finishedAt: match.finishedAt,
      });
    } catch (error) {
      logger.error('[MATCH REPORT]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}
