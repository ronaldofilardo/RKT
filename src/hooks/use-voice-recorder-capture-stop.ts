import { useCallback } from 'react';
import { PREFERRED_MIME, MAX_DURATION_MS, getSupportedMime } from './voice-recorder-support.logic';

interface VoiceRecorderCaptureStopParams {
  audioBlob: Blob | null;
  durationMs: number;
  cleanupTimer: () => void;
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  chunksRef: React.MutableRefObject<Blob[]>;
  startTimeRef: React.MutableRefObject<number>;
}

export function useVoiceRecorderCaptureStop(params: VoiceRecorderCaptureStopParams) {
  const {
    audioBlob,
    durationMs,
    cleanupTimer,
    mediaRecorderRef,
    chunksRef,
    startTimeRef,
  } = params;

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
  }, [audioBlob, durationMs, cleanupTimer, chunksRef, mediaRecorderRef, startTimeRef]);

  return { stopRecording };
}
