import type { TennisFormat } from '@/core/scoring/types';
import type { SetEditData } from './edit-score.logic';
import type { CompletedSet } from './edit-score-logic';

export type Player = 'player1' | 'player2';

export interface EditScoreModalProps {
  isOpen: boolean;
  matchFormat: TennisFormat;
  playerNames: { p1: string; p2: string };
  currentSets: { player1: number; player2: number };
  currentServer: Player;
  // Sacador do Game 1 de TODA a partida (fixo — normalmente derivado de
  // match.initialServerId). Usado como âncora para recalcular corretamente
  // o sacador do próximo set ao editar o placar. Se omitido, cai para
  // currentServer (comportamento anterior).
  initialServer?: Player;
  completedSets?: CompletedSet[];
  currentGamePoints?: { player1: number | string; player2: number | string };
  // Indica que currentGamePoints representa os pontos de um tie-break de
  // set já em andamento (e não os pontos de um game normal), para que o
  // modal pré-preencha o campo "Tie-Break" em vez de "Pontos no Game Atual".
  isTiebreak?: boolean;
  floorCurrentSets?: { player1: number; player2: number } | null;
  floorTiebreak?: { player1: number; player2: number } | null;
  onConfirm: (setResults: SetEditData[], server: Player) => void | Promise<void>;
  onCancel: () => void;
  onMatchFinished?: (winner: 'player1' | 'player2') => void;
  suspendedSession?: {
    bankScoreState?: {
      sets?: Array<{
        player1: number;
        player2: number;
        isTiebreak: boolean;
        tiebreakScore?: { player1: number; player2: number } | null;
      }>;
    } | null;
  } | null;
  onRefreshFloor?: () => Promise<{ player1: number; player2: number } | null>;
}

export interface EditScoreModalContentProps {
  matchFormat: TennisFormat;
  playerNames: { p1: string; p2: string };
  currentServer: Player;
  completedSets: CompletedSet[];
  floorCurrentSets: { player1: number; player2: number } | null;
  effectiveFloorTiebreak: { player1: number; player2: number } | null;
  confirmError: string | null;
  floorValidationError: string | null;
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
    handleGameInputChange: (v: string, setter: (val: string) => void, player: 'p1' | 'p2', other: string) => void;
    handleTiebreakInputChange: (v: string, player: 'p1' | 'p2') => void;
    handlePointsChange: (p1: string, p2: string) => void;
    handleEditCompletedSet: (index: number, p1Games: number, p2Games: number) => void;
    handleConfirmSet: () => void;
  };
}
