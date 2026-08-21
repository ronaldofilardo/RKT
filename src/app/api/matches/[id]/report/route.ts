import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withRLSHandler, getRLSUser } from '@/lib/auth';
import type { Role } from '@/schemas/contracts';
import { addScoreEditBreaks } from './route.timeline.helpers';
import { getMatch, getMatchScoreEdits } from '@/services/matchService';
import { buildReportTimeline, getReportScoreState } from './route.data.helpers';



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
      const { pointLogs, timelinePoints: initialTimelinePoints } = await buildReportTimeline(
        id, player1Id, player2Id, initialServerId, format,
      );

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
      let timelinePoints = initialTimelinePoints;

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
      const responseScoreState = await getReportScoreState(match, id);

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
