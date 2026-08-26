import { NextResponse } from 'next/server';
import { ALLOWED_MIME_TYPES, MAX_AUDIO_SIZE, getDurationError, parseDuration } from './route.helpers';

type ValidUpload = { file: File; rawMime: string; durationMs: number };
type ValidationResult = ValidUpload | { response: NextResponse };

export async function validateAudioUpload(request: Request): Promise<ValidationResult> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) return { response: NextResponse.json({ error: 'INVALID_CONTENT_TYPE', message: 'Esperado multipart/form-data' }, { status: 400 }) };
  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return { response: NextResponse.json({ error: 'MISSING_FILE', message: 'Campo "file" é obrigatório' }, { status: 400 }) };
  const rawMime = file.type;
  if (!ALLOWED_MIME_TYPES.has(rawMime)) return { response: NextResponse.json({ error: 'INVALID_MIME', message: `Tipo "${rawMime}" não suportado. Use: audio/webm, audio/mp4 ou audio/ogg` }, { status: 400 }) };
  if (file.size > MAX_AUDIO_SIZE) return { response: NextResponse.json({ error: 'FILE_TOO_LARGE', message: `Áudio deve ter no máximo ${MAX_AUDIO_SIZE / 1024}KB. Tamanho: ${Math.round(file.size / 1024)}KB` }, { status: 400 }) };
  const durationMs = parseDuration(formData.get('durationMs'));
  const durationError = getDurationError(durationMs);
  if (durationError) return { response: NextResponse.json(durationError, { status: 400 }) };
  return { file, rawMime, durationMs };
}

export function isValidUpload(result: ValidationResult): result is ValidUpload { return 'file' in result; }
