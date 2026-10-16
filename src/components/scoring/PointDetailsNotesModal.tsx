'use client';

import { useState } from 'react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { NoteVoiceControls } from './point-details-notes-voice-controls';
import { NoteModeTabs, NoteTextarea, NoteFooterButtons } from './point-details-notes-fields';

interface PointDetailsNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteText: string, audio?: { blob: Blob; durationMs: number }) => void;
}

export function PointDetailsNotesModal({
  isOpen,
  onClose,
  onSave,
}: PointDetailsNotesModalProps) {
  const [noteMode, setNoteMode] = useState<'text' | 'voice'>('text');
  const [noteText, setNoteText] = useState('');
  const voiceRecorder = useVoiceRecorder();

  const handleSave = async () => {
    let audioBlob = voiceRecorder.audioBlob;
    let durationMs = voiceRecorder.durationMs;

    if (voiceRecorder.state === 'recording') {
      const result = await voiceRecorder.stopRecording();
      if (result) {
        audioBlob = result.blob;
        durationMs = result.durationMs;
      }
    }

    const audio = audioBlob
      ? { blob: audioBlob, durationMs }
      : undefined;
    onSave(noteText.trim(), audio);
    setNoteText('');
    voiceRecorder.clear();
    onClose();
  };

  const handleClear = () => {
    setNoteText('');
    voiceRecorder.clear();
    onClose();
  };

  const hasContent = Boolean(noteText.trim() || voiceRecorder.audioBlob);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      role="button"
      tabIndex={-1}
      aria-label="Fechar observações"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div
        className="bg-telemetry-card rounded-2xl p-6 mx-4 w-[clamp(280px,80vw,420px)] shadow-2xl border border-white/10"
        role="dialog"
        aria-label="Observações do ponto"
        tabIndex={-1}
      >
        <h3 className="text-telemetry-text-primary font-bold text-center text-lg mb-1">Observações do Ponto</h3>
        <p className="text-telemetry-text-muted text-center text-sm mb-4">Registe detalhes importantes sobre este ponto</p>

        <NoteModeTabs noteMode={noteMode} onModeChange={setNoteMode} />

        {noteMode === 'text' ? (
          <NoteTextarea value={noteText} onChange={setNoteText} />
        ) : (
          <NoteVoiceControls recorder={voiceRecorder} />
        )}

        <NoteFooterButtons hasContent={hasContent} onSave={handleSave} onClear={handleClear} />
      </div>
    </div>
  );
}
