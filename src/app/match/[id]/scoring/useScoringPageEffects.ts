"use client";

import { useCallback } from "react";
import type { ScoringPageState } from "./useScoringPageState";
import type { ScoringPageHandlers } from "./useScoringPageHandlers.types";
import { useScoringPageHandlersBridge } from "./useScoringPageHandlersBridge";
import { useScoringPageSessionBridge } from "./useScoringPageSessionBridge";
import { useScoringLifecycleEffects } from "./useScoringLifecycleEffects";
import { useScoringComment } from "./useScoringComment";
import { useScoringEditScore } from "./useScoringEditScore";

export type { ScoringPageHandlers } from "./useScoringPageHandlers.types";

export function useScoringPageEffects(state: ScoringPageState): ScoringPageHandlers {
  const { open, openServeErrorModal, closeServeErrorModal } = state;

  const {
    persistState,
    fetchMatch,
    confirmMatchSetup,
    undoLastPoint,
    returnToPreviousScreen,
    recordAceDirectly,
    confirmServerEffect,
    confirmServeError,
    recordDirectServeError,
    cancelServeError,
    confirmPointDetails,
    updateDoublesArrangement,
    isProcessing,
  } = useScoringPageHandlersBridge(state);

  const { abandonCurrentSession, openEditScoreModal: originalHandleEditScore } =
    useScoringPageSessionBridge(state, fetchMatch, persistState);

  useScoringLifecycleEffects({ state, fetchMatch });

  const { createMatchComment } = useScoringComment(state);

  const {
    openEditScoreModal,
    cancelEditScore,
    refreshEditScoreFloor,
  } = useScoringEditScore({
    state,
    originalHandleEditScore,
  });

  const onPointSelectFromCard = useCallback(
    (winnerSide: "player1" | "player2") => {
      open("point-details", { winner: winnerSide });
    },
    [open],
  );

  /** Painel inline: apenas registra o erro pendente; o clique em Confirmar decide o ponto. */
  const startServeErrorDetails = useCallback(
    (errorType: "out" | "net", step: "first" | "second") => {
      if (isProcessing) return;
      openServeErrorModal(errorType, step);
    },
    [isProcessing, openServeErrorModal],
  );

  /** Fecha o painel sem tocar no estado do 1º saque (≠ cancelServeError, que zera tudo). */
  const dismissServeErrorDetails = useCallback(
    () => closeServeErrorModal(),
    [closeServeErrorModal],
  );

  return {
    persistState,
    fetchMatch,
    confirmMatchSetup,
    undoLastPoint,
    returnToPreviousScreen,
    recordAceDirectly,
    confirmServerEffect,
    confirmServeError,
    recordDirectServeError,
    cancelServeError,
    confirmPointDetails,
    updateDoublesArrangement,
    onPointSelectFromCard,
    startServeErrorDetails,
    dismissServeErrorDetails,
    cancelEditScore,
    refreshEditScoreFloor,
    isProcessing,
    abandonCurrentSession,
    openEditScoreModal,
    createMatchComment,
  };
}
