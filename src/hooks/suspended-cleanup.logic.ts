import { logger } from '@/lib/logger';
import type { ScoringState } from '@/core/scoring/types';
import type { MatchData } from '@/hooks/useScoringHandlers';
import type { SuspendedSessionState } from './useSessionManager';

interface CleanupCtx {
  engineRef: React.MutableRefObject<import('@/core/scoring/engine').ScoringEngine | null>;
  suspendedSession: SuspendedSessionState | null;
  match: MatchData | null;
  setFloorCurrentSets: (sets: { player1: number; player2: number } | null) => void;
  setSuspendedSession: (state: SuspendedSessionState | null) => void;
}

/**
 * Encerra o retomar: calcula o piso de games (engine > snapshot > scoreState
 * do banco) e limpa o suspendedSession.
 */
export function cleanupAfterResume(ctx: CleanupCtx): void {
  const { engineRef, suspendedSession, match, setFloorCurrentSets, setSuspendedSession } = ctx;

  const engineState: ScoringState | null = engineRef.current?.getState() ?? null;
  const lastSet = engineState?.sets?.[engineState.sets.length - 1];
  let currentFloorSets = lastSet
    ? (lastSet.isTiebreak && lastSet.tiebreakScore
        ? { player1: lastSet.tiebreakScore.player1, player2: lastSet.tiebreakScore.player2 }
        : { player1: lastSet.player1, player2: lastSet.player2 })
    : suspendedSession?.bankScoreState?.sets?.[suspendedSession.bankScoreState.sets.length - 1]
      ? {
          player1: suspendedSession.bankScoreState.sets[suspendedSession.bankScoreState.sets.length - 1].player1,
          player2: suspendedSession.bankScoreState.sets[suspendedSession.bankScoreState.sets.length - 1].player2,
        }
      : null;

  if (!currentFloorSets && match?.scoreState) {
    try {
      const bankState = typeof match.scoreState === 'string'
        ? JSON.parse(match.scoreState)
        : match.scoreState;

      const bankLastSet = bankState?.sets?.[bankState.sets.length - 1];
      if (bankLastSet) {
        currentFloorSets = {
          player1: bankLastSet.player1,
          player2: bankLastSet.player2,
        };
        logger.log('[useSuspendedSession] Floor fallback from bank:', currentFloorSets);
      }
    } catch (err) {
      logger.error('[useSuspendedSession] Failed to parse bank scoreState:', err);
    }
  }

  setFloorCurrentSets(currentFloorSets);
  setSuspendedSession(null);
}
