'use client';

import { useState, useRef, useCallback } from 'react';
import type { RecorderState, UseVoiceRecorderReturn } from './voice-recorder.types';
import { PREFERRED_MIME, MAX_DURATION_MS, getSupportedMime } from './voice-recorder-support.logic';
import { useVoiceRecorderLifecycle } from './use-voice-recorder-lifecycle';

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

  const startRecording = useCallback(async () => {
    clear();
    setError(null);

    const mime = getSupportedMime();
    if (!mime) {
      setError('Gravação de áudio não suportada neste navegador');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        const elapsed = Date.now() - startTimeRef.current;
        const cappedMs = Math.min(elapsed, MAX_DURATION_MS);

        setAudioBlob(blob);
        setDurationMs(cappedMs);
        setState('recorded');
        cleanupTimer();
        cleanupStream();
      };

      recorder.start(100);
      startTimeRef.current = Date.now();
      setState('recording');

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setDurationMs(elapsed);
        if (elapsed >= MAX_DURATION_MS) {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        }
      }, 200);
    } catch (err) {
      cleanupStream();
      cleanupTimer();
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Permissão de microfone negada');
      } else {
        setError('Erro ao acessar microfone');
      }
      setState('idle');
    }
  }, [clear, cleanupStream, cleanupTimer]);

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
