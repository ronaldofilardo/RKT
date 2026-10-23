'use client';

import { useState, useRef } from 'react';
import type { RecorderState, UseVoiceRecorderReturn } from './voice-recorder.types';
import { useVoiceRecorderLifecycle } from './use-voice-recorder-lifecycle';
import { useVoiceRecorderCaptureStart } from './use-voice-recorder-capture-start';
import { useVoiceRecorderCaptureStop } from './use-voice-recorder-capture-stop';
import { useVoiceRecorderPreview } from './use-voice-recorder-preview';

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

  const { stopRecording } = useVoiceRecorderCaptureStop({
    audioBlob,
    durationMs,
    cleanupTimer,
    mediaRecorderRef,
    chunksRef,
    startTimeRef,
  });

  const { playPreview } = useVoiceRecorderPreview({
    audioBlob,
    audioElementRef,
    stopPreview,
  });

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
