"use client";

import { useCallback } from "react";
import type { SetEditData } from "@/components/scoring/edit-score-domain";
import type { useSessionManager } from "@/hooks/useSessionManager";
import type { ScoringPageState } from "./useScoringPageState";

interface ScoringEditScoreParams {
  state: ScoringPageState;
  originalHandleEditScore: ReturnType<typeof useSessionManager>["openEditScoreModal"];
}

export function useScoringEditScore({
  state,
  originalHandleEditScore,
}: ScoringEditScoreParams) {
  const { engineRef, match, clearPendingEdit, close, fetchTimelinePoints } =
    state;

  const openEditScoreModal = useCallback(
    async (setResults: SetEditData[], server: "player1" | "player2", note?: string) => {
      await originalHandleEditScore(setResults, server, undefined, note);
      await fetchTimelinePoints?.();
    },
    [originalHandleEditScore, fetchTimelinePoints],
  );

  const cancelEditScore = useCallback(() => {
    clearPendingEdit();
    close();
  }, [clearPendingEdit, close]);

  const refreshEditScoreFloor = useCallback(async () => {
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

      if (isLastSet && set.player1 === 0 && set.player2 === 0) {
        // Match Tiebreak em andamento: games ficam 0x0 mas os pontos reais
        // estão em tiebreakScore. Retornar esses pontos como piso evita que
        // o loop caia para o set anterior (ex.: Set 2 = 2x6 em games),
        // que está em unidade completamente diferente dos pontos do MTB.
        if (
          set.isTiebreak &&
          set.tiebreakScore &&
          (set.tiebreakScore.player1 > 0 || set.tiebreakScore.player2 > 0)
        ) {
          return { player1: set.tiebreakScore.player1, player2: set.tiebreakScore.player2 };
        }
        // Set realmente vazio (0x0 sem tiebreakScore com progresso): ignorar
        continue;
      }

      // Para qualquer set com progresso em games, usar como floor
      if (set.player1 > 0 || set.player2 > 0) {
        return { player1: set.player1, player2: set.player2 };
      }
    }

    return null;
  }, [engineRef, match]);

  return {
    openEditScoreModal,
    cancelEditScore,
    refreshEditScoreFloor,
  };
}
