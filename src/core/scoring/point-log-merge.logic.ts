import type { TimelinePoint } from './types';
import type { PointLogRow } from './point-log-row.types';
import { resolveServeOutcomes } from './point-log-serve.logic';

function resolveActor(logV?: string | null, annV?: string | null, pV?: string | null): string | undefined {
  return (logV ?? annV ?? pV) || undefined;
}

function resolveAudioFlags(log: PointLogRow) {
  const hasAudioNote = Boolean(log.hasAudioNote ?? (log.audioNoteDuration != null || log.audioNoteMime != null));
  return { hasAudioNote, audioNoteDuration: log.audioNoteDuration ?? undefined };
}

function resolveNote(ann: PointLogRow['annotations'], rallyDetails: TimelinePoint['rallyDetails']): string | undefined {
  if (!ann) return undefined;
  return ann.note ?? rallyDetails?.note ?? undefined;
}

function resolveRallyMeta(ann: PointLogRow['annotations'], p: TimelinePoint) {
  const rallyDetails = ann?.rallyDetails ?? p.rallyDetails ?? null;
  const firstFaultDetail = ann?.firstFaultDetail ?? p.firstFault ?? null;
  const rallyLength = ann?.rallyLength ?? p.rallyLength;
  return { rallyDetails, firstFaultDetail, rallyLength };
}

export function mergeWithPointLog(
  p: TimelinePoint,
  log: PointLogRow,
  pointNumber: number,
): TimelinePoint {
  const ann = log.annotations;
  const { rallyDetails, firstFaultDetail, rallyLength } = resolveRallyMeta(ann, p);

  const { isFirstServe, isSecondServe, firstServeOutcome, secondServeOutcome } =
    resolveServeOutcomes(log, ann, p, firstFaultDetail, rallyDetails);

  const note = resolveNote(ann, rallyDetails);
  const { hasAudioNote, audioNoteDuration } = resolveAudioFlags(log);

  const serverId = log.serverId ?? ann?.serverId ?? p.serverId;
  const receiverId = resolveActor(log.receiverId, ann?.receiverId, p.receiverId);
  const courtSide = (resolveActor(log.courtSide, ann?.courtSide, p.courtSide) as 'deuce' | 'ad' | undefined);
  const hitterId = resolveActor(log.hitterId, ann?.hitterId, p.hitterId);

  const pointDetails = {
    ...p.pointDetails,
    isFirstServe,
    isSecondServe,
    rallyDetails,
    rallyLength,
    firstFaultDetail,
    serverId,
    receiverId,
    courtSide,
    hitterId,
  };

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
    hasAudioNote,
    audioNoteDuration,
    serverId,
    receiverId,
    courtSide,
    hitterId,
    pointDetails,
  };
}
