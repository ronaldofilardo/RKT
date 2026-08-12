'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

const PREFERRED_MIME = 'audio/webm;codecs=opus';
const FALLBACK_MIME = 'audio/mp4';
const MAX_DURATION_MS = 15_000;

type RecorderState = 'idle' | 'recording' | 'recorded';

interface UseVoiceRecorderReturn {
  state: RecorderState;
  audioBlob: Blob | null;
  audioUrl: string | null;
  durationMs: number;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  playPreview: () => void;
  stopPreview: () => void;
  clear: () => void;
}

function getSupportedMime(): string | null {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder !== 'function') return null;
  if (MediaRecorder.isTypeSupported(PREFERRED_MIME)) return PREFERRED_MIME;
  if (MediaRecorder.isTypeSupported(FALLBACK_MIME)) return FALLBACK_MIME;
  return null;
}

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

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const cleanupTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cleanupAudioUrl = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  }, [audioUrl]);

  const stopPreview = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      audioElementRef.current = null;
    }
  }, []);

  const clear = useCallback(() => {
    stopPreview();
    cleanupTimer();
    cleanupStream();
    cleanupAudioUrl();
    chunksRef.current = [];
    setAudioBlob(null);
    setAudioUrl(null);
    setDurationMs(0);
    setError(null);
    setState('idle');
  }, [stopPreview, cleanupTimer, cleanupStream, cleanupAudioUrl]);

  useEffect(() => {
    return () => {
      stopPreview();
      cleanupTimer();
      cleanupStream();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [stopPreview, cleanupTimer, cleanupStream, audioUrl]);

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

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

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
