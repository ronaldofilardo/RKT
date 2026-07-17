"use client";

import { useCallback, useEffect } from "react";
import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import { ScoringEngine } from "@/core/scoring/engine";
import type { ScoringState, SetScore, GameScore } from "@/core/scoring/types";
import type { SetEditData } from "@/components/scoring/editScoreHelpers";
import { setsToWinForFormat } from "@/components/scoring/editScoreHelpers";
import type { TennisFormat } from "@/core/scoring/types";
import { startSession } from "@/services/annotationSessionService";
import type { MatchData } from "@/hooks/useScoringHandlers";
import {
  normalizeMatchTiebreakState,
  validateMatchTiebreakComplete,
} from "./useSessionManager.utils";
import { buildNewScoringState } from "./useSessionManager.state-builder";

export interface SuspendedSessionState {
  matchStateSnapshot: string | null;
  previousPointsCount: number;
  snapshotStatus: "IN_SYNC" | "SNAPSHOT_AHEAD" | "BANK_AHEAD";
  snapshotPointCount: number;
  bankPointCount: number;
  bankScoreState: ScoringState | null;
}

export interface SessionManagerContext {
  matchId: string;
  match: MatchData | null;
  isLoading: boolean;

  engineRef: MutableRefObject<ScoringEngine | null>;
  tokenRef: MutableRefObject<string | null>;
  sessionIdRef: MutableRefObject<string | null>;
  matchIdRef: MutableRefObject<string>;

  suspendedSession: SuspendedSessionState | null;
  fetchMatch: (forceEngineReset?: boolean) => Promise<void>;
  persistState: (state: ScoringState, label: string) => Promise<{ success: boolean; needsResync?: boolean }>;

  setScoreState: Dispatch<SetStateAction<ScoringState | null>>;
  setSessionActive: Dispatch<SetStateAction<boolean>>;
  setSuspendedSession: Dispatch<SetStateAction<SuspendedSessionState | null>>;
  setFloorCurrentSets: Dispatch<
    SetStateAction<{ player1: number; player2: number } | null>
  >;
  setPendingEditScore: Dispatch<
    SetStateAction<{
      scoreState: ScoringState;
      floorSets: { player1: number; player2: number } | null;
    } | null>
  >;
  clearPendingEdit?: () => void;
  updateScoreContext?: (score: ScoringState) => void;
  close: () => void;
}

