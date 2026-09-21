"use client";
import { logger } from "@/lib/logger";

import { useCallback, useEffect } from "react";
import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import { ScoringEngine } from "@/core/scoring/engine";
import type { ScoringState } from "@/core/scoring/types";
import type { SetEditData } from "@/components/scoring/editScoreHelpers";
import type { TennisFormat } from "@/core/scoring/types";
import { startSession } from "@/services/annotationSessionService";
import type { ScoreAction } from "@/hooks/useScoreReducer";
import type { MatchData } from "@/hooks/useScoringHandlers";
import {
  validateMatchTiebreakComplete,
} from "./useSessionManager.utils";
import { getMatchFormatRules } from "@/lib/matchConfig";
import { buildNewScoringState } from "./useSessionManager.state-builder";
import { finishMatch } from "./useSessionManager.match-finish";
import { useSuspendedSession } from "./useSuspendedSession";
import { useToast } from "@/components/Toast";
import { enqueuePendingAbandon } from "./useSessionManager.pending-abandon";
import { abandonCurrentSession as abandonSession } from "./useSessionManager.abandon";

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
  persistState: (state: ScoringState, label: string, persistOptions?: { allowScoreEdit?: boolean; isManualScoreEdit?: boolean; history?: any[] }) => Promise<{ success: boolean; needsResync?: boolean }>;

  setScoreState: Dispatch<ScoreAction>;
  setSessionActive: Dispatch<SetStateAction<boolean>>;
  setSuspendedSession: Dispatch<SetStateAction<SuspendedSessionState | null>>;
  setFloorCurrentSets: Dispatch<
    SetStateAction<{ player1: number; player2: number } | null>
  >;
  clearPendingEdit?: () => void;
  updateScoreContext?: (score: ScoringState) => void;
  close: () => void;
  closeAll?: () => void;
  /**
   * Ref para verificar se um ponto está sendo processado.
   * Usado para prevenir que o modal de edição de placar seja confirmado
   * enquanto um POST /point está em andamento (race condition #1).
   */
  isProcessingRef?: MutableRefObject<boolean>;
  /**
   * Remove pontos pendentes da fila offline para a partida.
   * Usado após edit-score para evitar que pontos antigos (que referenciam
   * o estado anterior) sejam aplicados ao estado editado durante o flush.
   */
  clearQueueForMatch?: (matchId: string) => Promise<void>;
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
  } = ctx;

  const { toast } = useToast();

  const abandonCurrentSession = useCallback(
    async (snapshot?: string): Promise<boolean> => {
      if (!sessionIdRef.current || !matchId) return false;
      if (!engineRef.current) return false;

      return abandonSession(
        {
          sessionId: sessionIdRef.current,
          matchId,
          engine: engineRef.current,
          token: tokenRef.current,
          matchVersion: match?.version,
        },
        { enqueuePendingAbandon, toast },
        snapshot,
      );
    },
    [matchId, match, sessionIdRef, engineRef, tokenRef, toast],
  );

  const handleEditScore = useCallback(
    async (
      setResults: SetEditData[],
      server: "player1" | "player2",
      onMatchFinished?: (winner: "player1" | "player2") => void
    ) => {
      // FIX #1: Impedir confirmação enquanto um ponto está sendo sincronizado.
      // Se isProcessingRef estiver true, um POST /point está em andamento —
      // o engineRef pode estar num estado transitório e a edição seria
      // aplicada sobre dados desatualizados.
      if (ctx.isProcessingRef?.current) {
        return;
      }

      // Bloquear novas adições de pontos enquanto a edição estiver sendo processada
      // para evitar race condition entre persist edit e engine.loadState
      if (ctx.isProcessingRef) {
        ctx.isProcessingRef.current = true;
      }

      try {

      const partialSet = setResults.find((set) => set.isPartial);
      
      const tbValidation = validateMatchTiebreakComplete(setResults, match?.format || '');
      if (!tbValidation.valid) {
        toast({ type: 'error', message: tbValidation.error ?? 'Validação de tiebreak falhou' });
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

        // FIX P1-8: Mergear setsWon do banco com os calculados a partir de
        // setResults. O modal de edição pode não incluir todos os sets
        // completados antes da suspensão (ex.: se o engine foi restaurado
        // de um snapshot parcial). O Math.max garante que sets já vencidos
        // no banco não sejam perdidos.
        newState.setsWon = {
          player1: Math.max(newState.setsWon.player1, bankSetsWon.player1),
          player2: Math.max(newState.setsWon.player2, bankSetsWon.player2),
        };

        // Recalcular isFinished/winner com base no setsWon mesclado
        const { setsToWin } = getMatchFormatRules((match?.format as TennisFormat) || "BEST_OF_3");
        if (newState.setsWon.player1 >= setsToWin) {
          newState.isFinished = true;
          newState.winner = "player1";
        } else if (newState.setsWon.player2 >= setsToWin) {
          newState.isFinished = true;
          newState.winner = "player2";
        } else {
          newState.isFinished = false;
          newState.winner = null;
        }
      }

      const isFinished = newState.isFinished;
      const winner = newState.winner;

      // PROTEÇÃO: Persistir ANTES de aplicar estado local.
      // Antes, o engine era atualizado antes da persistState — se ela falhasse,
      // a UI mostrava o placar editado enquanto o servidor ainda tinha o antigo.
      //
      // Bug (2026-09-06): quando a edição encerra a partida, este bloco
      // chamava persistState (PATCH /state, já com state: "FINISHED") e,
      // logo em seguida, finishMatch (POST /finish). Como o PATCH já
      // marcava match.state = FINISHED, o POST /finish sempre falhava com
      // ALREADY_FINISHED — e o winnerId nunca chegava a ser persistido.
      // Agora, quando a edição finaliza a partida, persistimos e
      // finalizamos em uma única chamada (POST /finish, que também grava
      // o scoreState); PATCH /state continua sendo usado normalmente
      // quando a partida permanece em andamento.
      const winnerPlayerId = isFinished && winner
        ? (winner === "player1" ? match?.player1.id : match?.player2.id)
        : undefined;

      if (isFinished && winner && winnerPlayerId && matchId) {
        logger.log("[handleEditScore] Match finished by edit — calling finishMatch directly", newState.currentGame);
        const finishResult = await finishMatch(
          { matchId, tokenRef, matchVersion: match?.version },
          winnerPlayerId,
          newState,
          { isManualScoreEdit: true }
        );

        if (finishResult.error === 'offline') {
          // Aplicar estado local mesmo offline para manter a UI consistente.
          // Quando a conexão voltar, useOfflineMatchSync fará o POST /finish.
          if (engineRef.current) {
            engineRef.current.loadState(newState);
            setScoreState({ type: "EDIT_CONFIRMED", payload: newState });
          }
          toast({ type: 'info', message: 'Partida finalizada offline. Sincronização pendente.' });
        } else if (!finishResult.success && finishResult.error) {
          toast({ type: 'error', message: `${finishResult.error}\n\nA partida foi encerrada localmente, mas não foi possível sincronizar com o servidor.` });
          return;
        }
      } else {
        logger.log("[handleEditScore] Calling persistState with currentGame:", newState.currentGame);
        const result = await persistState(newState, "edit-score", { isManualScoreEdit: true, history: [] });
        if (result.success) {
          logger.log("[handleEditScore] State persisted successfully");
        } else if (result.needsResync) {
          logger.warn("[handleEditScore] Needs resync due to version conflict — state re-synced from server");
          await fetchMatch(true);
          (ctx.closeAll ?? ctx.close)();
          return;
        } else {
          logger.error("[handleEditScore] Failed to persist state");
          toast({ type: 'error', message: 'Falha ao salvar placar editado. Tente novamente.' });
          return;
        }
      }

      // Aplicar estado local SOMENTE após persistência confirmada
      if (engineRef.current) {
        engineRef.current.loadState(newState);
        setScoreState({ type: "EDIT_CONFIRMED", payload: newState });
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

      // Limpar snapshots pendentes
      ctx.clearPendingEdit?.();
      setSuspendedSession(null);

      // Invalidar pontos offline pendentes para esta partida após
      // edição bem-sucedida. Pontos antigos referenciam o estado
      // anterior e seriam aplicados incorretamente durante o flush.
      ctx.clearQueueForMatch?.(matchId);

      if (isFinished && winner) {
        // finishMatch já foi chamado acima (persistência + finalização em
        // uma única requisição) — aqui só notificamos o callback da UI.
        if (onMatchFinished) {
          onMatchFinished(winner);
        }
      }

      await abandonCurrentSession();
      setSessionActive(false);
      (ctx.closeAll ?? ctx.close)();

      } finally {
        if (ctx.isProcessingRef) {
          ctx.isProcessingRef.current = false;
        }
      }
    },
    [
      match,
      matchId,
      engineRef,
      setScoreState,
      setSessionActive,
      setSuspendedSession,
      suspendedSession,
      persistState,
      abandonCurrentSession,
      ctx,
      tokenRef,
      fetchMatch,
      toast,
    ],
  );

  useEffect(() => {
    let abandoned = false;
    const doAbandon = () => {
      if (abandoned) return;
      const sid = sessionIdRef.current;
      if (!sid) return;
      const state = engineRef.current?.getState();
      if (!state || state.isFinished) return;
      abandoned = true;
      const snapshot = engineRef.current?.serialize() ?? JSON.stringify(state);
      sessionStorage.setItem("last_abandon_timestamp", Date.now().toString());
      const token = tokenRef.current ?? sessionStorage.getItem("access_token");
      abandonSession(
        { sessionId: sid, matchId, engine: engineRef.current!, token, matchVersion: match?.version },
        { enqueuePendingAbandon, toast },
        snapshot,
      ).catch(() => {});
    };
    window.addEventListener("beforeunload", doAbandon);
    window.addEventListener("pagehide", doAbandon);
    return () => {
      window.removeEventListener("beforeunload", doAbandon);
      window.removeEventListener("pagehide", doAbandon);
      doAbandon();
    };
  }, [matchId, sessionIdRef, engineRef, tokenRef, toast]);

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
    clearPendingEdit: ctx.clearPendingEdit ?? (() => {}),
    startSession,
  });

  return { abandonCurrentSession, handleEditScore };
}
