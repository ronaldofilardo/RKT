'use client';

import { useState, useEffect, useReducer, useCallback } from 'react';
import { formReducer, initialForm } from './point-details-logic';
import {
  getPointWinnerDetails,
  buildRallyDetails,
  usePointDetailsKeyboard,
} from './point-details-modal.logic';
import { usePointDetailsSectionRefs } from './use-point-details-section-refs';
import type { UsePointDetailsModalOptions } from './use-point-details-modal.types';
import { usePointDetailsNote } from './use-point-details-note';
import {
  useHitterCandidates,
  useReceiverCandidates,
  useDoublesReceiverDefault,
  useDoublesHitterDefault,
} from './point-details-doubles-candidates.logic';

export type { PointDetailsDoublesInfo } from './use-point-details-modal.types';

export function usePointDetailsModal({
  winnerPlayerSide,
  currentServer,
  player1Name,
  player2Name,
  onConfirm,
  onCancel,
  doubles,
}: UsePointDetailsModalOptions) {
  const [mounted, setMounted] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [form, dispatch] = useReducer(formReducer, null, () => initialForm);
  const { noteText, noteAudio, persistNoteContent } = usePointDetailsNote();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { vencedor, winnerName } = getPointWinnerDetails(
    winnerPlayerSide,
    currentServer,
    player1Name,
    player2Name
  );

  const hitterCandidates = useHitterCandidates(doubles, form, winnerPlayerSide);
  const receiverCandidates = useReceiverCandidates(doubles, currentServer);

  useDoublesReceiverDefault(doubles, form, dispatch);
  useDoublesHitterDefault(doubles, form, hitterCandidates, dispatch);

  const refs = usePointDetailsSectionRefs(form, vencedor, mounted);

  const cancelCurrentAction = useCallback(() => {
    setShowCloseDialog(true);
  }, []);

  usePointDetailsKeyboard(mounted, cancelCurrentAction);

  const canConfirm = Boolean(form.situacao && form.tipo && form.golpe);

  const confirmPointDetails = useCallback(() => {
    const details = buildRallyDetails(form, vencedor, noteText);
    if (!details) return;
    onConfirm(details, noteAudio);
  }, [form, onConfirm, vencedor, noteText, noteAudio]);

  const discardChanges = useCallback(() => {
    onCancel();
  }, [onCancel]);

  return {
    mounted,
    showCloseDialog,
    setShowCloseDialog,
    showNotesModal,
    setShowNotesModal,
    noteText,
    hasNoteAudio: Boolean(noteAudio),
    form,
    dispatch,
    refs,
    vencedor,
    winnerName,
    hitterCandidates,
    receiverCandidates,
    cancelCurrentAction,
    canConfirm,
    confirmPointDetails,
    discardChanges,
    persistNoteContent,
  };
}
