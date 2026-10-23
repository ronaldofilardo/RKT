"use client";
import { logger } from "@/lib/logger";

import { useEffect, useRef } from "react";
import { ScoringEngine } from "@/core/scoring/engine";
import { buildEngineConfig } from "@/core/scoring/engine-config";
import type {
  HistoryEntry,
  ScoringEngineConfig,
  ScoringState,
} from "@/core/scoring/types";
import type { MatchData } from "@/hooks/useScoringHandlers";
import { normalizeMatchTiebreakState } from "./use-session-manager.logic";
import type { SuspendedSessionConfig } from "./suspended-session.types";
import { fetchServerSequence, replayOfflinePoints } from "./suspended-resume-replay.logic";

export type { SuspendedSessionConfig } from "./suspended-session.types";

export function useSuspendedSession(config: SuspendedSessionConfig) {
  const {
    suspendedSession,
    match,
    matchId,
    fetchMatch,
    sessionIdRef,
    tokenRef,
    engineRef,
    setScoreState,
    setSessionActive,
    setSuspendedSession,
    setFloorCurrentSets,
    clearPendingEdit,
    startSession,
  } = config;

  const resumedSessionKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!suspendedSession || !match) return;
    const sessionKey = `${matchId}-${suspendedSession.snapshotStatus}-${suspendedSession.snapshotPointCount}-${suspendedSession.bankPointCount}`;
    if (resumedSessionKeyRef.current === sessionKey) return;
    resumedSessionKeyRef.current = sessionKey;
    let ignored = false;
    const controller = new AbortController();

    (async () => {
      try {
        const engineConfig = buildEngineConfig(match);

        if (suspendedSession.snapshotStatus === "SNAPSHOT_AHEAD") {
          await resumeFromSnapshotAhead(engineConfig, controller.signal);
        } else {
          await resumeFromBankAhead(engineConfig);
        }

        if (!ignored) {
          cleanupAfterResume();
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        logger.error("[suspended session resume] Error:", "Erro ao retomar.", err);
        if (!ignored) {
          cleanupAfterResume();
        }
      }
    })();

    return () => {
      ignored = true;
      controller.abort();
    };

    async function resumeFromSnapshotAhead(engineConfig: ScoringEngineConfig, signal?: AbortSignal) {
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
            setScoreState({ type: "RESYNCED_FROM_SERVER", payload: engineRef.current.getState() });
          }
        }
      }
    }

    async function resumeFromBankAhead(engineConfig: ScoringEngineConfig) {
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
          setScoreState({ type: "RESYNCED_FROM_SERVER", payload: canonicalState });
        } else {
          const restored = engineRef.current.getState();
          setScoreState({ type: "RESYNCED_FROM_SERVER", payload: restored });
        }
      } else if (suspendedSession?.bankScoreState && match) {
        const normalizedBankState = normalizeMatchTiebreakState(suspendedSession.bankScoreState, match.format);
        engineRef.current = ScoringEngine.fromSerialized(
          engineConfig,
          JSON.stringify(normalizedBankState),
        );
        setScoreState({ type: "RESYNCED_FROM_SERVER", payload: engineRef.current.getState() });
      }
    }

    function cleanupAfterResume() {
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
  }, [
    suspendedSession,
    match,
    matchId,
    fetchMatch,
    sessionIdRef,
    tokenRef,
    engineRef,
    setScoreState,
    setSessionActive,
    setSuspendedSession,
    setFloorCurrentSets,
    clearPendingEdit,
    startSession,
  ]);
}
