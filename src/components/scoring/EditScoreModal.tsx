'use client';

import { useMemo } from 'react';
import type { TennisFormat } from '@/core/scoring/types';
import type { SetEditData } from './editScoreHelpers';
import type { CompletedSet } from './edit-score-logic';
import { useEditScoreModal } from './useEditScoreModal';
import { EditScoreModalFooter } from './EditScoreModalFooter';
import { EditScoreModalShell } from './edit-score-modal-shell';
import { EditScoreModalContent } from './edit-score-modal-content';
import type { EditScoreModalContentProps } from './edit-score-modal-content';

type Player = 'player1' | 'player2';

interface EditScoreModalProps {
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

export function EditScoreModal({
  isOpen,
  matchFormat,
  playerNames,
  currentSets,
  currentServer,
  initialServer,
  completedSets = [],
  currentGamePoints,
  isTiebreak = false,
  floorCurrentSets = null,
  floorTiebreak,
  onConfirm,
  onCancel,
  onMatchFinished,
  onRefreshFloor,
}: EditScoreModalProps) {
  const effectiveFloorTiebreak = useMemo(() => {
    if (floorTiebreak !== undefined) return floorTiebreak;
    if (isTiebreak && currentGamePoints) {
      return {
        player1: Number(currentGamePoints.player1) || 0,
        player2: Number(currentGamePoints.player2) || 0,
      };
    }
    return null;
  }, [floorTiebreak, isTiebreak, currentGamePoints]);

  const {
    state,
    setState,
    confirmError,
    floorValidationError,
    isConfirming,
    calculations,
    handleGameInputChange,
    handleTiebreakInputChange,
    handleConfirm,
    handleCancel,
    handlePointsChange,
    handleEditCompletedSet,
    handleConfirmSet,
    canConfirmSet,
  } = useEditScoreModal(
    {
      isOpen,
      matchFormat,
      currentSets,
      currentServer,
      initialServer,
      completedSets: completedSets as CompletedSet[],
      currentGamePoints,
      isTiebreak,
      floorCurrentSets,
      floorTiebreak: effectiveFloorTiebreak,
      onRefreshFloor,
      playerNames,
    },
    onConfirm,
    onCancel,
    onMatchFinished
  );

  if (!isOpen) return null;

  return (
    <EditScoreModalShell isConfirming={isConfirming} matchFormat={matchFormat} onCancel={handleCancel}>
      <EditScoreModalContent
        matchFormat={matchFormat}
        playerNames={playerNames}
        currentServer={currentServer}
        completedSets={completedSets as CompletedSet[]}
        floorCurrentSets={floorCurrentSets}
        effectiveFloorTiebreak={effectiveFloorTiebreak}
        confirmError={confirmError}
        floorValidationError={floorValidationError}
        state={state}
        setState={setState as unknown as EditScoreModalContentProps['setState']}
        calculations={calculations}
        canConfirmSet={canConfirmSet}
        handlers={{
          handleGameInputChange,
          handleTiebreakInputChange,
          handlePointsChange,
          handleEditCompletedSet,
          handleConfirmSet,
        }}
      />

      <EditScoreModalFooter
        isConfirming={isConfirming}
        canConfirm={calculations.canConfirm}
        hasErrors={Boolean(confirmError || floorValidationError)}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </EditScoreModalShell>
  );
}
