export const ALLOWED_MIME_TYPES = new Set([
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/mp4',
  'audio/ogg',
  'audio/ogg;codecs=opus',
]);

export const MAX_AUDIO_SIZE = 500 * 1024;
export const MAX_DURATION_MS = 15_000;

export function normalizeMime(raw: string): string {
  if (raw.startsWith('audio/webm')) return 'audio/webm';
  if (raw.startsWith('audio/mp4')) return 'audio/mp4';
  if (raw.startsWith('audio/ogg')) return 'audio/ogg';
  return raw;
}

export function parseDuration(durationMsRaw: FormDataEntryValue | null): number {
  return durationMsRaw ? parseInt(String(durationMsRaw), 10) : 0;
}

export function getDurationError(durationMs: number): { error: string; message: string } | null {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return { error: 'INVALID_DURATION', message: 'Duração inválida' };
  }
  if (durationMs > MAX_DURATION_MS) {
    return {
      error: 'DURATION_TOO_LONG',
      message: `Duração máxima: ${MAX_DURATION_MS / 1000}s. Duração: ${Math.round(durationMs / 1000)}s`,
    };
  }
  return null;
}
