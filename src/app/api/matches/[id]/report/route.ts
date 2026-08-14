import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withRLSHandler, getRLSUser } from '@/lib/auth';
import type { Role } from '@/schemas/contracts';
import { ScoringEngine } from '@/core/scoring/engine';
import type { TimelinePoint } from '@/core/scoring/types';
import { enrichPointsFromHistory, getGameScoreLabel } from '@/components/scoring/timeline-utils';
import {
  rebuildTimelineFromPointLogs,
  type PointLogRow,
} from '@/components/scoring/timeline-rebuild';
import { getMatch, findAbandonedSessionSnapshot, getMatchScoreEdits } from '@/services/matchService';
import { prisma } from '@/lib/prisma';

/**
 * Descreve um snapshot `{state, history}` (ou state puro) de forma legível
 * para exibir no marcador de interrupção do /report, ex.: "Set 2 · Game
 * 3x2 · 30x30". Best-effort: se o snapshot não tiver o formato esperado,
 * cai em um rótulo genérico em vez de quebrar o relatório.
 */
function describeScoreSnapshotForDisplay(raw: unknown): string {
  try {
    const parsed = raw && typeof raw === 'object' && 'state' in (raw as any)
      ? (raw as any).state
      : raw;
    const sets = parsed?.sets ?? [];
    const setNumber = sets.length > 0 ? sets.length : 1;
    const currentSet = sets[sets.length - 1];
    const games = `${currentSet?.player1 ?? 0}x${currentSet?.player2 ?? 0}`;
    const points = getGameScoreLabel(
      parsed?.currentGame?.player1 ?? 0,
      parsed?.currentGame?.player2 ?? 0,
      parsed?.currentGame?.isDeuce,
      parsed?.currentGame?.advantage,
      currentSet?.isTiebreak,
    );
    return `Set ${setNumber} · Game ${games} · ${points}`;
  } catch {
    return '–';
  }
}

/**
 * Reconstrói a timeline de UM segmento de anotação (trecho entre duas
 * edições manuais de placar, ou entre o início da partida/última edição e
 * o estado atual). Reaproveita o mesmo caminho já usado para o
 * `scoreState` atual: `enrichPointsFromHistory` a partir do `history` do
 * engine, mesclado com os `PointLog` daquela janela de tempo via
 * `rebuildTimelineFromPointLogs` (que já cobre o fallback de anotações
 * sem `history` correspondente).
 */
