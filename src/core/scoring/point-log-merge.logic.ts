import type { TimelinePoint } from './types';
import type { PointLogRow } from './point-log-row.types';

/**
 * Sobrescreve as anotações de um `TimelinePoint` (gerado pelo engine
 * simulado ou pelo history persistido) com os dados frescos do PointLog.
 * O PointLog é a fonte de verdade pós-gravação para rallyDetails, firstFault,
 * note e áudio.
 */
export function mergeWithPointLog(
  p: TimelinePoint,
  log: PointLogRow,
  pointNumber: number,
): TimelinePoint {
  const ann = log.annotations;
  const rallyDetails = ann?.rallyDetails ?? p.rallyDetails ?? null;
  const firstFaultDetail = ann?.firstFaultDetail ?? p.firstFault ?? null;
  const rallyLength = ann?.rallyLength ?? p.rallyLength;

  const isSecondServe =
    log.type === 'DOUBLE_FAULT' ||
    Boolean(firstFaultDetail) ||
    ann?.isSecondServe === true ||
    ann?.isFirstServe === false ||
    p.isSecondServe === true ||
    p.isFirstServe === false;
  const isFirstServe = !isSecondServe;

  // `note` é extraída exclusivamente das annotations persistidas do PointLog:
  // 1. annotations.note (campo raiz — path moderno, adicionado na V2)
  // 2. rallyDetails.note (path legado — nota embutida dentro do rallyDetails)
  // NÃO usamos `p.note` como fallback: o TimelinePoint `p` vem do engine
  // simulado e pode carregar nota residual de um ponto anterior, causando
  // "troca" de observações na tabela.
  const note = ann != null
    ? (ann.note ?? rallyDetails?.note ?? undefined)
    : undefined;

  const firstServeOutcome = log.type === 'ACE' && isFirstServe
    ? 'ace'
    : firstFaultDetail?.errorType === 'out'
      ? 'out'
      : firstFaultDetail?.errorType === 'net'
        ? 'net'
        : null;

  const secondServeOutcome = log.type === 'ACE' && isSecondServe
    ? 'ace'
    : log.type === 'DOUBLE_FAULT'
      ? (rallyDetails?.subtipo2 as 'out' | 'net' | undefined) ?? null
      : null;

  return {
    ...p,
    pointNumber,
    sequenceNumber: log.sequenceNumber ?? pointNumber,
    clientEventId: log.clientEventId ?? undefined,
    recordedAt: log.timestamp.toISOString(),
    zone: ann?.zone,
    stroke: ann?.stroke,
    pointId: log.id,
    rawAnnotations: ann ? { ...ann } : p.rawAnnotations,
    isFirstServe,
    isSecondServe,
    rallyDetails,
    rallyLength,
    note,
    firstFault: firstFaultDetail,
    firstServeOutcome,
    secondServeOutcome,
    hasAudioNote: Boolean(log.hasAudioNote ?? (log.audioNoteDuration != null || log.audioNoteMime != null)),
    audioNoteDuration: log.audioNoteDuration ?? undefined,
    serverId: log.serverId ?? ann?.serverId ?? p.serverId,
    receiverId: (log.receiverId ?? ann?.receiverId ?? p.receiverId) || undefined,
    courtSide: ((log.courtSide ?? ann?.courtSide ?? p.courtSide) as 'deuce' | 'ad' | undefined) || undefined,
    hitterId: (log.hitterId ?? ann?.hitterId ?? p.hitterId) || undefined,
    pointDetails: {
      ...p.pointDetails,
      isFirstServe,
      isSecondServe,
      rallyDetails,
      rallyLength,
      firstFaultDetail,
      serverId: log.serverId ?? ann?.serverId ?? p.serverId,
      receiverId: (log.receiverId ?? ann?.receiverId ?? p.receiverId) || undefined,
      courtSide: ((log.courtSide ?? ann?.courtSide ?? p.courtSide) as 'deuce' | 'ad' | undefined) || undefined,
      hitterId: (log.hitterId ?? ann?.hitterId ?? p.hitterId) || undefined,
    },
  };
}
