import type { ScoringState, TimelinePoint } from "@/core/scoring/types";

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
  timelinePoints: TimelinePoint[];
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
