'use client';

import { createPortal } from 'react-dom';
import type { RallyDetailsWithAttribution } from '@/core/scoring/types';
import { WinnerInfo } from './WinnerInfo';
import { ModalActions } from './ModalActions';
import { SectionRenderer } from './SectionRenderer';
import { PointDetailsNotesModal } from './PointDetailsNotesModal';
import { usePointDetailsModal, type PointDetailsDoublesInfo } from './use-point-details-modal';

interface PointDetailsModalProps {
  winnerPlayerSide: 'player1' | 'player2';
  currentServer: 'player1' | 'player2';
  player1Name: string;
  player2Name: string;
  fontScale: number;
  onConfirm: (details: RallyDetailsWithAttribution, audio?: { blob: Blob; durationMs: number }) => void;
  onCancel: () => void;
  doubles?: PointDetailsDoublesInfo;
  howEnded?: import('@/core/scoring/rally.types').RallyTipo;
  whereWinner?: import('@/core/scoring/rally.types').RallySituacao;
}

export function PointDetailsModal(props: PointDetailsModalProps) {
  const { fontScale: _fontScale, ...modalArgs } = props;
  const {
    mounted, showNotesModal, setShowNotesModal, noteText, hasNoteAudio, form, dispatch, refs,
    vencedor, winnerName, hitterCandidates, receiverCandidates, cancelCurrentAction, canConfirm,
    confirmPointDetails, persistNoteContent,
  } = usePointDetailsModal(modalArgs);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="button"
      tabIndex={-1}
      aria-label="Fechar modal"
      onClick={(e) => { if (e.target === e.currentTarget) cancelCurrentAction(); }}
      onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') cancelCurrentAction(); }}
    >
      <div
        className="animate-[fadeInSlideUp_0.2s_ease-out] w-[clamp(280px,90vw,560px)] landscape:w-[clamp(320px,85vw,580px)] modal-max-w-tablet mx-4 rounded-[20px] shadow-2xl flex flex-col max-h-[90vh] landscape:max-h-[96vh]"
        style={{
          backgroundColor: 'var(--court-surface)',
          border: '1px solid rgb(var(--telemetry-border) / 0.1)',
          borderTop: '3px solid rgb(var(--telemetry-blue))',
          fontFamily: 'var(--font-main)',
          fontSize: `calc(var(--sb-scale) * 1em)`,
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes do ponto"
        tabIndex={-1}
      >
        <WinnerInfo vencedor={vencedor} winnerName={winnerName} />
        <SectionRenderer
          form={form} vencedor={vencedor} dispatch={dispatch} refs={refs}
          hitterCandidates={hitterCandidates} receiverCandidates={receiverCandidates}
          startSection={props.howEnded && props.whereWinner ? 3 : 1}
        />
        <ModalActions
          canConfirm={canConfirm} noteText={noteText} hasNoteAudio={hasNoteAudio}
          onConfirm={confirmPointDetails} onCancel={cancelCurrentAction}
          onOpenNotes={() => setShowNotesModal(true)}
        />
      </div>
      <PointDetailsNotesModal
        isOpen={showNotesModal} onClose={() => setShowNotesModal(false)}
        onSave={persistNoteContent}
      />
    </div>,
    document.body
  );
}
