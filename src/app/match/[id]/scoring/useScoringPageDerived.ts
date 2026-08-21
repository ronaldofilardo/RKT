import type { ScoringState } from '@/core/scoring/types';
import type { ScoringPageState } from './useScoringPageState';
import type { ScoringPageHandlers } from './useScoringPageEffects';
import {
  getEditScoreCompletedSets,
  getEditScoreCurrentSets,
  getEffectiveScoreState,
  getPointFlags,
  getServerEffectWinnerName,
} from './useScoringPageDerived.helpers';

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
  timelinePoints: import('@/core/scoring/types').TimelinePoint[];
  editScoreCurrentSets: { player1: number; player2: number };
  editScoreCompletedSets: Array<{
    games: Record<'player1' | 'player2', number>;
    winner: 'player1' | 'player2';
    tiebreakScore?: { player1: number; player2: number };
  }>;
  serverEffectWinnerName: string;
}

export function useScoringPageDerived(state: ScoringPageState, handlers: ScoringPageHandlers): ScoringPageDerived {
  const { match, engineRef, activeModal, gamePointToDisplay, timelinePoints } = state;
  const score = getEffectiveScoreState(state);
  const flags = getPointFlags(score, match?.format);
  const isFinished = score?.isFinished ?? false;
  const canUndo = engineRef.current ? engineRef.current.getHistoryLength() > 0 : false;

  return {
    effectiveScoreState: score,
    p1IsServing: score?.server === 'player1',
    p2IsServing: score?.server === 'player2',
    ...flags,
    isSuperTiebreak: match?.format === 'MATCH_TB_10',
    isFinished,
    winner: score?.winner ?? null,
    canUndo,
    canRedo: false,
    isSetupNeeded: activeModal === 'setup' && !match?.initialServerId,
    isProcessingPoint: handlers.isProcessing === true,
    gamePointToDisplay,
    timelinePoints,
    editScoreCurrentSets: getEditScoreCurrentSets(score, match?.format as any),
    editScoreCompletedSets: getEditScoreCompletedSets(score, match?.format as any),
    serverEffectWinnerName: getServerEffectWinnerName(match, score),
  };
}
