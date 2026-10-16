'use client';

import { useState, useEffect, useReducer, useCallback } from 'react';
import type { RallyDetails } from '@/core/scoring/types';
import { formReducer, initialForm } from './point-details-logic';
import {
  getPointWinnerDetails,
  buildRallyDetails,
  usePointDetailsKeyboard,
} from './point-details-modal.logic';
import { usePointDetailsSectionRefs } from './use-point-details-section-refs';

interface UsePointDetailsModalOptions {
  winnerPlayerSide: 'player1' | 'player2';
  currentServer: 'player1' | 'player2';
  player1Name: string;
  player2Name: string;
  onConfirm: (details: RallyDetails, audio?: { blob: Blob; durationMs: number }) => void;
  onCancel: () => void;
}

export function usePointDetailsModal({
  winnerPlayerSide,
  currentServer,
  player1Name,
  player2Name,
  onConfirm,
  onCancel,
}: UsePointDetailsModalOptions) {
  const [mounted, setMounted] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteAudio, setNoteAudio] = useState<{ blob: Blob; durationMs: number } | undefined>();
  const [form, dispatch] = useReducer(formReducer, null, () => initialForm);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { vencedor, winnerName } = getPointWinnerDetails(
    winnerPlayerSide,
    currentServer,
    player1Name,
    player2Name
  );

  const refs = usePointDetailsSectionRefs(form, vencedor, mounted);

  const handleCancel = useCallback(() => {
    setShowCloseDialog(true);
  }, []);

  usePointDetailsKeyboard(mounted, handleCancel);

  const canConfirm = Boolean(form.situacao && form.tipo && form.golpe);

  const handleConfirm = useCallback(() => {
    const details = buildRallyDetails(form, vencedor, noteText);
    if (!details) return;
    onConfirm(details, noteAudio);
  }, [form, onConfirm, vencedor, noteText, noteAudio]);

  const handleDiscard = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleSaveNote = useCallback((savedNoteText: string, audio?: { blob: Blob; durationMs: number }) => {
    setNoteText(savedNoteText);
    setNoteAudio(audio);
  }, []);

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
    handleCancel,
    canConfirm,
    handleConfirm,
    handleDiscard,
    handleSaveNote,
  };
}
