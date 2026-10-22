'use client';

import { createPortal } from 'react-dom';
import type { RallyDetails } from '@/core/scoring/types';
import { WinnerInfo } from './WinnerInfo';
import { ModalActions } from './ModalActions';
import { SectionRenderer } from './SectionRenderer';
import { PointDetailsNotesModal } from './PointDetailsNotesModal';
import { PointDetailsCloseDialog } from './PointDetailsCloseDialog';
import { usePointDetailsModal, type PointDetailsDoublesInfo } from './use-point-details-modal';

interface PointDetailsModalProps {
  winnerPlayerSide: 'player1' | 'player2';
  currentServer: 'player1' | 'player2';
  player1Name: string;
  player2Name: string;
  fontScale: number;
  onConfirm: (details: RallyDetails, audio?: { blob: Blob; durationMs: number }) => void;
  onCancel: () => void;
  doubles?: PointDetailsDoublesInfo;
}

export function PointDetailsModal({
  winnerPlayerSide,
  currentServer,
  player1Name,
  player2Name,
  fontScale: _fontScale,
  onConfirm,
  onCancel,
  doubles,
}: PointDetailsModalProps) {
  const {
    mounted, showCloseDialog, setShowCloseDialog, showNotesModal, setShowNotesModal,
    noteText, hasNoteAudio, form, dispatch, refs, vencedor, winnerName,
    hitterCandidates, receiverCandidates,
    cancelCurrentAction, canConfirm, confirmPointDetails, discardChanges, persistNoteContent,
  } = usePointDetailsModal({ winnerPlayerSide, currentServer, player1Name, player2Name, onConfirm, onCancel, doubles });

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
        className="animate-[fadeInSlideUp_0.2s_ease-out] w-[clamp(260px,80vw,480px)] modal-max-w-tablet mx-4 rounded-[20px] shadow-2xl flex flex-col max-h-[90vh]"
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
          form={form}
          vencedor={vencedor}
          dispatch={dispatch}
          refs={refs}
          hitterCandidates={hitterCandidates}
          receiverCandidates={receiverCandidates}
        />
        <ModalActions
          canConfirm={canConfirm}
          noteText={noteText}
          hasNoteAudio={hasNoteAudio}
          onConfirm={confirmPointDetails}
          onCancel={cancelCurrentAction}
          onOpenNotes={() => setShowNotesModal(true)}
        />
      </div>
      <PointDetailsCloseDialog
        isOpen={showCloseDialog}
        onClose={() => setShowCloseDialog(false)}
        onDiscard={discardChanges}
      />
      <PointDetailsNotesModal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        onSave={persistNoteContent}
      />
    </div>,
    document.body
  );
}
