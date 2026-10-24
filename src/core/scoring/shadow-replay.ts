import { ScoringState, ScoringEngineConfig } from './types';
import { simulateScoreFromPointLogs, type PointLogRow, type TimelineScoreEdit } from './timeline-rebuild';
import { logger } from '@/lib/logger';
import { compareScoringStates, type ScoreComparisonResult } from './shadow-replay-compare.logic';

export { compareScoringStates } from './shadow-replay-compare.logic';
export type { ScoreComparisonResult } from './shadow-replay-compare.logic';

/**
 * Executa o shadow mode de forma isolada e segura.
 * Nunca lança erros no caminho crítico da aplicação.
 */
export function runShadowReplaySafely(params: {
  matchId: string;
  config: ScoringEngineConfig;
  canonicalState: ScoringState;
  pointLogs: PointLogRow[];
  scoreEdits?: TimelineScoreEdit[];
}): ScoreComparisonResult | null {
  try {
    const { matchId, config, canonicalState, pointLogs, scoreEdits = [] } = params;
    if (pointLogs.length === 0) {
      return { matches: true, divergences: [] };
    }

    const simulatedHistory = simulateScoreFromPointLogs(pointLogs, config, scoreEdits);
    if (simulatedHistory.length === 0) return null;

    // O último estado simulado após aplicar todos os pontos:
    // extrai o stateBefore do último ponto e, se ele processou, verifica o estado resultante
    const lastEntry = simulatedHistory[simulatedHistory.length - 1];
    const simulatedState = lastEntry.stateBefore; // ou estado derivado

    const comparison = compareScoringStates(canonicalState, simulatedState, scoreEdits.length > 0);

    if (!comparison.matches) {
      logger.warn({
        message: '[ShadowMode] Divergência detectada entre canonical e replay',
        matchId,
        divergences: comparison.divergences,
        reason: comparison.expectedDivergenceReason ?? 'UNEXPECTED',
      });
    }

    return comparison;
  } catch (err) {
    logger.error('[ShadowMode] Falha silenciosa na execução do shadow replay:', err);
    return null;
  }
}
