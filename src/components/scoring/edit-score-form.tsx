import type { TennisFormat } from '@/core/scoring/types';
import { SetInputFormContent } from './edit-score-form.sections';

export interface SetInputFormProps {
  matchFormat: TennisFormat;
  totalEditedSets: number;
  playerNames: { p1: string; p2: string };
  p1Input: string;
  p2Input: string;
  p1Points: string;
  p2Points: string;
  tiebreakP1: string;
  tiebreakP2: string;
  floorCurrentSets: { player1: number; player2: number } | null;
  floorValidationError: string | null;
  isMatchTiebreakSet: boolean;
  isPotentialMTSet: boolean;
  hasTiebreak: boolean;
  isSetTrulyCompleted: boolean;
  tiebreakComplete: boolean;
  partial: boolean;
  p1Val: number;
  p2Val: number;
  validationError?: string;
  onP1InputChange: (value: string) => void;
  onP2InputChange: (value: string) => void;
  onP1PointsChange: (value: string) => void;
  onP2PointsChange: (value: string) => void;
  onTiebreakP1Change: (value: string) => void;
  onTiebreakP2Change: (value: string) => void;
  matchAlreadyOver: boolean;
  matchWouldEnd: boolean;
  p1SetsWon: number;
  p2SetsWon: number;
  maxSets: number;
  showGamePointsAtZero: boolean;
  canConfirmSet: boolean;
  onConfirmSet: () => void;
}

export function SetInputForm(props: SetInputFormProps) {
  return <SetInputFormContent props={props} />;
}
