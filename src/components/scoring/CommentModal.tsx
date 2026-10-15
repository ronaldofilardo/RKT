'use client';

import { createPortal } from 'react-dom';
import { useCommentModal } from './use-comment-modal';
import { CommentModalBody } from './comment-modal-body';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string, audio?: { blob: Blob; durationMs: number }) => Promise<void> | void;
  initialText?: string;
  title?: string;
}

export function CommentModal({
  isOpen,
  onClose,
  onSave,
  initialText = '',
  title = 'Novo Comentário',
}: CommentModalProps) {
  const modal = useCommentModal({ isOpen, onClose, onSave, initialText });

  if (!modal) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2100] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      role="button"
      tabIndex={-1}
      aria-label="Fechar comentário"
      onClick={(e) => { if (!modal.isSubmitting && e.target === e.currentTarget) modal.handleClose(); }}
      onKeyDown={modal.handleKeyDown}
    >
      <CommentModalBody
        title={title}
        isSubmitting={modal.isSubmitting}
        notes={modal.notes}
        textareaRef={modal.textareaRef}
        onSave={modal.handleSave}
        onClose={modal.handleClose}
      />
    </div>,
    document.body,
  );
}
