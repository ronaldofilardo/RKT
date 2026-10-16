'use client';

import type { useNotesModal } from '@/hooks/useNotesModal';
import { CommentSubmittingOverlay, CommentTextInput } from './comment-modal-views';
import { CommentVoiceRecorderView } from './comment-voice-recorder';

interface CommentModalBodyProps {
  title: string;
  isSubmitting: boolean;
  notes: ReturnType<typeof useNotesModal>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onSave: () => void;
  onClose: () => void;
}

/** Diálogo do modal: overlay, título, abas texto/voz, conteúdo e botões de ação. */
export function CommentModalBody({
  title,
  isSubmitting,
  notes,
  textareaRef,
  onSave,
  onClose,
}: CommentModalBodyProps) {
  return (
    <div
      className="relative bg-telemetry-elevated rounded-[20px] p-6 mx-4 w-[clamp(280px,80vw,420px)] shadow-2xl border border-white/10 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
    >
      {isSubmitting && <CommentSubmittingOverlay />}

      <h3 className="text-white font-bold text-center text-lg mb-1">{title}</h3>
      <p className="text-telemetry-text-muted text-center text-sm mb-4">Registe um comentário sobre a partida</p>

      <div role="tablist" aria-label="Modo de comentário" className="flex rounded-xl bg-white/5 border border-white/10 p-0.5 mb-4">
        <button
          role="tab"
          aria-selected={notes.mode === 'text'}
          onClick={() => notes.setMode('text')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
            notes.mode === 'text'
              ? 'bg-blue-600 text-white shadow'
              : 'text-telemetry-text-muted hover:text-white'
          }`}
        >
          📝 Texto
        </button>
        <button
          role="tab"
          aria-selected={notes.mode === 'voice'}
          onClick={() => notes.setMode('voice')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
            notes.mode === 'voice'
              ? 'bg-green-600 text-white shadow'
              : 'text-telemetry-text-muted hover:text-white'
          }`}
        >
          🎤 Voz
        </button>
      </div>

      {notes.mode === 'text' ? (
        <CommentTextInput
          textareaRef={textareaRef}
          text={notes.text}
          maxChars={notes.maxChars}
          onChange={notes.setText}
        />
      ) : (
        <CommentVoiceRecorderView recorder={notes.voiceRecorder} />
      )}

      <div className="flex flex-col gap-2 mt-4">
        <button
          onClick={onSave}
          disabled={!notes.canSubmit || isSubmitting}
          className={`w-full py-2.5 rounded-xl font-bold transition-all text-sm ${
            notes.canSubmit && !isSubmitting
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-900/40 text-blue-300/40 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Comentário'}
        </button>
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className={`w-full py-2.5 rounded-xl bg-transparent font-bold border border-white/10 transition-all text-sm ${
            isSubmitting
              ? 'text-telemetry-text-muted border-white/5 cursor-not-allowed'
              : 'text-telemetry-text-muted hover:bg-white/10 hover:text-white'
          }`}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
