export type RecorderState = 'idle' | 'recording' | 'recorded';

export interface UseVoiceRecorderReturn {
  state: RecorderState;
  audioBlob: Blob | null;
  audioUrl: string | null;
  durationMs: number;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<{ blob: Blob; durationMs: number } | null>;
  playPreview: () => void;
  stopPreview: () => void;
  clear: () => void;
}
