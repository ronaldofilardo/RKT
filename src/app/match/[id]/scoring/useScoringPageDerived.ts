"use client";

import type { ScoringState } from "@/core/scoring/types";
import type { TennisFormat } from "@/core/scoring/types";
import type { ScoringPageState } from "./useScoringPageState";
import type { ScoringPageHandlers } from "./useScoringPageEffects";
import { resolveDisplayScore } from "./resolveDisplayScore";
import { getInitialGames } from "@/core/scoring/format-rules";
import { buildEngineConfig } from "@/core/scoring/engine-config";
import { getServingMemberId, getReceiverMemberId } from "@/core/scoring/doubles";
import {
  derivePointBadges,
  deriveTiebreakState,
} from "./scoring-page-derived-flags.logic";
import {
  deriveEditScoreCurrentSets,
  deriveEditScoreCompletedSets,
} from "./scoring-page-derived-edit-score.logic";

export interface ScoringPageDerived {
  effectiveScoreState: ScoringState | null;
  p1IsServing: boolean;
  p2IsServing: boolean;
  isMatchPoint: boolean;
  isSetPoint: boolean;
  isBreakPoint: boolean;
  isTiebreak: boolean;
  isSuperTiebreak: boolean;
  isFinished: boolean;
  winner: string | null;
  canUndo: boolean;
  isSetupNeeded: boolean;
  isProcessingPoint: boolean;
  gamePointToDisplay: (p: number) => string;
  timelinePoints: import("@/core/scoring/types").TimelinePoint[];
  editScoreCurrentSets: { player1: number; player2: number };
  editScoreCompletedSets: Array<{
    games: Record<"player1" | "player2", number>;
    winner: "player1" | "player2";
    tiebreakScore?: { player1: number; player2: number };
  }>;
  serverEffectWinnerName: string;
  activeServerId: string | null;
  activeReceiverId: string | null;
}

export function useScoringPageDerived(
  state: ScoringPageState,
  handlers: ScoringPageHandlers,
): ScoringPageDerived {
  const { match, scoreState, engineRef, activeModal, gamePointToDisplay, timelinePoints, serveErrorState } =
    state;
  const { isProcessing } = handlers;
  const { suspendedSession, session } = state;
  const pendingEditScore = session.pendingEditScore;

  let effectiveScoreState = resolveDisplayScore(
    activeModal,
    scoreState,
    pendingEditScore,
    suspendedSession,
  );

  if (effectiveScoreState && effectiveScoreState.sets.length === 0 && match?.format) {
    const initGames = getInitialGames(match.format as TennisFormat);
    effectiveScoreState = {
      ...effectiveScoreState,
      sets: [
        {
          player1: initGames,
          player2: initGames,
          isTiebreak: false,
          tiebreakScore: null,
        },
      ],
    };
  }

  if (effectiveScoreState && match) {
    // O `server` pode chegar como id de jogador (persistido) ou como lado.
    let resolvedServer: string = effectiveScoreState.server;
    if (resolvedServer === match.player2.id) {
      resolvedServer = "player2";
    } else if (resolvedServer === match.player1.id) {
      resolvedServer = "player1";
    } else if (resolvedServer !== "player1" && resolvedServer !== "player2") {
      resolvedServer = match.initialServerId === match.player2.id ? "player2" : "player1";
    }

    const totalGames = (effectiveScoreState.sets ?? []).reduce(
      (acc, s) => acc + (s.player1 || 0) + (s.player2 || 0),
      0
    );
    const hasCurrentGamePoints = Boolean(
      effectiveScoreState.currentGame && (
        (effectiveScoreState.currentGame.player1 || 0) > 0 ||
        (effectiveScoreState.currentGame.player2 || 0) > 0 ||
        Boolean(effectiveScoreState.currentGame.advantage) ||
        effectiveScoreState.currentGame.secondServe
      )
    );
    const hasTiebreakPoints = Boolean(
      (effectiveScoreState.sets ?? []).some(
        (s) => s.tiebreakScore && (
          (s.tiebreakScore.player1 || 0) > 0 ||
          (s.tiebreakScore.player2 || 0) > 0
        )
      )
    );

    const isVirginState =
      totalGames === 0 &&
      !hasCurrentGamePoints &&
      !hasTiebreakPoints;

    if (isVirginState && match.initialServerId) {
      resolvedServer = match.initialServerId === match.player2.id ? "player2" : "player1";
    }

    const serverSide: "player1" | "player2" = resolvedServer === "player2" ? "player2" : "player1";
    if (effectiveScoreState.server !== serverSide) {
      effectiveScoreState = {
        ...effectiveScoreState,
        server: serverSide,
      };
    }
  }

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
