import { logger } from '@/lib/logger';
import { ScoringEngine } from '@/core/scoring/engine';
import type { HistoryEntry, ScoringEngineConfig } from '@/core/scoring/types';
import type { MatchData } from '@/hooks/useScoringHandlers';
import type { ScoreAction } from '@/hooks/useScoreReducer';
import type { SuspendedSessionState } from './useSessionManager';
import { normalizeMatchTiebreakState } from './use-session-manager.logic';
import { fetchServerSequence, replayOfflinePoints } from './suspended-resume-replay.logic';

interface ResumeCtx {
  suspendedSession: SuspendedSessionState | null;
  match: MatchData | null;
  matchId: string;
  fetchMatch: (forceEngineReset?: boolean) => Promise<void>;
  sessionIdRef: React.MutableRefObject<string | null>;
  tokenRef: React.MutableRefObject<string | null>;
  engineRef: React.MutableRefObject<ScoringEngine | null>;
  setScoreState: (action: ScoreAction) => void;
  setSessionActive: (active: boolean) => void;
  startSession: (matchId: string, createNew: boolean) => Promise<{ id: string }>;
}

export async function resumeFromSnapshotAhead(
  ctx: ResumeCtx,
  engineConfig: ScoringEngineConfig,
  signal?: AbortSignal,
): Promise<void> {
  const { suspendedSession, matchId, sessionIdRef, setSessionActive, tokenRef, match, fetchMatch, engineRef, setScoreState, startSession } = ctx;
  const session = await startSession(matchId, false);
  sessionIdRef.current = session.id;
  setSessionActive(true);

  if (suspendedSession?.matchStateSnapshot) {
    const parsed = JSON.parse(suspendedSession.matchStateSnapshot);
    const history: HistoryEntry[] = Array.isArray(parsed?.history) ? parsed.history : [];

    const serverSequence = await fetchServerSequence(matchId, () => tokenRef.current, signal);
    await replayOfflinePoints({
      matchId,
      bankPointCount: suspendedSession.bankPointCount,
      serverSequence,
      getToken: () => tokenRef.current,
      history,
      signal,
    });

    await fetchMatch(true);
    const freshRes = await fetch(`/api/matches/${matchId}`, {
      headers: { authorization: `Bearer ${tokenRef.current}` },
      signal,
    });
    if (freshRes.ok) {
      const freshData: MatchData = await freshRes.json();

      if (freshData.version !== undefined && freshData.version <= (match?.version ?? -1)) {
        logger.warn('[useSuspendedSession] freshData has no updated version, skipping engine reload');
      } else if (freshData.scoreState) {
        engineRef.current = ScoringEngine.fromSerialized(
          engineConfig,
          JSON.stringify(freshData.scoreState),
        );
        setScoreState({ type: 'RESYNCED_FROM_SERVER', payload: engineRef.current.getState() });
      }
    }
  }
}

export async function resumeFromBankAhead(
  ctx: ResumeCtx,
  engineConfig: ScoringEngineConfig,
): Promise<void> {
  const { suspendedSession, matchId, sessionIdRef, setSessionActive, match, engineRef, setScoreState, startSession } = ctx;
  const session = await startSession(matchId, false);
  sessionIdRef.current = session.id;
  setSessionActive(true);

  if (suspendedSession?.matchStateSnapshot && match) {
    engineRef.current = ScoringEngine.fromSerialized(
      engineConfig,
      JSON.stringify(normalizeMatchTiebreakState(JSON.parse(suspendedSession.matchStateSnapshot), match.format)),
    );

    const canonicalState = suspendedSession.bankScoreState ?? match.scoreState;
    const canonicalVersion = suspendedSession.bankPointCount;
    if (canonicalState) {
      engineRef.current.reconcileWithCanonicalState(canonicalState, canonicalVersion);
      setScoreState({ type: 'RESYNCED_FROM_SERVER', payload: canonicalState });
    } else {
      const restored = engineRef.current.getState();
      setScoreState({ type: 'RESYNCED_FROM_SERVER', payload: restored });
    }
  } else if (suspendedSession?.bankScoreState && match) {
    const normalizedBankState = normalizeMatchTiebreakState(suspendedSession.bankScoreState, match.format);
    engineRef.current = ScoringEngine.fromSerialized(
      engineConfig,
      JSON.stringify(normalizedBankState),
    );
    setScoreState({ type: 'RESYNCED_FROM_SERVER', payload: engineRef.current.getState() });
  }
}
