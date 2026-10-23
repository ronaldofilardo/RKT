import type { TennisFormat } from '@/core/scoring/types';
import {
  rebuildTimelineFromPointLogs,
  type PointLogRow,
} from '@/core/scoring/timeline-rebuild';
import { getMatchScoreEdits } from '@/services/matchService';
import { prisma } from '@/lib/prisma';
import { addScoreEditBreaks } from './route-timeline.logic';
import type { buildEngineConfig } from '@/core/scoring/engine-config';

type EngineConfig = ReturnType<typeof buildEngineConfig>;

export interface ReportTimelineData {
  pointLogs: PointLogRow[];
  scoreEdits: Awaited<ReturnType<typeof getMatchScoreEdits>>;
  timelinePoints: import('@/core/scoring/types').TimelinePoint[];
}

/**
 * Carrega os `PointLog` (fonte imutável das anotações), as edições de
 * placar e reconstrói a timeline do relatório.
 *
 * A timeline é SEMPRE reconstruída em UMA ÚNICA simulação contínua
 * sobre todos os PointLog, do início ao fim da partida (passamos
 * `history: []` para forçar o caminho de reconstrução em
 * `rebuildTimelineFromPointLogs`, que aplica cada PointLog em ordem
 * no ScoringEngine e devolve o placar real — set, game e ponto —
 * no momento de cada ponto).
 *
 * Antes, cada trecho entre duas edições de placar (`MatchScoreEdit`)
 * era reconstruído separadamente a partir do `scoreState.history`
 * salvo naquele momento — só que esse `history` é CUMULATIVO desde
 * o início da partida, não um delta daquele trecho. Isso fazia os
 * pontos do(s) set(s) anterior(es) serem reconstruídos de novo a
 * cada novo trecho (duplicando o Set 1 na tela), e — quando o
 * número de PointLog do trecho não batia com o tamanho desse
 * histórico cumulativo — a reconstrução falhava silenciosamente e
 * caía num fallback que resimulava o placar do zero (0-0, Set 1)
 * só com os PointLog daquele trecho, fazendo o relatório mostrar
 * "Set 1" de novo em vez de continuar no Set 2, e por consequência
 * nunca alcançar o Set 3 real da partida.
 *
 * Usando a "Stateful Simulation", iteramos sobre todos os PointLog,
 * mas injetamos o estado de eventuais edições manuais (MatchScoreEdit)
 * no ScoringEngine exatamente no momento em que ocorreram. Assim,
 * a reconstrução não perde o contexto da correção e a tabela final
 * respeita exatamente a realidade imposta pelo usuário.
 */
export async function loadReportTimeline(
  id: string,
  engineConfig: EngineConfig,
): Promise<ReportTimelineData> {
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

  const scoreEdits = await getMatchScoreEdits(id);

  let timelinePoints = rebuildTimelineFromPointLogs(
    [],
    pointLogs,
    engineConfig.player1Id,
    engineConfig.player2Id,
    engineConfig.initialServerId,
    engineConfig.format as TennisFormat,
    scoreEdits,
    engineConfig.doubles,
  );

  // Decoramos a timeline com o aviso visual "⏸ Partida interrompida"
  // no ponto correto.
  timelinePoints = addScoreEditBreaks(timelinePoints, pointLogs, scoreEdits);

  return { pointLogs, scoreEdits, timelinePoints };
}
