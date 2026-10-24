import { useRef, useEffect } from 'react';
import type { TennisFormat } from '@/core/scoring/types';
import { EditScoreMatchOverCard } from './edit-score-form-header';
import { EditScoreFormBody } from './edit-score-form-body';

export interface SetInputFormProps {
  matchFormat: TennisFormat;
  totalEditedSets: number;
  currentServer: 'player1' | 'player2';
  playerNames: { p1: string; p2: string };
  p1Input: string;
  p2Input: string;
  p1Points: string;
  p2Points: string;
  tiebreakP1: string;
  tiebreakP2: string;
  floorCurrentSets: { player1: number; player2: number } | null;
  floorTiebreak?: { player1: number; player2: number } | null;
  floorValidationError: string | null;
  currentGamePoints?: { player1: number | string; player2: number | string };
  isMatchTiebreakSet: boolean;
  isPotentialMTSet: boolean;
  hasTiebreak: boolean;
  isSetTrulyCompleted: boolean;
  tiebreakComplete: boolean;
  tiebreakImpossible: boolean;
  partial: boolean;
  p1Val: number;
  p2Val: number;
  validationError?: string;
  onP1InputChange: (value: string) => void;
  onP2InputChange: (value: string) => void;
  onP1PointsChange: (value: string) => void;
  onP2PointsChange: (value: string) => void;
  onTiebreakInputChange: (value: string, player: 'p1' | 'p2') => void;
  matchAlreadyOver: boolean;
  matchWouldEnd: boolean;
  p1SetsWon: number;
  p2SetsWon: number;
  maxSets: number;
  showGamePointsAtZero: boolean;
  canConfirmSet: boolean;
  onConfirmSet: () => void;
  currentScoreBelowOriginal?: boolean;
}

export function SetInputForm(props: SetInputFormProps) {
  const isMatchOver = props.matchAlreadyOver || props.totalEditedSets >= props.maxSets;
  const p1InputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    p1InputRef.current?.focus();
  }, []);

  if (isMatchOver) {
    return <EditScoreMatchOverCard />;
  }

  return <EditScoreFormBody props={props} isMatchOver={isMatchOver} p1InputRef={p1InputRef} />;
}
