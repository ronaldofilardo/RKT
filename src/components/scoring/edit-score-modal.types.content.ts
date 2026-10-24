import type { TennisFormat } from '@/core/scoring/types';
import type { SetEditData } from '@/core/scoring/edit-score-domain';
import type { CompletedSet } from '@/core/scoring/edit-score-state';
import type { Player } from './edit-score-modal.types.props';

export interface EditScoreModalContentProps {
  matchFormat: TennisFormat;
  playerNames: { p1: string; p2: string };
  currentServer: Player;
  completedSets: CompletedSet[];
  floorCurrentSets: { player1: number; player2: number } | null;
  currentGamePoints?: { player1: number | string; player2: number | string };
  effectiveFloorTiebreak: { player1: number; player2: number } | null;
  confirmError: string | null;
  floorValidationError: string | null;
  doubles?: {
    player1PartnerName?: string;
    player2PartnerName?: string;
  };
  state: {
    editableCompletedSets: SetEditData[];
    newSets: SetEditData[];
    p1Input: string;
    p2Input: string;
    p1Points: string;
    p2Points: string;
    tiebreakP1: string;
    tiebreakP2: string;
    note?: string;
  };
  setState: (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => void;
  calculations: {
    validation: {
      p1Val: number;
      p2Val: number;
      isSetTrulyCompleted: boolean;
      hasTiebreak: boolean;
      isMatchTiebreakSet: boolean;
      setValidationError?: string;
    };
    tiebreakValidation: {
      tiebreakComplete: boolean;
      tiebreakImpossible: boolean;
    };
    matchState: {
      matchWouldEnd: boolean;
      matchAlreadyOver: boolean;
      totalEditedSets: number;
      setsToWin: number;
      p1SetsWon: number;
      p2SetsWon: number;
      maxSets: number;
    };
    canConfirm: boolean;
    partial: boolean | null;
    isPotentialMTSet: boolean;
    showGamePointsAtZero: boolean;
    currentScoreBelowOriginal: boolean;
  };
  canConfirmSet: boolean;
  handlers: {
    updateGameInputValue: (v: string, setter: (val: string) => void, player: 'p1' | 'p2', other: string) => void;
    updateTiebreakInputValue: (v: string, player: 'p1' | 'p2') => void;
    updatePointTotals: (p1: string, p2: string) => void;
    openEditCompletedSet: (index: number, p1Games: number, p2Games: number) => void;
    commitSetScore: () => void;
  };
}
