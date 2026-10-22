'use client';

import { useState, useEffect, useReducer, useCallback, useMemo } from 'react';
import type { RallyDetails } from '@/core/scoring/types';
import { formReducer, initialForm } from './point-details-logic';
import {
  getPointWinnerDetails,
  buildRallyDetails,
  usePointDetailsKeyboard,
} from './point-details-modal.logic';
import { usePointDetailsSectionRefs } from './use-point-details-section-refs';

export interface PointDetailsDoublesInfo {
  player1: { id: string; name: string };
  player1Partner?: { id: string; name: string } | null;
  player2: { id: string; name: string };
  player2Partner?: { id: string; name: string } | null;
  activeServerId?: string | null;
  activeReceiverId?: string | null;
  isDecidingPoint?: boolean;
}

interface UsePointDetailsModalOptions {
  winnerPlayerSide: 'player1' | 'player2';
  currentServer: 'player1' | 'player2';
  player1Name: string;
  player2Name: string;
  onConfirm: (details: RallyDetails, audio?: { blob: Blob; durationMs: number }) => void;
  onCancel: () => void;
  doubles?: PointDetailsDoublesInfo;
}

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

  const hitterCandidates = useMemo(() => {
    if (!doubles || !form.tipo) return [];
    const targetSide = form.tipo === 'winner'
      ? winnerPlayerSide
      : (winnerPlayerSide === 'player1' ? 'player2' : 'player1');

    const members = targetSide === 'player1'
      ? [doubles.player1, doubles.player1Partner]
      : [doubles.player2, doubles.player2Partner];

    return members.filter((m): m is { id: string; name: string } => Boolean(m));
  }, [doubles, form.tipo, winnerPlayerSide]);

  const receiverCandidates = useMemo(() => {
    if (!doubles?.isDecidingPoint) return [];
    const receiverSide = currentServer === 'player1' ? 'player2' : 'player1';
    const members = receiverSide === 'player1'
      ? [doubles.player1, doubles.player1Partner]
      : [doubles.player2, doubles.player2Partner];

    return members.filter((m): m is { id: string; name: string } => Boolean(m));
  }, [doubles, currentServer]);

  useEffect(() => {
    if (doubles?.isDecidingPoint && doubles.activeReceiverId && !form.receiverId) {
      dispatch({ type: 'SET_RECEIVER', value: doubles.activeReceiverId });
    }
  }, [doubles?.isDecidingPoint, doubles?.activeReceiverId, form.receiverId]);

  useEffect(() => {
    if (hitterCandidates.length > 0 && !form.hitterId) {
      if (form.situacao === 'devolucao' && doubles?.activeReceiverId && hitterCandidates.some(c => c.id === doubles.activeReceiverId)) {
        dispatch({ type: 'SET_HITTER', value: doubles.activeReceiverId });
      } else if (form.situacao === 'saque' && doubles?.activeServerId && hitterCandidates.some(c => c.id === doubles.activeServerId)) {
        dispatch({ type: 'SET_HITTER', value: doubles.activeServerId });
      }
    }
  }, [hitterCandidates, form.hitterId, form.situacao, doubles?.activeReceiverId, doubles?.activeServerId]);

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

  const persistNoteContent = useCallback((savedNoteText: string, audio?: { blob: Blob; durationMs: number }) => {
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
    hitterCandidates,
    receiverCandidates,
    cancelCurrentAction,
    canConfirm,
    confirmPointDetails,
    discardChanges,
    persistNoteContent,
  };
}
