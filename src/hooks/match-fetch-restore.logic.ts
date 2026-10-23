import { logger } from '@/lib/logger';
import { ScoringEngine } from '@/core/scoring/engine';
import type { ScoringEngineConfig, ScoringState } from '@/core/scoring/types';
import type { MatchDataWithSequence, ScoreStateEnvelope } from './useScoringHandlers.match-fetch.types';

/**
 * Restaura o engine a partir de `data.scoreState` (string ou envelope) quando
 * não há replay de logs disponível. Abre o modal de setup quando não há
 * servidor inicial nem pontuação para restaurar.
 */
export function restoreEngineFromScoreState(
  config: ScoringEngineConfig,
  data: MatchDataWithSequence,
  openRef: React.MutableRefObject<
    (modal: string, params?: Record<string, string>) => void
  >,
  engineRef: React.MutableRefObject<ScoringEngine | null>,
): void {
  let scoreStateToUse: ScoringState | ScoreStateEnvelope | string | null = data.scoreState;

  if (scoreStateToUse) {
    if (typeof scoreStateToUse === 'string') {
      try {
        scoreStateToUse = JSON.parse(scoreStateToUse) as ScoringState | ScoreStateEnvelope;
      } catch (error) {
        logger.warn('[MATCH FETCH] Falha ao parsear scoreState string; seguindo com o valor original:', error);
      }
    }
    const envelope: ScoreStateEnvelope | null =
      typeof scoreStateToUse === 'object' && scoreStateToUse !== null
        ? (scoreStateToUse as ScoreStateEnvelope)
        : null;
    const targetObj = (envelope?.state ? envelope.state : (scoreStateToUse as ScoringState))!;
    if (!targetObj.setsWon) {
      targetObj.setsWon = { player1: 0, player2: 0 };
    }

    const hasHistory = Array.isArray(envelope?.history) && envelope.history.length > 0;
    const hasPointsInGame = Boolean(
      targetObj?.currentGame && (targetObj.currentGame.player1 > 0 || targetObj.currentGame.player2 > 0)
    );
    const hasGamesInSets = (targetObj?.sets ?? []).some(
      (s) => (s.player1 || 0) > 0 || (s.player2 || 0) > 0
    );
    const hasStartedScoring = hasHistory || hasPointsInGame || hasGamesInSets;

    if (data.initialServerId || hasStartedScoring) {
      engineRef.current = ScoringEngine.fromSerialized(config, JSON.stringify(scoreStateToUse));
    } else {
      openRef.current('setup');
    }
  } else if (data.initialServerId) {
    engineRef.current = new ScoringEngine(config);
  } else {
    openRef.current('setup');
  }
}
