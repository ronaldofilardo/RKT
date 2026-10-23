import { useCallback } from 'react';
import type { RecorderState } from './voice-recorder.types';
import { MAX_DURATION_MS, getSupportedMime } from './voice-recorder-support.logic';

interface VoiceRecorderCaptureStartParams {
  clear: () => void;
  cleanupStream: () => void;
  cleanupTimer: () => void;
  setError: (v: string | null) => void;
  setState: (v: RecorderState) => void;
  setAudioBlob: (v: Blob | null) => void;
  setDurationMs: (v: number) => void;
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  streamRef: React.MutableRefObject<MediaStream | null>;
  chunksRef: React.MutableRefObject<Blob[]>;
  timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  startTimeRef: React.MutableRefObject<number>;
}

export function useVoiceRecorderCaptureStart(params: VoiceRecorderCaptureStartParams) {
  const {
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
  } = params;

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
  }, [clear, cleanupStream, cleanupTimer, chunksRef, mediaRecorderRef, setAudioBlob, setDurationMs, setError, setState, startTimeRef, streamRef, timerRef]);

  return { startRecording };
}
