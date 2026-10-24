'use client';

import { useState, useCallback } from 'react';

export function usePointDetailsNote() {
  const [noteText, setNoteText] = useState('');
  const [noteAudio, setNoteAudio] = useState<{ blob: Blob; durationMs: number } | undefined>();

  const persistNoteContent = useCallback((savedNoteText: string, audio?: { blob: Blob; durationMs: number }) => {
    setNoteText(savedNoteText);
    setNoteAudio(audio);
  }, []);

  return { noteText, noteAudio, persistNoteContent };
}
