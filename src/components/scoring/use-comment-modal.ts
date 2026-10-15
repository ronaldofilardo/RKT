import { useState, useCallback, useEffect, useRef } from 'react';
import { useNotesModal } from '@/hooks/useNotesModal';

interface UseCommentModalOptions {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string, audio?: { blob: Blob; durationMs: number }) => Promise<void> | void;
  initialText?: string;
}

/** Estado, efeitos e handlers do CommentModal (mount, foco, salvar, teclado, fechar). */
export function useCommentModal({ isOpen, onClose, onSave, initialText = '' }: UseCommentModalOptions) {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const notes = useNotesModal(500);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && initialText) {
      notes.setText(initialText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialText]);

  useEffect(() => {
    if (isOpen && mounted) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen, mounted]);

  const handleSave = useCallback(async () => {
    if (!notes.canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (notes.voiceRecorder.state === 'recording') {
        await notes.voiceRecorder.stopRecording();
      }
      const result = await notes.save();
      const savePromise = Promise.resolve(onSave(result.text, result.audio));
      await Promise.all([
        savePromise,
        new Promise((resolve) => setTimeout(resolve, 500)),
      ]);
      notes.clear();
      onClose();
    } catch {
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [notes, onSave, onClose, isSubmitting]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isSubmitting) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  }, [onClose, handleSave, isSubmitting]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    notes.clear();
    onClose();
  }, [notes, onClose, isSubmitting]);

  if (!isOpen || !mounted) return null;

  return { isSubmitting, notes, textareaRef, handleSave, handleClose, handleKeyDown };
}
