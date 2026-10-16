'use client';

import { createPortal } from 'react-dom';
import type { RallyDetails } from '@/core/scoring/types';
import { WinnerInfo } from './WinnerInfo';
import { ModalActions } from './ModalActions';
import { SectionRenderer } from './SectionRenderer';
import { PointDetailsNotesModal } from './PointDetailsNotesModal';
import { PointDetailsCloseDialog } from './PointDetailsCloseDialog';
import { usePointDetailsModal } from './use-point-details-modal';

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
  const {
    mounted, showCloseDialog, setShowCloseDialog, showNotesModal, setShowNotesModal,
    noteText, hasNoteAudio, form, dispatch, refs, vencedor, winnerName,
    handleCancel, canConfirm, handleConfirm, handleDiscard, handleSaveNote,
  } = usePointDetailsModal({ winnerPlayerSide, currentServer, player1Name, player2Name, onConfirm, onCancel });

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: '-webkit-backdrop-filter blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      role="button"
      tabIndex={-1}
      aria-label="Fechar modal"
      onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
      onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') handleCancel(); }}
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
        <SectionRenderer form={form} vencedor={vencedor} dispatch={dispatch} refs={refs} />
        <ModalActions
          canConfirm={canConfirm}
          noteText={noteText}
          hasNoteAudio={hasNoteAudio}
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
