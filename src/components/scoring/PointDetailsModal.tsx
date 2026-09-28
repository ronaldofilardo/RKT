'use client';

import { useState, useEffect, useReducer, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { RallyDetails } from '@/core/scoring/types';
import {
  formReducer,
  initialForm,
} from './point-details-logic';
import {
  getPointWinnerDetails,
  buildRallyDetails,
  usePointDetailsKeyboard,
} from './point-details-modal.helpers';
import { WinnerInfo } from './WinnerInfo';
import { ModalActions } from './ModalActions';
import { SectionRenderer } from './SectionRenderer';
import { PointDetailsNotesModal } from './PointDetailsNotesModal';
import { PointDetailsCloseDialog } from './PointDetailsCloseDialog';
import { usePointDetailsScroll } from './usePointDetailsScroll';

interface PointDetailsModalProps {
  winnerPlayerSide: 'player1' | 'player2';
  currentServer: 'player1' | 'player2';
  player1Name: string;
  player2Name: string;
  fontScale: number;
  onConfirm: (details: RallyDetails, audio?: { blob: Blob; durationMs: number }) => void;
  onCancel: () => void;
}

export function PointDetailsModal({
  winnerPlayerSide,
  currentServer,
  player1Name,
  player2Name,
  fontScale: _fontScale,
  onConfirm,
  onCancel,
}: PointDetailsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteAudio, setNoteAudio] = useState<{ blob: Blob; durationMs: number } | undefined>();
  const [form, dispatch] = useReducer(formReducer, null, () => initialForm);

  const tipoRef = useRef<HTMLDivElement>(null);
  const golpeRef = useRef<HTMLDivElement>(null);
  const duracaoRef = useRef<HTMLDivElement>(null);
  const subtipo1Ref = useRef<HTMLDivElement>(null);
  const efeitoRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { vencedor, winnerName } = getPointWinnerDetails(
    winnerPlayerSide,
    currentServer,
    player1Name,
    player2Name
  );

  usePointDetailsScroll({
    form,
    vencedor,
    mounted,
    containerRef,
    tipoRef,
    golpeRef,
    duracaoRef,
    subtipo1Ref,
    efeitoRef,
  });

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

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      role="button"
      tabIndex={-1}
      aria-label="Fechar modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || e.key === 'Enter') handleCancel();
      }}
    >
      <div
        className="animate-[fadeInSlideUp_0.2s_ease-out] w-[clamp(260px,80vw,480px)] modal-max-w-tablet mx-4 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] bg-telemetry-card border border-white/10"
        style={{
          fontSize: `${_fontScale * 100}%`,
        }}
        role="dialog"
        aria-label="Detalhes do ponto"
        tabIndex={-1}
      >
        <WinnerInfo vencedor={vencedor} winnerName={winnerName} />

        <SectionRenderer
          form={form}
          vencedor={vencedor}
          dispatch={dispatch}
          refs={{
            tipoRef,
            golpeRef,
            duracaoRef,
            subtipo1Ref,
            efeitoRef,
          }}
        />

        <ModalActions
          canConfirm={canConfirm}
          noteText={noteText}
          hasNoteAudio={Boolean(noteAudio)}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onOpenNotes={() => setShowNotesModal(true)}
        />
      </div>

      <PointDetailsCloseDialog
        isOpen={showCloseDialog}
        onClose={() => setShowCloseDialog(false)}
        onDiscard={handleDiscard}
      />

      <PointDetailsNotesModal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        onSave={handleSaveNote}
      />
    </div>,
    document.body
  );
}