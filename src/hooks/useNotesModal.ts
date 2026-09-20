'use client';

import { useState, useCallback } from 'react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

export interface NotesModalResult {
  text: string;
  audio?: { blob: Blob; durationMs: number };
}

export function useNotesModal(maxChars = 500) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const voiceRecorder = useVoiceRecorder();

  const hasContent = text.trim().length > 0 || voiceRecorder.state === 'recorded';

  const clear = useCallback(() => {
    setText('');
    setMode('text');
    voiceRecorder.clear();
  }, [voiceRecorder]);

  const save = useCallback(async (): Promise<NotesModalResult> => {
    let audio: NotesModalResult['audio'];

    if (voiceRecorder.state === 'recorded') {
      const result = await voiceRecorder.stopRecording();
      if (result) {
        audio = { blob: result.blob, durationMs: result.durationMs };
      }
    }

    const trimmed = text.trim();
    clear();
    return { text: trimmed, audio };
  }, [text, voiceRecorder, clear]);

  const canSubmit = hasContent;

  return {
    text,
    setText,
    mode,
    setMode,
    voiceRecorder,
    hasContent,
    canSubmit,
    clear,
    save,
    maxChars,
  };
}
