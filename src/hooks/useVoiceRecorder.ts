'use client';

import { useState, useRef, useCallback } from 'react';
import type { RecorderState, UseVoiceRecorderReturn } from './voice-recorder.types';
import { PREFERRED_MIME, MAX_DURATION_MS, getSupportedMime } from './voice-recorder-support.logic';
import { useVoiceRecorderLifecycle } from './use-voice-recorder-lifecycle';
import { useVoiceRecorderCaptureStart } from './use-voice-recorder-capture-start';

export type { RecorderState, UseVoiceRecorderReturn } from './voice-recorder.types';
export { PREFERRED_MIME, FALLBACK_MIME, MAX_DURATION_MS, getSupportedMime } from './voice-recorder-support.logic';

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [state, setState] = useState<RecorderState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const { cleanupStream, cleanupTimer, stopPreview, clear } = useVoiceRecorderLifecycle({
    audioUrl,
    streamRef,
    timerRef,
    audioElementRef,
    chunksRef,
    setAudioBlob,
    setAudioUrl,
    setDurationMs,
    setError,
    setState,
  });

  const { startRecording } = useVoiceRecorderCaptureStart({
    clear,
    cleanupStream,
    cleanupTimer,
    setError,
    setState,
    setAudioBlob,
    setDurationMs,
    mediaRecorderRef,
    streamRef,
    chunksRef,
    timerRef,
    startTimeRef,
  });

  const stopRecording = useCallback((): Promise<{ blob: Blob; durationMs: number } | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state !== 'recording') {
        if (audioBlob) {
          resolve({ blob: audioBlob, durationMs });
        } else {
          resolve(null);
        }
        return;
      }

      cleanupTimer();
      const origOnStop = recorder.onstop;
      recorder.onstop = (e) => {
        if (origOnStop) {
          origOnStop.call(recorder, e);
        }
        const mime = recorder.mimeType || getSupportedMime() || PREFERRED_MIME;
        const blob = new Blob(chunksRef.current, { type: mime });
        const elapsed = Date.now() - startTimeRef.current;
        const cappedMs = Math.min(elapsed, MAX_DURATION_MS);
        resolve({ blob, durationMs: cappedMs });
      };

      recorder.stop();
    });
  }, [audioBlob, durationMs, cleanupTimer]);

  const playPreview = useCallback(() => {
    if (!audioBlob) return;

    stopPreview();

    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);
    audioElementRef.current = audio;

    audio.onended = () => {
      URL.revokeObjectURL(url);
      audioElementRef.current = null;
    };

    audio.play().catch(() => {
      URL.revokeObjectURL(url);
      audioElementRef.current = null;
    });
  }, [audioBlob, stopPreview]);

  return {
    state,
    audioBlob,
    audioUrl,
    durationMs,
    error,
    startRecording,
    stopRecording,
    playPreview,
    stopPreview,
    clear,
  };
}
