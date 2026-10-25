import type { TimelinePoint, ScoringEngineConfig, DoublesConfig, TennisFormat } from '@/core/scoring/types';
import type { PointLogRow } from './point-log-merge';
import { enrichPointsFromHistory } from '@/core/scoring/scoring-logic';
import { isPointDecisiveDeuce } from './point-context';
import { mergeWithPointLog } from './point-log-merge';
import { simulateScoreFromPointLogs, type TimelineScoreEdit } from './timeline-rebuild-simulate.logic';

// Fonte canônica do tipo movida para `point-log-merge.ts`. Re-exportado para
// manter a API pública existente (rotas de relatório, shadow-replay, testes).
export type { PointLogRow } from './point-log-merge';
export { simulateScoreFromPointLogs } from './timeline-rebuild-simulate.logic';
export type { TimelineScoreEdit } from './timeline-rebuild-simulate.logic';

/**
 * Reconstrói a timeline completa do relatório a partir dos `PointLog`
 * (fonte imutável e completa de anotações), usando `scoreState.history`
 * (quando cobre todos os PointLog) ou — no cenário em que o `history`
 * está incompleto (após undos/syncs que descartaram entradas antigas) —
 * SIMULANDO o placar ponto a ponto a partir do estado inicial por meio
 * do `ScoringEngine`, garantindo que GAME/PONTO/SET sempre reflitam o
 * placar real do momento de cada ponto, em vez de zeros.
 *
 * As anotações detalhadas (rallyDetails, firstFault, note, áudio) sempre
 * vêm do PointLog — nunca do history — porque o PointLog é a fonte de
 * verdade pós-gravação.
 *
 * @param history        Histórico vindo do `scoreState` serializado.
 *                       Ignorado quando seu comprimento é menor que o de
 *                       `pointLogs` (caminho de reconstrução simulada).
 * @param pointLogs      Todos os PointLog da partida, ordenados por timestamp.
 * @param config         Configuração do engine (player1Id, player2Id,
 *                       initialServerId, format). Necessário para a
 *                       simulação do placar acumulado.
 */
export function rebuildTimelineFromPointLogs(
  history: TimelinePoint[],
  pointLogs: PointLogRow[],
  player1Id: string,
  player2Id: string,
  initialServerId: string,
  format?: string,
  scoreEdits: TimelineScoreEdit[] = [],
  doublesConfig?: DoublesConfig,
): TimelinePoint[] {
  if (pointLogs.length === 0) return history;

  const config: ScoringEngineConfig = {
    format: format as ScoringEngineConfig['format'],
    player1Id,
    player2Id,
    initialServerId,
    ...(doublesConfig ? { doubles: doublesConfig } : {}),
  };

  // Caminho nominal: history cobre todos os PointLog — preserva stateBefore
  // exatamente como persistido (inclui situações pós-edição manual e
  // tiebreaks que seriam custosos de ressuscitar pela simulação), apenas
  // sobrescrevendo as anotações detalhadas com os dados frescos do PointLog.
  if (history.length >= pointLogs.length) {
    return history.map((p, i) => {
      const merged = mergeWithPointLog(p, pointLogs[i], i + 1);
      if (isPointDecisiveDeuce(p.gameScore, format as TennisFormat)) {
        merged.isBreakPoint = true;
        merged.isGameBall = true;
      }
      return merged;
    });
  }

  // Caminho de RECONSTRUÇÃO: history incompleto (ou vazio). Simula o placar
  // acumulado a partir do estado inicial, aplicando cada PointLog no engine.
  // Cada `HistoryEntry.stateBefore` devolvido carrega o placar real do
  // momento daquele ponto (games/game/set/server/BP/GB/SB), e o `point`
  // carrega os metadados brutos — depois sobrescrevemos as anotações com os
  // dados frescos do PointLog correspondente.
  const simulatedHistory = simulateScoreFromPointLogs(pointLogs, config, scoreEdits);
  const enriched = enrichPointsFromHistory(simulatedHistory, player1Id, player2Id, config.format);
  return enriched.map((p, i) => mergeWithPointLog(p, pointLogs[i], i + 1));
}
