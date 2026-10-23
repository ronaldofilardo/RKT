"use client";
import { logger } from "@/lib/logger";

import { useEffect, useRef } from "react";
import { buildEngineConfig } from "@/core/scoring/engine-config";
import type { ScoringState } from "@/core/scoring/types";
import type { SuspendedSessionConfig } from "./suspended-session.types";
import { resumeFromSnapshotAhead, resumeFromBankAhead } from "./suspended-resume-logic";

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

    const resumeCtx = {
      suspendedSession, match, matchId, fetchMatch, sessionIdRef, tokenRef,
      engineRef, setScoreState, setSessionActive, startSession,
    };

    (async () => {
      try {
        const engineConfig = buildEngineConfig(match);

        if (suspendedSession.snapshotStatus === "SNAPSHOT_AHEAD") {
          await resumeFromSnapshotAhead(resumeCtx, engineConfig, controller.signal);
        } else {
          await resumeFromBankAhead(resumeCtx, engineConfig);
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
