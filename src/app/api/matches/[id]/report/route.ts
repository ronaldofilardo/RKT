import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withRLSHandler, getRLSUser } from '@/lib/auth';
import type { Role } from '@/schemas/contracts';
import type { TimelinePoint } from '@/core/scoring/types';
import { getGameScoreLabel } from '@/components/scoring/timeline-utils';
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
      // (rallyDetails, firstFault, áudio, etc.) — e a ÚNICA fonte usada
      // para montar a timeline do relatório. Buscamos TODOS de uma vez,
      // em ordem cronológica.
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
      if (scoreEdits.length > 0 && timelinePoints.length > 0) {
        for (const edit of scoreEdits) {
          const editTime = edit.editedAt.getTime();
          // Primeiro ponto cujo timestamp de PointLog é POSTERIOR à
          // edição — é ali que o aviso de interrupção deve aparecer.
          const idx = pointLogs.findIndex(log => log.timestamp.getTime() > editTime);
          if (idx !== -1 && timelinePoints[idx]) {
            timelinePoints[idx] = {
              ...timelinePoints[idx],
              segmentBreak: {
                editedAt: edit.editedAt.toISOString(),
                previousLabel: describeScoreSnapshotForDisplay(edit.previousScoreState),
                newLabel: describeScoreSnapshotForDisplay(edit.newScoreState),
              },
            };
          }
        }
      }

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
