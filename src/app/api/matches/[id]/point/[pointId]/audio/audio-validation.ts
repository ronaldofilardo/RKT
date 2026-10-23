import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_MIME_TYPES = new Set([
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/mp4',
  'audio/ogg',
  'audio/ogg;codecs=opus',
]);

const MAX_AUDIO_SIZE = 500 * 1024;
const MAX_DURATION_MS = 15_000;

export interface ValidAudioUpload {
  file: File;
  durationMs: number;
}

type UploadValidation =
  | { ok: true; data: ValidAudioUpload }
  | { ok: false; response: NextResponse };

function jsonError(error: string, message: string, status: number) {
  return NextResponse.json({ error, message }, { status });
}

// Reduz o mime reportado pelo navegador à família suportada (webm/mp4/ogg).
export function normalizeMime(raw: string): string {
  if (raw.startsWith('audio/webm')) return 'audio/webm';
  if (raw.startsWith('audio/mp4')) return 'audio/mp4';
  if (raw.startsWith('audio/ogg')) return 'audio/ogg';
  return raw;
}

// Valida o upload de áudio: multipart, arquivo, mime, tamanho e duração.
// Retorna os dados validados ou a resposta 400 correspondente.
export async function validateAudioUpload(request: NextRequest): Promise<UploadValidation> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return { ok: false, response: jsonError('INVALID_CONTENT_TYPE', 'Esperado multipart/form-data', 400) };
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const durationMsRaw = formData.get('durationMs');

  if (!(file instanceof File)) {
    return { ok: false, response: jsonError('MISSING_FILE', 'Campo "file" é obrigatório', 400) };
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      ok: false,
      response: jsonError(
        'INVALID_MIME',
        `Tipo "${file.type}" não suportado. Use: audio/webm, audio/mp4 ou audio/ogg`,
        400
      ),
    };
  }

  if (file.size > MAX_AUDIO_SIZE) {
    return {
      ok: false,
      response: jsonError(
        'FILE_TOO_LARGE',
        `Áudio deve ter no máximo ${MAX_AUDIO_SIZE / 1024}KB. Tamanho: ${Math.round(file.size / 1024)}KB`,
        400
      ),
    };
  }

  const durationMs = durationMsRaw ? parseInt(String(durationMsRaw), 10) : 0;
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return { ok: false, response: jsonError('INVALID_DURATION', 'Duração inválida', 400) };
  }
  if (durationMs > MAX_DURATION_MS) {
    return {
      ok: false,
      response: jsonError(
        'DURATION_TOO_LONG',
        `Duração máxima: ${MAX_DURATION_MS / 1000}s. Duração: ${Math.round(durationMs / 1000)}s`,
        400
      ),
    };
  }

  return { ok: true, data: { file, durationMs } };
}
