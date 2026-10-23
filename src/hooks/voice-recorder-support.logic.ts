export const PREFERRED_MIME = 'audio/webm;codecs=opus';
export const FALLBACK_MIME = 'audio/mp4';
export const MAX_DURATION_MS = 15_000;

export function getSupportedMime(): string | null {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder !== 'function') return null;
  if (MediaRecorder.isTypeSupported(PREFERRED_MIME)) return PREFERRED_MIME;
  if (MediaRecorder.isTypeSupported(FALLBACK_MIME)) return FALLBACK_MIME;
  return null;
}
