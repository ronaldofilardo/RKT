import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { clearAudioNote, findAudioPointLog, requireExistingPointLog, saveAudioNote } from './audio-storage';
import { normalizeMime, validateAudioUpload } from './audio-validation';

// Corpo do GET: devolve o áudio armazenado do ponto ou 404.
export async function getAudioResponse(matchId: string, pointId: string) {
  const pointLog = await findAudioPointLog(matchId, pointId);
  if (!pointLog || !pointLog.audioNote) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: 'Nota de áudio não encontrada' },
      { status: 404 }
    );
  }

  const mime = pointLog.audioNoteMime ?? 'audio/webm';
  const buffer = Buffer.from(pointLog.audioNote);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': mime,
      'Content-Length': String(buffer.length),
      'Cache-Control': 'public, max-age=86400',
      'X-Audio-Duration-Ms': String(pointLog.audioNoteDuration ?? 0),
    },
  });
}

// Corpo do POST: valida o upload, confirma o ponto e grava a nota de áudio.
export async function postAudioResponse(matchId: string, pointId: string, request: NextRequest) {
  const upload = await validateAudioUpload(request);
  if (!upload.ok) return upload.response;

  if (!(await requireExistingPointLog(matchId, pointId))) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: 'Ponto não encontrado' },
      { status: 404 }
    );
  }

  const audioBuffer = Buffer.from(await upload.data.file.arrayBuffer());
  const mime = normalizeMime(upload.data.file.type);

  await saveAudioNote(pointId, audioBuffer, mime, upload.data.durationMs);

  logger.log(`[AUDIO] Saved ${audioBuffer.length} bytes (${mime}) for point ${pointId}`);

  return NextResponse.json({
    ok: true,
    size: audioBuffer.length,
    mime,
    durationMs: upload.data.durationMs,
  });
}

// Corpo do DELETE: limpa a nota de áudio do ponto ou 404.
export async function deleteAudioResponse(matchId: string, pointId: string) {
  const pointLog = await findAudioPointLog(matchId, pointId);
  if (!pointLog || !pointLog.audioNote) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: 'Nota de áudio não encontrada' },
      { status: 404 }
    );
  }

  await clearAudioNote(pointId);

  logger.log(`[AUDIO] Deleted audio for point ${pointId}`);

  return new NextResponse(null, { status: 204 });
}
