"use client";

import { useCallback } from "react";
import type { SetEditData } from "@/components/scoring/editScoreHelpers";
import type { useSessionManager } from "@/hooks/useSessionManager";
import type { ScoringPageState } from "./useScoringPageState";

interface ScoringEditScoreHandlersParams {
  state: ScoringPageState;
  originalHandleEditScore: ReturnType<typeof useSessionManager>["handleEditScore"];
}

export function useScoringEditScoreHandlers({
  state,
  originalHandleEditScore,
}: ScoringEditScoreHandlersParams) {
  const { engineRef, match, clearPendingEdit, close, fetchTimelinePoints } =
    state;

  const handleEditScore = useCallback(
    async (setResults: SetEditData[], server: "player1" | "player2", note?: string) => {
      await originalHandleEditScore(setResults, server, undefined, note);
      await fetchTimelinePoints?.();
    },
    [originalHandleEditScore, fetchTimelinePoints],
  );

  const handleEditScoreCancel = useCallback(() => {
    clearPendingEdit();
    close();
  }, [clearPendingEdit, close]);

  const handleEditScoreRefreshFloor = useCallback(async () => {
    if (!engineRef.current || !match) return null;
    const currentState = engineRef.current.getState();
    const sets = currentState.sets;
    if (sets.length === 0) return null;

    // P2-10 FIX: Se o último set é vazio (auto-added 0-0), olhar para
    // o set anterior completo como floor. O set vazio não representa
    // progresso real — usar seu placar como floor inutiliza a proteção.
    for (let i = sets.length - 1; i >= 0; i--) {
      const set = sets[i];
      const isLastSet = i === sets.length - 1;
      // Para o último set, só usar como floor se tiver progresso real
      if (isLastSet && set.player1 === 0 && set.player2 === 0) continue;
      // Para qualquer set com progresso, usar como floor
      if (set.player1 > 0 || set.player2 > 0) {
        return { player1: set.player1, player2: set.player2 };
      }
    }

    return null;
  }, [engineRef, match]);

  return {
    handleEditScore,
    handleEditScoreCancel,
    handleEditScoreRefreshFloor,
  };
}
