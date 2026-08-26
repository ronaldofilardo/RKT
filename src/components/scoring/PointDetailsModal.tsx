'use client';

import { useState, useEffect, useReducer, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { RallyDetails } from '@/core/scoring/types';
import {
  formReducer,
  initialForm,
  type Vencedor,
} from './point-details-logic';
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
  const [form, dispatch] = useReducer(formReducer, null, () => initialForm);

  const tipoRef = useRef<HTMLDivElement>(null);
  const golpeRef = useRef<HTMLDivElement>(null);
  const duracaoRef = useRef<HTMLDivElement>(null);
  const subtipo1Ref = useRef<HTMLDivElement>(null);
  const subtipo2Ref = useRef<HTMLDivElement>(null);
  const efeitoRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const vencedor: Vencedor = winnerPlayerSide === currentServer ? 'sacador' : 'devolvedor';
  const winnerName = winnerPlayerSide === 'player1' ? player1Name : player2Name;

  usePointDetailsScroll({
    form,
    vencedor,
    mounted,
    containerRef,
    tipoRef,
    golpeRef,
    duracaoRef,
    subtipo1Ref,
    subtipo2Ref,
    efeitoRef,
  });

  useEffect(() => {
    if (!mounted) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowCloseDialog(true);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mounted]);

  const canConfirm = form.golpe != null;

  const handleConfirm = useCallback(() => {
    if (!form.situacao || !form.tipo || !form.golpe) return;
    const isDevolucao = form.situacao === 'devolucao';
    const textNote = noteText.trim() || undefined;
    onConfirm({
      vencedor,
      situacao: form.situacao,
      tipo: form.tipo,
      golpe: form.golpe,
      subtipo1: form.subtipo1 ?? undefined,
      subtipo2: form.subtipo2 ?? undefined,
      duracao: form.duracao ?? undefined,
      efeito: form.efeito ?? undefined,
      direcao: form.direcao ?? undefined,
      golpe_esp: form.golpeEsp ?? undefined,
      previewBalls: isDevolucao ? 2 : 1,
      note: textNote,
    }, undefined);
  }, [form, onConfirm, vencedor, noteText]);

  const handleCancel = useCallback(() => {
    setShowCloseDialog(true);
  }, []);

  const handleDiscard = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleSaveNote = useCallback((savedNoteText: string) => {
    setNoteText(savedNoteText);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: '-webkit-backdrop-filter blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
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
        className="animate-[fadeInSlideUp_0.2s_ease-out] w-[clamp(260px,80vw,480px)] modal-max-w-tablet mx-4 rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_30px_rgba(59,130,246,0.15)] flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: 'var(--court-surface)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderTop: '3px solid #3b82f6',
          fontFamily: 'var(--font-main)',
          fontSize: `calc(var(--sb-scale) * 1em)`,
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
            subtipo2Ref,
            efeitoRef,
          }}
        />

        <ModalActions
          canConfirm={canConfirm}
          noteText={noteText}
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