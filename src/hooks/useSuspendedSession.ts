"use client";
import { logger } from "@/lib/logger";

import { useEffect } from "react";
import { ScoringEngine } from "@/core/scoring/engine";
import type { SuspendedSessionState } from "./useSessionManager";
import type { MatchData } from "@/hooks/useScoringHandlers";
import { normalizeMatchTiebreakState } from "./useSessionManager.utils";

interface SuspendedSessionConfig {
  suspendedSession: SuspendedSessionState | null;
  match: MatchData | null;
  matchId: string;
  fetchMatch: (forceEngineReset?: boolean) => Promise<void>;
  sessionIdRef: React.MutableRefObject<string | null>;
  tokenRef: React.MutableRefObject<string | null>;
  engineRef: React.MutableRefObject<any>;
  setScoreState: (state: any) => void;
  setSessionActive: (active: boolean) => void;
  setSuspendedSession: (state: SuspendedSessionState | null) => void;
  setFloorCurrentSets: (sets: { player1: number; player2: number } | null) => void;
  setPendingEditScore: (state: any) => void;
  startSession: (matchId: string, createNew: boolean) => Promise<{ id: string }>;
}

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
    setPendingEditScore,
    startSession,
  } = config;

  useEffect(() => {
    if (!suspendedSession || !match) return;
    let ignored = false;

    (async () => {
      try {
        const engineConfig = {
          format: match.format as any,
          player1Id: match.player1.id,
          player2Id: match.player2.id,
          initialServerId: match.initialServerId || match.player1.id,
        };

        if (suspendedSession.snapshotStatus === "SNAPSHOT_AHEAD") {
          await resumeFromSnapshotAhead(engineConfig);
        } else {
          await resumeFromBankAhead(engineConfig);
        }

        if (!ignored) {
          cleanupAfterResume();
        }
      } catch {
        logger.error("[suspended session resume] Error:", "Erro ao retomar.");
      }
    })();

    return () => {
      ignored = true;
    };

    async function resumeFromSnapshotAhead(engineConfig: any) {
      const session = await startSession(matchId, false);
      sessionIdRef.current = session.id;
      setSessionActive(true);

      if (suspendedSession?.matchStateSnapshot) {
        const parsed = JSON.parse(suspendedSession.matchStateSnapshot);
        const history: any[] = Array.isArray(parsed?.history) ? parsed.history : [];
        const offlinePoints = history.slice(suspendedSession.bankPointCount);
        
        for (const entry of offlinePoints) {
          try {
            if (!entry?.point?.winnerId || !entry?.point?.type || !entry?.point?.serverId) {
              logger.warn('[suspended session resume] Skipping invalid offline point:', entry);
              continue;
            }
            
            await fetch(`/api/matches/${matchId}/point`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                authorization: `Bearer ${tokenRef.current}`,
              },
              body: JSON.stringify({
                winnerId: entry.point.winnerId,
                type: entry.point.type,
                serverId: entry.point.serverId,
                isFirstServe: entry.point.isFirstServe ?? true,
                isSecondServe: entry.point.isSecondServe ?? false,
                timestamp: entry.point.timestamp ?? Date.now(),
                ...(entry.point.rallyDetails != null ? { rallyDetails: entry.point.rallyDetails } : {}),
                ...(entry.point.rallyLength != null ? { rallyLength: entry.point.rallyLength } : {}),
              }),
            });
          } catch (err) {
            logger.error('[suspended session resume] Failed to sync offline point:', err);
          }
        }

        await fetchMatch(true);
        const freshRes = await fetch(`/api/matches/${matchId}`, {
          headers: { authorization: `Bearer ${tokenRef.current}` },
        });
        if (freshRes.ok) {
          const freshData: MatchData = await freshRes.json();
          if (freshData.scoreState) {
            engineRef.current = ScoringEngine.fromSerialized(
              engineConfig,
              JSON.stringify(freshData.scoreState),
            );
            setScoreState(engineRef.current.getState() as any);
          }
        }
      }
    }

    async function resumeFromBankAhead(engineConfig: any) {
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
          setScoreState(canonicalState);
        } else {
          const restored = engineRef.current.getState() as any;
          setScoreState(restored);
        }
      } else if (suspendedSession?.bankScoreState && match) {
        const normalizedBankState = normalizeMatchTiebreakState(suspendedSession.bankScoreState, match.format);
        engineRef.current = ScoringEngine.fromSerialized(
          engineConfig,
          JSON.stringify(normalizedBankState),
        );
        setScoreState(engineRef.current.getState() as any);
      }
    }

    function cleanupAfterResume() {
      const engineState = engineRef.current?.getState() as any | null;
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
    setPendingEditScore,
    startSession,
  ]);
}
