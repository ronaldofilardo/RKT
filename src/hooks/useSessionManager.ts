"use client";
import { logger } from "@/lib/logger";

import { useCallback, useEffect } from "react";
import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import { ScoringEngine } from "@/core/scoring/engine";
import type { ScoringState } from "@/core/scoring/types";
import type { SetEditData } from "@/components/scoring/editScoreHelpers";
import type { TennisFormat } from "@/core/scoring/types";
import { startSession } from "@/services/annotationSessionService";
import type { MatchData } from "@/hooks/useScoringHandlers";
import {
  validateMatchTiebreakComplete,
} from "./useSessionManager.utils";
import { buildNewScoringState } from "./useSessionManager.state-builder";
import { finishMatch } from "./useSessionManager.match-finish";
import { useSuspendedSession } from "./useSuspendedSession";

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
          const stateResponse = await fetch(`/api/matches/${mid}/state`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokenRef.current}`,
            },
            body: JSON.stringify({
              state: "FINISHED",
              scoreState: state,
            }),
          });

          if (!stateResponse.ok) {
            throw new Error(`state PATCH failed: ${stateResponse.status}`);
          }

          try {
            const sessionResponse = await fetch(`/api/matches/${mid}/sessions/${sid}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tokenRef.current}`,
              },
              body: JSON.stringify({
                status: "COMPLETED",
                finalState: state,
              }),
            });
            if (!sessionResponse.ok) {
              logger.warn(
                `[abandonCurrentSession] session PATCH failed (${sessionResponse.status}); match already FINISHED — leaving session open`
              );
            }
          } catch (sessionErr) {
            logger.warn(
              "[abandonCurrentSession] session PATCH exception; match already FINISHED — leaving session open",
              sessionErr
            );
          }
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
        logger.error("[abandonCurrentSession] Error:", e);
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

      logger.log("[handleEditScore] newState.currentGame:", newState.currentGame);
      logger.log("[handleEditScore] partialSet:", partialSet);

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
        logger.log("[handleEditScore] Engine loaded with state:", JSON.stringify(newState, null, 2));
        logger.log("[handleEditScore] setScoreState called - currentGame:", newState.currentGame);
        logger.log("[handleEditScore] setScoreState called - sets:", JSON.stringify(newState.sets));
        logger.log("[handleEditScore] isMatchTiebreak check:", {
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
        logger.log("[handleEditScore] Match finished - will persist via /finish endpoint");
      } else {
        logger.log("[handleEditScore] Calling persistState with currentGame:", newState.currentGame);
        const result = await persistState(newState, "edit-score");
        if (result.success) {
          logger.log("[handleEditScore] State persisted successfully");
        } else if (result.needsResync) {
          logger.warn("[handleEditScore] Needs resync due to version conflict");
          await fetchMatch(true);
          return;
        } else {
          logger.error("[handleEditScore] Failed to persist state");
        }
      }

      if (isFinished && winner) {
        const winnerPlayerId = winner === "player1" ? match?.player1.id : match?.player2.id;
        if (winnerPlayerId && matchId) {
          const result = await finishMatch(
            { matchId, tokenRef },
            winnerPlayerId,
            newState
          );
          
          if (result.error === 'offline') {
            alert('⚠️ Partida finalizada offline. Sincronização pendente.');
          } else if (!result.success && result.error) {
            alert(`⚠️ ${result.error}\n\nA partida foi encerrada localmente, mas não foi possível sincronizar com o servidor.`);
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
      fetchMatch,
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

  // Hook de suspended session foi extraído para useSuspendedSession.ts
  useSuspendedSession({
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
  });

  return { abandonCurrentSession, handleEditScore };
}
