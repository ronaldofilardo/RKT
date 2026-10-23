"use client";

import type { ScoringPageState } from "./useScoringPageState";
import type { ScoringPageHandlers } from "./useScoringPageEffects";
import {
  derivePointBadges,
  deriveTiebreakState,
} from "./scoring-page-derived-flags.logic";
import {
  deriveEditScoreCurrentSets,
  deriveEditScoreCompletedSets,
} from "./scoring-page-derived-edit-score.logic";
import { resolveDisplayState } from "./scoring-page-display.logic";
import { buildEngineConfig } from "@/core/scoring/engine-config";
import { getServingMemberId, getReceiverMemberId } from "@/core/scoring/doubles";
import type { ScoringPageDerived } from "./useScoringPageDerived.types";

export type { ScoringPageDerived } from "./useScoringPageDerived.types";

export function useScoringPageDerived(
  state: ScoringPageState,
  handlers: ScoringPageHandlers,
): ScoringPageDerived {
  const { match, scoreState, engineRef, activeModal, gamePointToDisplay, timelinePoints, serveErrorState } =
    state;
  const { isProcessing } = handlers;
  const { suspendedSession, session } = state;

  const effectiveScoreState = resolveDisplayState({
    activeModal,
    scoreState,
    pendingEditScore: session.pendingEditScore,
    suspendedSession,
    match,
  });

  const p1IsServing = effectiveScoreState?.server === "player1";
  const p2IsServing = effectiveScoreState?.server === "player2";
  const { isMatchPoint, isSetPoint, isBreakPoint } = derivePointBadges(effectiveScoreState, match?.format);
  const { isTiebreak, isSuperTiebreak } = deriveTiebreakState(effectiveScoreState, match?.format);

  const isFinished = effectiveScoreState?.isFinished ?? false;
  const winner = effectiveScoreState?.winner ?? null;

  const canUndo =
    (engineRef.current ? engineRef.current.getHistoryLength() > 0 : false) ||
    serveErrorState?.serveStep === 'second';
  const isSetupNeeded = activeModal === "setup" && !match?.initialServerId;
  const isProcessingPoint = isProcessing === true;

  const editScoreCurrentSets = deriveEditScoreCurrentSets(effectiveScoreState, match?.format);
  const editScoreCompletedSets = deriveEditScoreCompletedSets(effectiveScoreState, match?.format);

  const serverEffectWinnerName = match && effectiveScoreState
    ? (effectiveScoreState.server === "player1" ? match.player2.name : match.player1.name)
    : "";

  let activeServerId: string | null = null;
  let activeReceiverId: string | null = null;
  if (effectiveScoreState && match) {
    try {
      const engineConfig = buildEngineConfig(match);
      if (engineConfig.doubles) {
        activeServerId = getServingMemberId(effectiveScoreState, engineConfig.doubles);
        activeReceiverId = getReceiverMemberId(effectiveScoreState, engineConfig.doubles);
      }
    } catch {
      activeServerId = null;
      activeReceiverId = null;
    }
  }

  return {
    effectiveScoreState,
    p1IsServing,
    p2IsServing,
    activeServerId,
    activeReceiverId,
    isMatchPoint,
    isSetPoint,
    isBreakPoint,
    isTiebreak,
    isSuperTiebreak,
    isFinished,
    winner,
    canUndo,
    isSetupNeeded,
    isProcessingPoint,
    gamePointToDisplay,
    timelinePoints,
    editScoreCurrentSets,
    editScoreCompletedSets,
    serverEffectWinnerName,
  };
}
