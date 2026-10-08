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
  isMatchTiebreakSetIndex,
} from "./scoringHelpers";
import { resolveDisplayScore } from "./resolveDisplayScore";
import { getInitialGames } from "@/core/scoring/format-rules";

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
}

function derivePointBadges(
  effectiveScoreState: ScoringState | null,
  format?: string,
): { isMatchPoint: boolean; isSetPoint: boolean; isBreakPoint: boolean } {
  if (!effectiveScoreState) {
    return { isMatchPoint: false, isSetPoint: false, isBreakPoint: false };
  }
  const isMatchPoint = checkMatchPoint(effectiveScoreState, format);
  const isSetPoint = !isMatchPoint && checkSetPoint(effectiveScoreState, format);
  const isBreakPoint = !isMatchPoint && !isSetPoint && checkBreakPoint(effectiveScoreState, format);

  return { isMatchPoint, isSetPoint, isBreakPoint };
}

function deriveTiebreakState(
  effectiveScoreState: ScoringState | null,
  format?: string,
): { isTiebreak: boolean; isSuperTiebreak: boolean } {
  if (!effectiveScoreState) {
    return { isTiebreak: false, isSuperTiebreak: false };
  }

  const lastSet = effectiveScoreState.sets[effectiveScoreState.sets.length - 1];
  if (!lastSet) {
    return { isTiebreak: false, isSuperTiebreak: false };
  }

  let isTb = lastSet.isTiebreak;
  if (!isTb && lastSet.player1 === 0 && lastSet.player2 === 0 && effectiveScoreState.sets.length > 1) {
    const prevSet = effectiveScoreState.sets[effectiveScoreState.sets.length - 2];
    isTb = prevSet?.isTiebreak ?? false;
  }

  const isSuperTb = isTb
    ? isMatchTiebreakSetIndex(
        format as TennisFormat | undefined,
        effectiveScoreState.sets.length - 1,
        effectiveScoreState.setsWon,
      )
    : false;

  return { isTiebreak: isTb, isSuperTiebreak: isSuperTb };
}

function deriveEditScoreCurrentSets(
  effectiveScoreState: ScoringState | null,
  format?: string,
): { player1: number; player2: number } {
  const initialVal = format ? getInitialGames(format as TennisFormat) : 0;
  
  if (!effectiveScoreState) return { player1: initialVal, player2: initialVal };
  
  const lastSet = effectiveScoreState.sets[effectiveScoreState.sets.length - 1];
  if (!lastSet) return { player1: initialVal, player2: initialVal };
  
  // Se o último set já está finalizado, significa que estamos num set NOVO (que ainda não foi pro array de sets)
  if (isSetCompleted(lastSet, format as TennisFormat, effectiveScoreState.sets.length - 1, effectiveScoreState.setsWon)) {
    return { player1: initialVal, player2: initialVal };
  }

  if (lastSet.isTiebreak && lastSet.tiebreakScore) {
    if (lastSet.player1 > 0 || lastSet.player2 > 0) {
      return { player1: lastSet.player1, player2: lastSet.player2 };
    }
    return {
      player1: lastSet.tiebreakScore.player1,
      player2: lastSet.tiebreakScore.player2,
    };
  }

  return { player1: lastSet.player1, player2: lastSet.player2 };
}

function deriveEditScoreCompletedSets(
  effectiveScoreState: ScoringState | null,
  format?: string,
) {
  if (!effectiveScoreState) return [];

  return effectiveScoreState.sets
    .filter((s, i) => isSetCompleted(s, format as TennisFormat, i, effectiveScoreState.setsWon))
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
    });
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

  const effectiveScoreState = resolveDisplayScore(
    activeModal,
    scoreState,
    pendingEditScore,
    suspendedSession,
  );

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
    isSetupNeeded,
    isProcessingPoint,
    gamePointToDisplay,
    timelinePoints,
    editScoreCurrentSets,
    editScoreCompletedSets,
    serverEffectWinnerName,
  };
}
