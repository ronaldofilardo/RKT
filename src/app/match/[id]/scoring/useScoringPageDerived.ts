"use client";

import type { ScoringState } from "@/core/scoring/types";
import type { TennisFormat } from "@/core/scoring/types";
import type { ScoringPageState } from "./useScoringPageState";
import type { ScoringPageHandlers } from "./useScoringPageEffects";
import {
  checkMatchPoint,
  checkSetPoint,
  checkBreakPoint,
  isSetCompleted,
} from "./scoringHelpers";

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
  canRedo: boolean;
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
}

export function useScoringPageDerived(
  state: ScoringPageState,
  handlers: ScoringPageHandlers,
): ScoringPageDerived {
  const { match, scoreState, engineRef, activeModal, gamePointToDisplay, timelinePoints } =
    state;
  const { isProcessing } = handlers;
  const { pendingEditScore, suspendedSession, session } = state;

  const effectiveScoreState = pendingEditScore?.scoreState
    ?? session.pendingEditScore?.scoreState
    ?? scoreState
    ?? suspendedSession?.bankScoreState
    ?? null;

  const p1IsServing = effectiveScoreState?.server === "player1";
  const p2IsServing = effectiveScoreState?.server === "player2";
  const isMatchPoint = effectiveScoreState ? checkMatchPoint(effectiveScoreState, match?.format) : false;
  const isSetPoint = effectiveScoreState && !checkMatchPoint(effectiveScoreState, match?.format) ? checkSetPoint(effectiveScoreState) : false;
  const isBreakPoint = effectiveScoreState && !checkMatchPoint(effectiveScoreState, match?.format) && !isSetPoint ? checkBreakPoint(effectiveScoreState) : false;
  const isTiebreak = effectiveScoreState
    ? (effectiveScoreState.sets[effectiveScoreState.sets.length - 1]?.isTiebreak ?? false)
    : false;
  const isSuperTiebreak = match?.format === "MATCH_TB_10";
  const isFinished = effectiveScoreState?.isFinished ?? false;
  const winner = effectiveScoreState?.winner ?? null;
  const canUndo = engineRef.current
    ? engineRef.current.getHistoryLength() > 0
    : false;
  const canRedo = false;
  const isSetupNeeded = activeModal === "setup" && !match?.initialServerId;
  const isProcessingPoint = isProcessing === true;

  const editScoreCurrentSets = (() => {
    if (!effectiveScoreState) return { player1: 0, player2: 0 };
    const lastSet = effectiveScoreState.sets[effectiveScoreState.sets.length - 1];
    if (!lastSet) return { player1: 0, player2: 0 };
    const lastSetIsCompleted = isSetCompleted(lastSet, match?.format as TennisFormat);

    if (lastSet.isTiebreak && lastSet.tiebreakScore) {
      return {
        player1: lastSet.tiebreakScore.player1,
        player2: lastSet.tiebreakScore.player2,
      };
    }

    return lastSetIsCompleted ? { player1: 0, player2: 0 } : { player1: lastSet.player1, player2: lastSet.player2 };
  })();

  const editScoreCompletedSets = effectiveScoreState
    ? effectiveScoreState.sets
        .filter((s) => isSetCompleted(s, match?.format as TennisFormat))
        .map((s) => {
          const winner = s.tiebreakScore
            ? s.tiebreakScore.player1 > s.tiebreakScore.player2
              ? "player1"
              : "player2"
            : s.player1 > s.player2
              ? "player1"
              : "player2";
          return {
            games: { player1: s.player1, player2: s.player2 } as Record<"player1" | "player2", number>,
            winner: winner as "player1" | "player2",
            ...(s.isTiebreak && s.tiebreakScore ? { tiebreakScore: s.tiebreakScore } : {}),
          };
        })
    : [];

  const serverEffectWinnerName = (() => {
    if (!match || !effectiveScoreState) return "";
    const server = effectiveScoreState.server;
    if (server === "player1") return match.player2.name;
    return match.player1.name;
  })();

  return {
    effectiveScoreState,
    p1IsServing,
    p2IsServing,
    isMatchPoint,
    isSetPoint,
    isBreakPoint,
    isTiebreak,
    isSuperTiebreak,
    isFinished,
    winner,
    canUndo,
    canRedo,
    isSetupNeeded,
    isProcessingPoint,
    gamePointToDisplay,
    timelinePoints,
    editScoreCurrentSets,
    editScoreCompletedSets,
    serverEffectWinnerName,
  };
}