export function useSessionManager(ctx: SessionManagerContext) {
  const {
    matchId,
    match,
    fetchMatch,
    persistState,
    sessionIdRef,
    tokenRef,
    engineRef,
    setScoreState,
    setSessionActive,
    setSuspendedSession,
    suspendedSession,
    setFloorCurrentSets,
    setPendingEditScore,
  } = ctx;

  const abandonCurrentSession = useCallback(
    async (snapshot?: string) => {
      const sid = sessionIdRef.current;
      const mid = matchId;
      if (!sid || !mid) return;
      if (!engineRef.current) return;

      const state = engineRef.current.getState();
      const isFinished = state.isFinished;
      const stateSnapshot = snapshot ?? engineRef.current.serialize();

      try {
        if (isFinished) {
          await Promise.all([
            fetch(`/api/matches/${mid}/sessions/${sid}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tokenRef.current}`,
              },
              body: JSON.stringify({
                status: "COMPLETED",
                finalState: state,
              }),
            }),
            fetch(`/api/matches/${mid}/state`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tokenRef.current}`,
              },
              body: JSON.stringify({
                state: "FINISHED",
                scoreState: state,
              }),
            }),
          ]);
        } else {
          await fetch(`/api/matches/${mid}/sessions/${sid}/abandon`, {
            method: "POST",
            keepalive: true,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokenRef.current}`,
            },
            body: JSON.stringify({ matchStateSnapshot: stateSnapshot }),
          });
        }
      } catch (e) {
        console.error("[abandonCurrentSession] Error:", e);
      }
    },
    [matchId, sessionIdRef, engineRef, tokenRef],
  );

  const handleEditScore = useCallback(
    async (
      setResults: SetEditData[],
      server: "player1" | "player2",
      onMatchFinished?: (winner: "player1" | "player2") => void
    ) => {
      const partialSet = setResults.find((set) => set.isPartial);
      
      const tbValidation = validateMatchTiebreakComplete(setResults, match?.format || '');
      if (!tbValidation.valid) {
        alert(tbValidation.error);
        return;
      }
      
      const newState = buildNewScoringState({
        setResults,
        server,
        format: (match?.format as TennisFormat) || "BEST_OF_3",
        partialSet,
      });

      console.log("[handleEditScore] newState.currentGame:", newState.currentGame);
      console.log("[handleEditScore] partialSet:", partialSet);

      if (suspendedSession) {
        const bankSetsWon = suspendedSession.bankScoreState?.setsWon ?? {
          player1: 0,
          player2: 0,
        };
        if (
          newState.setsWon.player1 < bankSetsWon.player1 ||
          newState.setsWon.player2 < bankSetsWon.player2
        ) {
          alert("Cannot reduce the number of sets already won.");
          return;
        }
      }

      const isFinished = newState.isFinished;
      const winner = newState.winner;

      if (engineRef.current) {
        engineRef.current.loadState(newState);
        setScoreState(newState);
        console.log("[handleEditScore] Engine loaded with state:", JSON.stringify(newState, null, 2));
        console.log("[handleEditScore] setScoreState called - currentGame:", newState.currentGame);
        console.log("[handleEditScore] setScoreState called - sets:", JSON.stringify(newState.sets));
        console.log("[handleEditScore] isMatchTiebreak check:", {
          format: match?.format,
          setResultsLength: setResults.length,
          firstSet: setResults[0],
          lastSet: setResults[setResults.length - 1],
          hasCompletedSetsBefore: setResults.slice(0, -1).some(s => !s.isPartial),
        });
      }

      // CORREÇÃO: limpar imediatamente qualquer snapshot "pendente" (pendingEditScore
      // local, pendingEditScore do contexto de sessão, e suspendedSession.bankScoreState)
      // na MESMA passada em que atualizamos scoreState. Esses três têm prioridade mais
      // alta que scoreState em `effectiveScoreState` (page.tsx). Se ficarem "vivos" até
      // o fim da função (depois de persistState/finish/abandonCurrentSession, todos
      // assíncronos), os botões de placar continuam mostrando o valor ANTIGO até essas
      // chamadas terminarem — ou indefinidamente, se alguma delas falhar.
      setPendingEditScore(null);
      ctx.clearPendingEdit?.();
      setSuspendedSession(null);
      
      // PROTEÇÃO #3: Deduplicação de Persistência
      if (isFinished && winner) {
        console.log("[handleEditScore] Match finished - will persist via /finish endpoint");
      } else {
        console.log("[handleEditScore] Calling persistState with currentGame:", newState.currentGame);
        const result = await persistState(newState, "edit-score");
        if (result.success) {
          console.log("[handleEditScore] State persisted successfully");
        } else if (result.needsResync) {
          console.warn("[handleEditScore] Needs resync due to version conflict");
          await fetchMatch(true);
          return;
        } else {
          console.error("[handleEditScore] Failed to persist state");
        }
      }

      if (isFinished && winner) {
        const winnerPlayerId = winner === "player1" ? match?.player1.id : match?.player2.id;
        if (winnerPlayerId && matchId) {
          try {
            const token = tokenRef.current ?? sessionStorage.getItem("access_token");
            const response = await fetch(`/api/matches/${matchId}/finish`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                winnerId: winnerPlayerId,
                scoreState: newState,
                reason: 'COMPLETED',
              }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || 'Failed to update match winner');
            }

            const result = await response.json();
            console.log('Match finished successfully:', result.match);
          } catch (err) {
            console.error('Failed to update match winner:', err);
            
            const isOffline = !navigator.onLine;
            if (isOffline || (err instanceof TypeError && err.message === 'Failed to fetch')) {
              const pendingSync = {
                matchId,
                winnerId: winnerPlayerId,
                finishedAt: new Date().toISOString(),
                timestamp: Date.now(),
                type: 'MATCH_FINISH' as const,
              };
              
              const pendingSyncs = JSON.parse(
                localStorage.getItem('pendingMatchSyncs') || '[]'
              ) as Array<typeof pendingSync>;
              
              pendingSyncs.push(pendingSync);
              localStorage.setItem('pendingMatchSyncs', JSON.stringify(pendingSyncs));
              
              console.log('Match finish saved for offline sync:', pendingSync);
            }
            
            const errorMessage = err instanceof Error ? err.message : 'Erro ao finalizar partida';
            alert(`⚠️ ${errorMessage}\n\nA partida foi encerrada localmente, mas não foi possível sincronizar com o servidor.`);
          }
        }
        
        if (onMatchFinished) {
          onMatchFinished(winner);
        }
      }

      await abandonCurrentSession();
      setSessionActive(false);
      ctx.close();
    },
    [
      match,
      matchId,
      engineRef,
      setScoreState,
      setSessionActive,
      setPendingEditScore,
      setSuspendedSession,
      suspendedSession,
      persistState,
      abandonCurrentSession,
      ctx,
      tokenRef,
    ],
  );

  useEffect(() => {
    const doAbandon = () => {
      const sid = sessionIdRef.current;
      if (!sid) return;
      const state = engineRef.current?.getState();
      if (!state || state.isFinished) return;
      const snapshot = engineRef.current?.serialize() ?? JSON.stringify(state);
      sessionStorage.setItem("last_abandon_timestamp", Date.now().toString());
      const token = tokenRef.current ?? sessionStorage.getItem("access_token");
      fetch(`/api/matches/${matchId}/sessions/${sid}/abandon`, {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ matchStateSnapshot: snapshot }),
      }).catch(() => {});
    };
    window.addEventListener("beforeunload", doAbandon);
    window.addEventListener("pagehide", doAbandon);
    return () => {
      window.removeEventListener("beforeunload", doAbandon);
      window.removeEventListener("pagehide", doAbandon);
      doAbandon();
    };
  }, [matchId, sessionIdRef, engineRef, tokenRef]);

  useEffect(() => {
    if (!suspendedSession || !match) return;
    let ignored = false;

    (async () => {
      try {
        const config = {
          format: match.format as any,
          player1Id: match.player1.id,
          player2Id: match.player2.id,
          initialServerId: match.initialServerId || match.player1.id,
        };

        if (suspendedSession.snapshotStatus === "SNAPSHOT_AHEAD") {
          const session = await startSession(matchId, false);
          sessionIdRef.current = session.id;
          setSessionActive(true);

          if (suspendedSession.matchStateSnapshot) {
            const parsed = JSON.parse(suspendedSession.matchStateSnapshot);
            const history: any[] = Array.isArray(parsed?.history) ? parsed.history : [];
            const offlinePoints = history.slice(suspendedSession.bankPointCount);
            for (const entry of offlinePoints) {
              try {
                await fetch(`/api/matches/${matchId}/point`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    authorization: `Bearer ${tokenRef.current}`,
                  },
                  body: JSON.stringify({
                    winnerId: entry.point?.winnerId,
                    type: entry.point?.type,
                    serverId: entry.point?.serverId,
                    isFirstServe: entry.point?.isFirstServe ?? true,
                    isSecondServe: entry.point?.isSecondServe ?? false,
                    timestamp: entry.point?.timestamp ?? Date.now(),
                    ...(entry.point?.rallyDetails != null ? { rallyDetails: entry.point.rallyDetails } : {}),
                    ...(entry.point?.rallyLength != null ? { rallyLength: entry.point.rallyLength } : {}),
                  }),
                });
              } catch {}
            }

            await fetchMatch(true);
            const freshRes = await fetch(`/api/matches/${matchId}`, {
              headers: { authorization: `Bearer ${tokenRef.current}` },
            });
            if (freshRes.ok) {
              const freshData: MatchData = await freshRes.json();
              if (freshData.scoreState) {
                engineRef.current = ScoringEngine.fromSerialized(
                  config,
                  JSON.stringify(freshData.scoreState),
                );
                setScoreState(engineRef.current.getState() as ScoringState);
              }
            }
          }
        } else {
          const session = await startSession(matchId, false);
          sessionIdRef.current = session.id;
          setSessionActive(true);

          if (suspendedSession.matchStateSnapshot) {
            engineRef.current = ScoringEngine.fromSerialized(
              config,
              JSON.stringify(normalizeMatchTiebreakState(JSON.parse(suspendedSession.matchStateSnapshot), match.format)),
            );

            const canonicalState = suspendedSession.bankScoreState ?? match.scoreState;
            const canonicalVersion = suspendedSession.bankPointCount;
            if (canonicalState) {
              engineRef.current.reconcileWithCanonicalState(canonicalState, canonicalVersion);
              setScoreState(canonicalState);
            } else {
              const restored = engineRef.current.getState() as ScoringState;
              setScoreState(restored);
            }
          } else if (suspendedSession.bankScoreState) {
            const normalizedBankState = normalizeMatchTiebreakState(suspendedSession.bankScoreState, match.format);
            engineRef.current = ScoringEngine.fromSerialized(
              config,
              JSON.stringify(normalizedBankState),
            );
            setScoreState(engineRef.current.getState() as ScoringState);
          }
        }

        if (!ignored) {
          const engineState = engineRef.current?.getState() as ScoringState | null;
          const lastSet = engineState?.sets?.[engineState.sets.length - 1];
          let currentFloorSets = lastSet
            ? { player1: lastSet.player1, player2: lastSet.player2 }
            : suspendedSession.bankScoreState?.sets?.[suspendedSession.bankScoreState.sets.length - 1]
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
                console.log('[useSessionManager] Floor fallback from bank:', currentFloorSets);
              }
            } catch (err) {
              console.error('[useSessionManager] Failed to parse bank scoreState:', err);
            }
          }
          
          setFloorCurrentSets(currentFloorSets);
          setSuspendedSession(null);
        }
      } catch {
        console.error("[suspended session resume] Error:", "Erro ao retomar.");
      }
    })();

    return () => {
      ignored = true;
    };
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
  ]);

  return { abandonCurrentSession, handleEditScore };
}