function buildSegmentTimeline(
  rawScoreState: unknown,
  segmentPointLogs: PointLogRow[],
  format: string,
  player1Id: string,
  player2Id: string,
  initialServerId: string,
): TimelinePoint[] {
  if (!rawScoreState) {
    return segmentPointLogs.length > 0
      ? rebuildTimelineFromPointLogs([], segmentPointLogs, player1Id, player2Id, initialServerId)
      : [];
  }
  try {
    const engine = ScoringEngine.fromSerialized(
      { format: format as any, player1Id, player2Id, initialServerId },
      JSON.stringify(rawScoreState),
    );
    const history = engine.getPointHistory();
    const historyPoints = enrichPointsFromHistory(history, player1Id, player2Id);
    return rebuildTimelineFromPointLogs(
      historyPoints,
      segmentPointLogs,
      player1Id,
      player2Id,
      initialServerId,
      (format as string | undefined),
    );
  } catch {
    return segmentPointLogs.length > 0
      ? rebuildTimelineFromPointLogs([], segmentPointLogs, player1Id, player2Id, initialServerId, (format as string | undefined))
      : [];
  }
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
      // (rallyDetails, firstFault, áudio, etc.). Buscamos TODOS de uma vez
      // e depois particionamos por janela de tempo entre as edições de
      // placar — cada janela vira um segmento independente da timeline.
      const pointLogs = await prisma.pointLog.findMany({
        where: { matchId: id },
        orderBy: { timestamp: 'asc' },
        select: {
          id: true,
          winnerId: true,
          type: true,
          serverId: true,
          timestamp: true,
          annotations: true,
          audioNote: true,
          audioNoteDuration: true,
        },
      }) as PointLogRow[];

      // `MatchScoreEdit` registra cada correção manual de placar (ex.:
      // retomada de partida interrompida). Cada edição fecha um segmento
      // de anotação e abre outro — a timeline final concatena todos os
      // segmentos, na ordem, com um marcador de interrupção entre eles,
      // em vez de tratar a partida como um único `history` contínuo (que
      // é justamente o que fazia o /report perder ou zerar o trecho
      // anterior à edição).
      const scoreEdits = await getMatchScoreEdits(id);

      let timelinePoints: TimelinePoint[] = [];
      // Snapshot "atual" devolvido no payload (usado pelo cliente para
      // continuar a anotação) — sempre o mais recente, independente de
      // quantos segmentos a timeline tenha por baixo.
      let responseScoreState: unknown = match.scoreState ?? null;

      if (scoreEdits.length === 0) {
        // Caminho sem interrupções: comportamento equivalente ao anterior.
        let scoreState = match.scoreState ?? null;

        if (!scoreState) {
          const abandonedSession = await findAbandonedSessionSnapshot(id);
          if (abandonedSession?.matchStateSnapshot) {
            try {
              scoreState = JSON.parse(abandonedSession.matchStateSnapshot);
            } catch {
              scoreState = null;
            }
          }
        }
        responseScoreState = scoreState;

        timelinePoints = buildSegmentTimeline(
          scoreState,
          pointLogs,
          format,
          player1Id,
          player2Id,
          initialServerId,
        );
      } else {
        // Particiona os PointLog por janela de tempo entre edições.
        const boundaries = scoreEdits.map(e => e.editedAt.getTime());
        const segmentsPointLogs: PointLogRow[][] = Array.from(
          { length: scoreEdits.length + 1 },
          () => [],
        );
        for (const log of pointLogs) {
          const t = log.timestamp.getTime();
          let idx = boundaries.findIndex(b => t <= b);
          if (idx === -1) idx = boundaries.length; // após a última edição
          segmentsPointLogs[idx].push(log);
        }

        const allSegments: TimelinePoint[] = [];
        const segmentLengths: number[] = [];

        // Segmentos fechados (antes de cada edição), usando o snapshot
        // "previousScoreState" preservado no momento da edição.
        for (let i = 0; i < scoreEdits.length; i++) {
          const edit = scoreEdits[i];
          const segmentPoints = buildSegmentTimeline(
            edit.previousScoreState,
            segmentsPointLogs[i],
            format,
            player1Id,
            player2Id,
            initialServerId,
          );
          segmentLengths.push(segmentPoints.length);
          allSegments.push(...segmentPoints);
        }

        // Segmento final: estado atual da partida (ou snapshot de sessão
        // abandonada), com os PointLog posteriores à última edição.
        let finalScoreState: unknown = match.scoreState ?? null;
        if (!finalScoreState) {
          const abandonedSession = await findAbandonedSessionSnapshot(id);
          if (abandonedSession?.matchStateSnapshot) {
            try {
              finalScoreState = JSON.parse(abandonedSession.matchStateSnapshot);
            } catch {
              finalScoreState = null;
            }
          }
        }
        responseScoreState = finalScoreState;

        const finalSegmentPoints = buildSegmentTimeline(
          finalScoreState,
          segmentsPointLogs[scoreEdits.length],
          format,
          player1Id,
          player2Id,
          initialServerId,
        );

        if (finalSegmentPoints.length > 0) {
          const lastEdit = scoreEdits[scoreEdits.length - 1];
          finalSegmentPoints[0] = {
            ...finalSegmentPoints[0],
            segmentBreak: {
              editedAt: lastEdit.editedAt.toISOString(),
              previousLabel: describeScoreSnapshotForDisplay(lastEdit.previousScoreState),
              newLabel: describeScoreSnapshotForDisplay(lastEdit.newScoreState),
            },
          };
        }
        allSegments.push(...finalSegmentPoints);

        // Marca interrupções intermediárias (entre dois segmentos fechados
        // que não são o último) — usa os comprimentos já calculados acima
        // para achar o índice real de cada ponto na lista concatenada.
        let cursor = 0;
        for (let i = 0; i < scoreEdits.length - 1; i++) {
          cursor += segmentLengths[i];
          if (allSegments[cursor]) {
            const edit = scoreEdits[i];
            allSegments[cursor] = {
              ...allSegments[cursor],
              segmentBreak: {
                editedAt: edit.editedAt.toISOString(),
                previousLabel: describeScoreSnapshotForDisplay(edit.previousScoreState),
                newLabel: describeScoreSnapshotForDisplay(edit.newScoreState),
              },
            };
          }
        }

        // Renumera pointNumber sequencialmente através de todos os
        // segmentos (cada segmento, isoladamente, numera a partir de 1).
        timelinePoints = allSegments.map((p, idx) => ({ ...p, pointNumber: idx + 1 }));
      }

      return NextResponse.json({
        matchId: id,
        player1: { id: match.player1.id, name: match.player1.name },
        player2: { id: match.player2.id, name: match.player2.name },
        format: match.format,
        scoreState: responseScoreState,
        timelinePoints,
        // Quantidade de correções manuais de placar detectadas — útil para
        // o cliente exibir "esta partida teve N interrupções" sem precisar
        // varrer `timelinePoints` procurando `segmentBreak`.
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
