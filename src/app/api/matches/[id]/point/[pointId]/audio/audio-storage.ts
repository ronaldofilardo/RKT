import { prisma } from '@/lib/prisma';

// Busca o registro do ponto (não anulado) com os campos da nota de áudio.
export function findAudioPointLog(matchId: string, pointId: string) {
  return prisma.pointLog.findFirst({
    where: { id: pointId, matchId, voidedAt: null },
    select: { audioNote: true, audioNoteMime: true, audioNoteDuration: true },
  });
}

// Confirma que o ponto existe (não anulado) antes de gravar o áudio.
export function requireExistingPointLog(matchId: string, pointId: string) {
  return prisma.pointLog.findFirst({
    where: { id: pointId, matchId, voidedAt: null },
    select: { id: true },
  });
}

// Persiste a nota de áudio no registro do ponto.
export function saveAudioNote(
  pointId: string,
  audioNote: Buffer,
  mime: string,
  durationMs: number,
) {
  return prisma.pointLog.update({
    where: { id: pointId },
    data: { audioNote, audioNoteMime: mime, audioNoteDuration: durationMs },
  });
}

// Remove a nota de áudio do registro do ponto.
export function clearAudioNote(pointId: string) {
  return prisma.pointLog.update({
    where: { id: pointId },
    data: { audioNote: null, audioNoteMime: null, audioNoteDuration: null },
  });
}
