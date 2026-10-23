import { useCallback, useEffect } from 'react';
import type { RecorderState } from './voice-recorder.types';

interface VoiceRecorderLifecycleParams {
  audioUrl: string | null;
  streamRef: React.MutableRefObject<MediaStream | null>;
  timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  audioElementRef: React.MutableRefObject<HTMLAudioElement | null>;
  chunksRef: React.MutableRefObject<Blob[]>;
  setAudioBlob: (v: Blob | null) => void;
  setAudioUrl: (v: string | null) => void;
  setDurationMs: (v: number) => void;
  setError: (v: string | null) => void;
  setState: (v: RecorderState) => void;
}

export function useVoiceRecorderLifecycle(params: VoiceRecorderLifecycleParams) {
  const {
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
  } = params;

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, [streamRef]);

  const cleanupTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [timerRef]);

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
  }, [audioElementRef]);

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
  }, [stopPreview, cleanupTimer, cleanupStream, cleanupAudioUrl, chunksRef, setAudioBlob, setAudioUrl, setDurationMs, setError, setState]);

  useEffect(() => {
    return () => {
      stopPreview();
      cleanupTimer();
      cleanupStream();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [stopPreview, cleanupTimer, cleanupStream, audioUrl]);

  return { cleanupStream, cleanupTimer, stopPreview, clear };
}
